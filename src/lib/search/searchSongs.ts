import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import type { Dialect } from "@/lib/db/schema";
import {
  findSnippet,
  LYRICS_KEY_MIN_LENGTH,
  MIN_SIGNIFICANT,
  prepareQuery,
  TITLE_KEY_MIN_LENGTH,
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
const or = (parts: SQL[]): SQL => (parts.length > 0 ? sql`(${sql.join(parts, sql` OR `)})` : sql`false`);

/**
 * Barème de la spec §6.2 : titre ou artiste qui commence par la requête, 10 points ; meilleure
 * word_similarity des trois colonnes, jusqu'à 6 points ; passage trouvé dans les paroles, 3 points.
 */
function buildClauses(q: PreparedQuery): { score: SQL; lyricsMatch: SQL; where: SQL } {
  const prefix: SQL[] = [];
  const similarity: SQL[] = [];
  const lyrics: SQL[] = [];
  const match: SQL[] = [];
  const parts: Array<[string, SQL]> = [
    [q.ar, COL.searchAr],
    [q.lat, COL.searchLatin],
  ];
  if (q.key.length >= TITLE_KEY_MIN_LENGTH) parts.push([q.key, COL.searchKey]);
  for (const [value, column] of parts) {
    if (!value) continue;
    prefix.push(wordStart(column, value));
    similarity.push(sql`word_similarity(${value}, ${column})`);
    match.push(sql`${value} <% ${column}`, contains(column, value));
  }
  if (q.ar) lyrics.push(contains(COL.lyricsSearchAr, q.ar));
  if (q.key.length >= LYRICS_KEY_MIN_LENGTH) lyrics.push(contains(COL.lyricsSearchKey, q.key));
  match.push(...lyrics);

  const lyricsMatch = or(lyrics);
  const best = similarity.length > 0 ? sql.join(similarity, sql`, `) : sql`0`;
  const score = sql`((CASE WHEN ${or(prefix)} THEN 10 ELSE 0 END)
    + 6 * GREATEST(${best})
    + (CASE WHEN ${lyricsMatch} THEN 3 ELSE 0 END))`;
  return { score, lyricsMatch, where: or(match) };
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

  const { score, lyricsMatch, where } = buildClauses(q);
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
