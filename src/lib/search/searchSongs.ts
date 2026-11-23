import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import type { Dialect } from "@/lib/db/schema";
import {
  findSnippet,
  LYRICS_KEY_MIN_LENGTH,
  LYRICS_KEY_SCORE_MIN_LENGTH,
  lyricsWords,
  MIN_SIGNIFICANT,
  prepareQuery,
  SCORE,
  TITLE_KEY_MIN_LENGTH,
  WHOLE_KEY_MIN_LENGTH,
  WORD_SIMILARITY_THRESHOLD,
  type PreparedQuery,
} from "./query";
import { PAGE_SIZE, type ArtistRef, type SearchOptions, type SearchResult } from "./types";

const COL = {
  searchAr: sql.raw("s.search_ar"),
  searchLatin: sql.raw("s.search_latin"),
  searchKey: sql.raw("s.search_key"),
  lyricsSearchAr: sql.raw("s.lyrics_search_ar"),
  lyricsSearchKey: sql.raw("s.lyrics_search_key"),
};

// Les chaînes normalisées ne contiennent que des lettres, des chiffres et des espaces :
// aucun caractère spécial de LIKE (% ou _) ne peut s'y trouver.
const contains = (column: SQL, value: string): SQL => sql`${column} LIKE ${`%${value}%`}`;
const wordStart = (column: SQL, value: string): SQL => sql`(' ' || ${column}) LIKE ${`% ${value}%`}`;
// Expression régulière plutôt que `' ' || colonne LIKE` : pg_trgm la sert par l'index GIN de la colonne.
// Une clé ne contient que des lettres minuscules : aucun caractère spécial ne peut s'y glisser.
const wholeWord = (column: SQL, value: string): SQL => sql`${column} ~ ${`(^| )${value}( |$)`}`;
const or = (parts: SQL[]): SQL => (parts.length > 0 ? sql`(${sql.join(parts, sql` OR `)})` : sql`false`);

/**
 * Barème de la spec §6.2 (valeurs dans `SCORE`) : titre ou artiste qui commence par la requête, en texte
 * exact (10 points) ou seulement par sa clé (5 points) ; meilleure word_similarity des colonnes, jusqu'à
 * 6 points ; passage trouvé dans les paroles, 3 points. Des paroles qui n'ont que tous les mots de la requête arabe
 * (`lyricsWords`) sont trouvées, sans points.
 */
function buildClauses(q: PreparedQuery, inLyrics: boolean): { score: SQL; lyricsMatch: SQL; where: SQL } {
  const textPrefix: SQL[] = [];
  const keyPrefix: SQL[] = [];
  const similarity: SQL[] = [];
  const match: SQL[] = [];
  const texts: Array<[string, SQL]> = [
    [q.ar, COL.searchAr],
    [q.lat, COL.searchLatin],
  ];
  for (const [value, column] of texts) {
    if (!value) continue;
    textPrefix.push(wordStart(column, value));
    similarity.push(sql`word_similarity(${value}, ${column})`);
    match.push(sql`${value} <% ${column}`, contains(column, value));
  }
  if (q.key.length >= TITLE_KEY_MIN_LENGTH) {
    keyPrefix.push(wordStart(COL.searchKey, q.key));
    similarity.push(sql`${SCORE.keySimilarityFactor} * word_similarity(${q.key}, ${COL.searchKey})`);
    match.push(sql`${q.key} <% ${COL.searchKey}`, contains(COL.searchKey, q.key));
  } else if (q.key.length >= WHOLE_KEY_MIN_LENGTH) {
    const whole = wholeWord(COL.searchKey, q.key);
    keyPrefix.push(whole);
    match.push(whole);
  }

  const lyrics: SQL[] = [];
  const scoredLyrics: SQL[] = [];
  if (inLyrics && q.ar) {
    const found = contains(COL.lyricsSearchAr, q.ar);
    lyrics.push(found);
    scoredLyrics.push(found);
    const words = lyricsWords(q);
    if (words.length > 0) {
      // Chaque mot passe par l'index GIN de la colonne, et PostgreSQL croise les résultats.
      const each = words.map((w) => contains(COL.lyricsSearchAr, w));
      lyrics.push(sql`(${sql.join(each, sql` AND `)})`);
    }
  }
  // Spec §6.2 : la clé ne cherche dans les paroles que pour une requête en latin ; en arabe, le texte
  // normalisé suffit, et une clé de 4 consonnes se retrouve dans les paroles d'une chanson sur dix.
  if (inLyrics && q.lat && q.key.length >= LYRICS_KEY_MIN_LENGTH) {
    const found = contains(COL.lyricsSearchKey, q.key);
    lyrics.push(found);
    if (q.key.length >= LYRICS_KEY_SCORE_MIN_LENGTH) scoredLyrics.push(found);
  }
  match.push(...lyrics);

  const best = similarity.length > 0 ? sql.join(similarity, sql`, `) : sql`0`;
  const score = sql`((CASE WHEN ${or(textPrefix)} THEN ${SCORE.textPrefix}
      WHEN ${or(keyPrefix)} THEN ${SCORE.keyPrefix} ELSE 0 END)
    + ${SCORE.similarity} * GREATEST(${best})
    + (CASE WHEN ${or(scoredLyrics)} THEN ${SCORE.lyrics} ELSE 0 END))`;
  return { score, lyricsMatch: or(lyrics), where: or(match) };
}

