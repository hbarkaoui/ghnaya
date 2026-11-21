// Plan 1, tâche 7 (adaptée) : écrit le catalogue fictif en base, pour les tests et la base de développement.
import { eq } from "drizzle-orm";
import { upsertArtist } from "@/lib/catalog/artists";
import { upsertSong, type SongArtistRef } from "@/lib/catalog/songs";
import type { Db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { SONGS } from "@/mocks/catalog";

/**
 * Écrit les chansons publiées du catalogue fictif et renvoie, pour chacune, son identifiant fictif
 * (`s-sidi-mansour`) associé à son UUID en base. Idempotent : relancé, il met à jour les mêmes lignes.
 */
export async function seedFixtures(db: Db): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const song of SONGS) {
    const refs: SongArtistRef[] = [];
    for (const a of song.artists) {
      const artist = await upsertArtist(db, { nameAr: a.nameAr ?? undefined, nameLatin: a.nameLatin ?? undefined });
      refs.push({ ...artist, role: a.role });
    }
    const { id } = await upsertSong(db, {
      titleAr: song.titleAr ?? undefined,
      titleLatin: song.titleLatin ?? undefined,
      lyrics: song.lyrics,
      dialect: song.dialect,
      source: song.source === "public_domain" ? "public_domain" : "lrclib",
      sourceRef: `fixture-${song.id}`,
      artists: refs,
    });
    // La translittération fictive (automatique ou relue) est reprise telle quelle.
    await db
      .update(songs)
      .set({ lyricsTranslit: song.lyricsTranslit, translitStatus: song.translitStatus })
      .where(eq(songs.id, id));
    ids.set(song.id, id);
  }
  return ids;
}
