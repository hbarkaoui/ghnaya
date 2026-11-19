import type { Song } from "@/types/catalog";

/**
 * Titre d'une chanson sur une seule ligne (onglet du navigateur, métadonnées) : dans l'écriture de
 * l'interface quand il existe (latin en français, arabe en arabe), sinon l'autre.
 */
export function songDisplayTitle(song: Pick<Song, "titleAr" | "titleLatin">, locale: string): string {
  const preferred = locale === "ar" ? song.titleAr : song.titleLatin;
  return preferred ?? song.titleAr ?? song.titleLatin ?? "";
}