interface RawRow extends Record<string, unknown> {
  id: string;
  title_ar: string | null;
  title_latin: string | null;
  dialect: Dialect;
  total: string;
  lyrics: string | null;
  artists: ArtistRef[];
}

/**
 * Interface unique de recherche (plan 1, tâche 7) : titre, artistes et paroles, en arabe comme en
 * arabizi, dans les chansons publiées, 20 résultats par page. Au-delà de la dernière page, la liste est
 * vide et le total vaut 0.
 */
export async function searchSongs(raw: string, opts: SearchOptions = {}): Promise<SearchResult> {
  const requested = Math.floor(opts.page ?? 1);
  const page = Number.isFinite(requested) ? Math.max(1, requested) : 1;
  const q = prepareQuery(raw);
  if (q.significant < MIN_SIGNIFICANT) return { items: [], total: 0, page, tooShort: true };

  const { score, lyricsMatch, where } = buildClauses(q, opts.inLyrics ?? true);
  const filters: SQL[] = [sql`s.status = 'published'`, where];
  if (opts.dialect) filters.push(sql`s.dialect = ${opts.dialect}`);
  if (opts.artistId) {
    filters.push(
      sql`EXISTS (SELECT 1 FROM song_artists f WHERE f.song_id = s.id AND f.artist_id::text = ${opts.artistId})`,
    );
  }
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('pg_trgm.word_similarity_threshold', ${String(WORD_SIMILARITY_THRESHOLD)}, true)`,
    );
    const res = await tx.execute<RawRow>(sql`
      WITH page AS (
        SELECT s.id, s.title_ar, s.title_latin, s.dialect,
          ${lyricsMatch} AS lyrics_match,
          ${score} AS score,
          count(*) OVER () AS total
        FROM songs s
        WHERE ${sql.join(filters, sql` AND `)}
        ORDER BY score DESC, COALESCE(s.title_latin, s.title_ar) ASC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      )
      SELECT p.id, p.title_ar, p.title_latin, p.dialect, p.total,
        CASE WHEN p.lyrics_match THEN (SELECT l.lyrics FROM songs l WHERE l.id = p.id) END AS lyrics,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', a.id, 'nameAr', a.name_ar, 'nameLatin', a.name_latin, 'role', sa.role
          ) ORDER BY sa.position)
          FROM song_artists sa JOIN artists a ON a.id = sa.artist_id
          WHERE sa.song_id = p.id
        ), '[]'::json) AS artists
      FROM page p
      ORDER BY p.score DESC, COALESCE(p.title_latin, p.title_ar) ASC`);
    return res.rows;
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      titleAr: r.title_ar,
      titleLatin: r.title_latin,
      dialect: r.dialect,
      artists: r.artists,
      snippet: r.lyrics ? findSnippet(r.lyrics, q) : null,
    })),
    total: rows.length > 0 ? Number(rows[0].total) : 0,
    page,
    tooShort: false,
  };
}
