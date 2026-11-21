// Plan 1, tâche 6 : écriture idempotente des chansons importées (LRCLIB, domaine public).
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { songArtists, type Dialect } from "@/lib/db/schema";
import { toSearchKey } from "@/lib/text/searchKey";
import type { UpsertedArtist } from "./artists";
import { songSearchColumns } from "./searchColumns";

export interface SongArtistRef extends UpsertedArtist {
  role: "main" | "feat";
}

export interface ImportSongInput {
  titleAr?: string;
  titleLatin?: string;
  lyrics: string;
  lyricsTranslit?: string;
  translitStatus?: "none" | "reviewed";
  dialect: Dialect;
  source: "lrclib" | "public_domain";
  sourceRef: string;
  /** artists[0] est l'artiste principal. */
  artists: SongArtistRef[];
}

export type UpsertOutcome = "inserted" | "updated" | "locked";

export function songDedupeKey(mainIdentityKey: string, title: string): string {
  return `${mainIdentityKey}|${toSearchKey(title)}`;
}

/**
 * Insère la chanson, ou met à jour celle qui a la même clé de dédoublonnage. Ne touche jamais une chanson
 * verrouillée (`import_locked`), ni le statut d'aucune : un import ne publie ni ne retire rien.
 */
export async function upsertSong(db: Db, input: ImportSongInput): Promise<{ id: string; outcome: UpsertOutcome }> {
  const title = input.titleAr ?? input.titleLatin;
  if (!title) throw new Error("Une chanson doit avoir un titre.");
  const uniqueArtists = input.artists.filter((a, i, all) => all.findIndex((b) => b.id === a.id) === i);
  if (uniqueArtists.length === 0) throw new Error("Une chanson doit avoir un artiste.");
  const dedupeKey = songDedupeKey(uniqueArtists[0].identityKey, title);
  const cols = songSearchColumns({
    titleAr: input.titleAr,
    titleLatin: input.titleLatin,
    lyrics: input.lyrics,
    artists: uniqueArtists.map((a) => a.names),
  });

  return db.transaction(async (tx) => {
    const res = await tx.execute<{ id: string; inserted: boolean }>(sql`
      INSERT INTO songs (title_ar, title_latin, lyrics, lyrics_translit, translit_status, dialect,
        source, source_ref, dedupe_key, search_ar, search_latin, search_key,
        lyrics_search_ar, lyrics_search_key)
      VALUES (${input.titleAr ?? null}, ${input.titleLatin ?? null}, ${input.lyrics},
        ${input.lyricsTranslit ?? null}, ${input.translitStatus ?? "none"}, ${input.dialect},
        ${input.source}, ${input.sourceRef}, ${dedupeKey}, ${cols.searchAr}, ${cols.searchLatin},
        ${cols.searchKey}, ${cols.lyricsSearchAr}, ${cols.lyricsSearchKey})
      ON CONFLICT (source, dedupe_key) WHERE source <> 'contribution' DO UPDATE SET
        title_ar = EXCLUDED.title_ar,
        title_latin = EXCLUDED.title_latin,
        lyrics = EXCLUDED.lyrics,
        lyrics_translit = CASE
          WHEN EXCLUDED.lyrics_translit IS NULL AND songs.lyrics = EXCLUDED.lyrics THEN songs.lyrics_translit
          ELSE EXCLUDED.lyrics_translit END,
        translit_status = CASE
          WHEN EXCLUDED.lyrics_translit IS NULL AND songs.lyrics = EXCLUDED.lyrics THEN songs.translit_status
          ELSE EXCLUDED.translit_status END,
        dialect = EXCLUDED.dialect,
        source_ref = EXCLUDED.source_ref,
        search_ar = EXCLUDED.search_ar,
        search_latin = EXCLUDED.search_latin,
        search_key = EXCLUDED.search_key,
        lyrics_search_ar = EXCLUDED.lyrics_search_ar,
        lyrics_search_key = EXCLUDED.lyrics_search_key,
        updated_at = now()
      WHERE songs.import_locked = false
      RETURNING id, (xmax = 0) AS inserted`);

    if (res.rows.length === 0) {
      const existing = await tx.execute<{ id: string }>(
        sql`SELECT id FROM songs WHERE source = ${input.source} AND dedupe_key = ${dedupeKey}`,
      );
      return { id: existing.rows[0].id, outcome: "locked" as const };
    }

    const { id, inserted } = res.rows[0];
    await tx.delete(songArtists).where(eq(songArtists.songId, id));
    await tx
      .insert(songArtists)
      .values(uniqueArtists.map((a, position) => ({ songId: id, artistId: a.id, role: a.role, position })));
    return { id, outcome: inserted ? ("inserted" as const) : ("updated" as const) };
  });
}
