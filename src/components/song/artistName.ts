import type { ArtistRef } from "@/types/catalog";

/**
 * Nom d'artiste à afficher : dans l'écriture de l'interface quand il existe (latin en français,
 * arabe en arabe), sinon dans l'autre. `arabic` dit comment baliser le fragment (lang, dir).
 */
export function artistDisplayName(
  artist: Pick<ArtistRef, "nameAr" | "nameLatin">,
  locale: string,
): { name: string; arabic: boolean } {
  const preferArabic = locale === "ar";
  const arabicName = artist.nameAr ?? "";
  const latinName = artist.nameLatin ?? "";
  if (preferArabic ? arabicName : !latinName) return { name: arabicName, arabic: true };
  return { name: latinName, arabic: false };
}
