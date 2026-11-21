// Plan 1, tâche 15 : recalcule les colonnes de recherche après un changement de `lib/text` (table des
// consonnes, normalisation), sans relancer d'import. La clé de dédoublonnage contient la clé du titre :
// elle est recalculée aussi, sinon le prochain import créerait en double les chansons concernées.
import { sql } from "drizzle-orm";
import { artistSearchColumns, songSearchColumns, type ArtistNames } from "@/lib/catalog/searchColumns";
import { songDedupeKey } from "@/lib/catalog/songs";
import type { Db } from "@/lib/db/client";

export interface ReindexReport {
  artistsUpdated: number;
  songsUpdated: number;
  /** Chansons dont la nouvelle clé de dédoublonnage est déjà prise : leur ancienne clé est gardée. */
  dedupeConflicts: number;
}

const BATCH = 500;
const MAX_LOGGED_CONFLICTS = 20;
const FIRST_ID = "00000000-0000-0000-0000-000000000000";

interface ArtistRow extends Record<string, unknown> {
  id: string;
  name_ar: string | null;
  name_latin: string | null;
  aliases: string[];
  search_ar: string;
  search_latin: string;
  search_key: string;
}

interface SongRow extends Record<string, unknown> {
  id: string;
  title_ar: string | null;
  title_latin: string | null;
  lyrics: string;
  source: string;
  dedupe_key: string;
  search_ar: string;
  search_latin: string;
  search_key: string;
  lyrics_search_ar: string;
  lyrics_search_key: string;
  artists: Array<ArtistNames & { identityKey: string }>;
}

async function reindexArtists(db: Db): Promise<number> {
  let updated = 0;
  for (let last = FIRST_ID; ; ) {
    const res = await db.execute<ArtistRow>(sql`
      SELECT id, name_ar, name_latin, aliases, search_ar, search_latin, search_key
      FROM artists WHERE id > ${last}::uuid ORDER BY id LIMIT ${BATCH}`);
    if (res.rows.length === 0) return updated;
    await db.transaction(async (tx) => {
      for (const a of res.rows) {
        const c = artistSearchColumns({ nameAr: a.name_ar, nameLatin: a.name_latin, aliases: a.aliases });
        if (c.searchAr === a.search_ar && c.searchLatin === a.search_latin && c.searchKey === a.search_key) continue;
        await tx.execute(sql`UPDATE artists SET search_ar = ${c.searchAr}, search_latin = ${c.searchLatin},
          search_key = ${c.searchKey} WHERE id = ${a.id}`);
        updated += 1;
      }
    });
    last = res.rows[res.rows.length - 1].id;
  }
}

async function reindexSongs(db: Db, log: (line: string) => void): Promise<Omit<ReindexReport, "artistsUpdated">> {
  const report = { songsUpdated: 0, dedupeConflicts: 0 };
  for (let last = FIRST_ID; ; ) {
    const res = await db.execute<SongRow>(sql`
      SELECT s.id, s.title_ar, s.title_latin, s.lyrics, s.source, s.dedupe_key, s.search_ar, s.search_latin,
        s.search_key, s.lyrics_search_ar, s.lyrics_search_key,
        COALESCE((
          SELECT json_agg(json_build_object('nameAr', a.name_ar, 'nameLatin', a.name_latin, 'aliases', a.aliases,
            'identityKey', a.identity_key) ORDER BY sa.position)
          FROM song_artists sa JOIN artists a ON a.id = sa.artist_id WHERE sa.song_id = s.id
        ), '[]'::json) AS artists
      FROM songs s WHERE s.id > ${last}::uuid ORDER BY s.id LIMIT ${BATCH}`);
    if (res.rows.length === 0) return report;
    await db.transaction(async (tx) => {
      for (const s of res.rows) {
        const c = songSearchColumns({ titleAr: s.title_ar, titleLatin: s.title_latin, lyrics: s.lyrics, artists: s.artists });
        const title = s.title_ar ?? s.title_latin;
        let dedupeKey = s.artists[0] && title ? songDedupeKey(s.artists[0].identityKey, title) : s.dedupe_key;
        if (dedupeKey !== s.dedupe_key && s.source !== "contribution") {
          const taken = await tx.execute<{ id: string }>(sql`
            SELECT id FROM songs WHERE source = ${s.source}::song_source AND dedupe_key = ${dedupeKey} AND id <> ${s.id}`);
          if (taken.rows.length > 0) {
            report.dedupeConflicts += 1;
            if (report.dedupeConflicts <= MAX_LOGGED_CONFLICTS) {
              log(`Clé de dédoublonnage « ${dedupeKey} » déjà prise : chanson ${s.id} gardée telle quelle, voir ${taken.rows[0].id}`);
            }
            dedupeKey = s.dedupe_key;
          }
        }
        const same =
          dedupeKey === s.dedupe_key &&
          c.searchAr === s.search_ar &&
          c.searchLatin === s.search_latin &&
          c.searchKey === s.search_key &&
          c.lyricsSearchAr === s.lyrics_search_ar &&
          c.lyricsSearchKey === s.lyrics_search_key;
        if (same) continue;
        await tx.execute(sql`UPDATE songs SET dedupe_key = ${dedupeKey}, search_ar = ${c.searchAr},
          search_latin = ${c.searchLatin}, search_key = ${c.searchKey}, lyrics_search_ar = ${c.lyricsSearchAr},
          lyrics_search_key = ${c.lyricsSearchKey} WHERE id = ${s.id}`);
        report.songsUpdated += 1;
      }
    });
    last = res.rows[res.rows.length - 1].id;
    log(`… ${report.songsUpdated} chansons mises à jour`);
  }
}

/** Idempotent : relancé, il ne change plus rien. Ne touche ni `updated_at`, ni le statut, ni le contenu. */
export async function reindexSearch(db: Db, log: (line: string) => void = () => undefined): Promise<ReindexReport> {
  const artistsUpdated = await reindexArtists(db);
  return { artistsUpdated, ...(await reindexSongs(db, log)) };
}
