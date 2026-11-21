// Plan 1, tâche 6 : colonnes de recherche des chansons et des artistes (spec §6.1).
import { detectScript } from "@/lib/text/detectScript";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { toSearchKey } from "@/lib/text/searchKey";

export interface ArtistNames {
  nameAr?: string | null;
  nameLatin?: string | null;
  aliases?: string[];
}

export interface SearchColumns {
  searchAr: string;
  searchLatin: string;
  searchKey: string;
}

function uniqueJoin(parts: string[]): string {
  return [...new Set(parts.filter((p) => p.length > 0))].join(" ");
}

function columnsFor(texts: string[]): SearchColumns {
  return {
    searchAr: uniqueJoin(texts.filter((t) => detectScript(t) !== "latin").map(normalizeArabic)),
    searchLatin: uniqueJoin(texts.filter((t) => detectScript(t) !== "arabic").map(normalizeLatin)),
    searchKey: uniqueJoin(texts.map(toSearchKey)),
  };
}

function artistTexts(a: ArtistNames): string[] {
  return [a.nameAr, a.nameLatin, ...(a.aliases ?? [])].filter((t): t is string => !!t);
}

export function artistSearchColumns(a: ArtistNames): SearchColumns {
  return columnsFor(artistTexts(a));
}

export function songSearchColumns(s: {
  titleAr?: string | null;
  titleLatin?: string | null;
  lyrics: string;
  artists: ArtistNames[];
}): SearchColumns & { lyricsSearchAr: string; lyricsSearchKey: string } {
  const titles = [s.titleAr, s.titleLatin].filter((t): t is string => !!t);
  return {
    ...columnsFor([...titles, ...s.artists.flatMap(artistTexts)]),
    lyricsSearchAr: normalizeArabic(s.lyrics),
    lyricsSearchKey: toSearchKey(s.lyrics),
  };
}
