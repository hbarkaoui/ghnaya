// Plan 1, tâche 10 : fonctions pures de l'import LRCLIB (spec §11.1) : filtre, nettoyage, dédoublonnage.
import { artistIdentityKey, type ArtistInput } from "@/lib/catalog/artists";
import { songDedupeKey } from "@/lib/catalog/songs";
import { arabicRatio } from "@/lib/text/arabicRatio";
import { cleanImportedTitle, splitArtists, splitTitleScripts } from "@/lib/text/titles";
import type { AliasIndex } from "./artistAliases";
import type { LrclibTrack } from "./lrclibReader";

/** Une piste est gardée si au moins la moitié des lettres de ses paroles sont arabes. */
export const MIN_ARABIC_RATIO = 0.5;
export type Rejection = "empty_lyrics" | "not_arabic" | "persian_or_urdu" | "no_artist" | "empty_title";

const count = (text: string, letters: string): number => {
  let n = 0;
  for (const ch of text) if (letters.includes(ch)) n += 1;
  return n;
};

/**
 * Tâche 15 : le persan et l'ourdou s'écrivent avec l'alphabet arabe et passent `MIN_ARABIC_RATIO` ; ils
 * faisaient 40 % du premier import. Deux signes : les claviers persan et ourdou tapent ی et ک (U+06CC,
 * U+06A9) au lieu de ي et ك, et ces langues ont des lettres propres (پ ژ ٹ ڈ ڑ ں ے). چ et گ n'en sont pas :
 * l'arabe irakien et du Golfe les écrit aussi.
 */
export function looksPersianOrUrdu(lyrics: string): boolean {
  return count(lyrics, "یک") > count(lyrics, "يك") || count(lyrics, "پژٹڈڑںے") >= 2;
}

export interface Candidate {
  lrclibId: number;
  titleAr?: string;
  titleLatin?: string;
  lyrics: string;
  /** artists[0] est l'artiste principal. */
  artists: ArtistInput[];
  dedupeKey: string;
}

/** Séparateur des valeurs multiples des tags ID3v2.4 : PostgreSQL refuse cet octet dans un texte. */
const NUL = "\u0000";

export function transformTrack(track: LrclibTrack, aliases: AliasIndex): Candidate | { rejected: Rejection } {
  const lyrics = track.plainLyrics.replaceAll(NUL, "").replace(/\r\n?/g, "\n").trim();
  if (!lyrics) return { rejected: "empty_lyrics" };
  if (arabicRatio(lyrics) < MIN_ARABIC_RATIO) return { rejected: "not_arabic" };
  if (looksPersianOrUrdu(lyrics)) return { rejected: "persian_or_urdu" };

  const artistNames = splitArtists(track.artistName);
  if (artistNames.length === 0) return { rejected: "no_artist" };

  const name = track.name
    .split(NUL)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" / ");
  const cleaned = cleanImportedTitle(name, artistNames);
  const titles = splitTitleScripts(cleaned.title);
  const title = titles.titleAr ?? titles.titleLatin;
  if (!title) return { rejected: "empty_title" };

  const seen = new Set<string>();
  const artists = [...artistNames, ...cleaned.featuring]
    .map((n) => aliases.resolve(n))
    .filter((a) => {
      if (!a.nameAr && !a.nameLatin) return false;
      const key = artistIdentityKey(a);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (artists.length === 0) return { rejected: "no_artist" };

  return {
    lrclibId: track.id,
    ...titles,
    lyrics,
    artists,
    dedupeKey: songDedupeKey(artistIdentityKey(artists[0]), title),
  };
}

/** Les paroles les plus longues l'emportent ; à égalité, le plus petit identifiant LRCLIB. */
function isBetter(c: Candidate, current: Candidate): boolean {
  if (c.lyrics.length !== current.lyrics.length) return c.lyrics.length > current.lyrics.length;
  return c.lrclibId < current.lrclibId;
}

/** Garde la meilleure version de chaque chanson, en complétant le titre arabe ou latin par les doublons. */
export function keepBest(best: Map<string, Candidate>, c: Candidate): void {
  const current = best.get(c.dedupeKey);
  if (!current) {
    best.set(c.dedupeKey, c);
    return;
  }
  const [winner, other] = isBetter(c, current) ? [c, current] : [current, c];
  best.set(c.dedupeKey, {
    ...winner,
    titleAr: winner.titleAr ?? other.titleAr,
    titleLatin: winner.titleLatin ?? other.titleLatin,
  });
}
