import type { ReaderEntry, Song } from "@/types/catalog";

/**
 * Entrée du lecteur pour une chanson : seulement ce dont il a besoin (pas la source ni le dialecte).
 * Sans position ni note, c'est une chanson seule (mode séance depuis la fiche) : 1 / 1.
 */
export function toReaderEntry(song: Song, position = 1, note: string | null = null): ReaderEntry {
  const { id, titleAr, titleLatin, lyrics, lyricsTranslit, translitStatus, artists } = song;
  return { position, note, song: { id, titleAr, titleLatin, lyrics, lyricsTranslit, translitStatus, artists } };
}
