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

/**
 * Artistes principaux sur une ligne de texte simple (« A et B » / « A وB »), dans l'écriture de
 * l'interface ; les invités seulement s'il n'y a pas d'artiste principal. Pour les sous-titres
 * où un balisage par nom n'est pas possible (lecteur).
 */
export function artistsLine(artists: ArtistRef[], locale: string): string {
  const main = artists.filter((a) => a.role === "main");
  const shown = main.length > 0 ? main : artists;
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(
    shown.map((a) => artistDisplayName(a, locale).name),
  );
}

/** Les artistes d'une chanson sauf un : sur la page d'un artiste, chaque résultat ne nomme que les autres. */
export const artistsExcept = (artists: ArtistRef[], id: string): ArtistRef[] => artists.filter((a) => a.id !== id);
