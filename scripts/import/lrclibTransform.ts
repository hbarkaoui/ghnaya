// Plan 1, tâche 10 : fonctions pures de l'import LRCLIB (spec §11.1) : filtre, nettoyage, dédoublonnage.
import { artistIdentityKey, type ArtistInput } from "@/lib/catalog/artists";
import { songDedupeKey } from "@/lib/catalog/songs";
import { arabicRatio } from "@/lib/text/arabicRatio";
import { cleanImportedTitle, splitArtists, splitTitleScripts } from "@/lib/text/titles";
import type { AliasIndex } from "./artistAliases";
import type { LrclibTrack } from "./lrclibReader";

/** Une piste est gardée si au moins la moitié des lettres de ses paroles sont arabes. */
export const MIN_ARABIC_RATIO = 0.5;
export type Rejection = "empty_lyrics" | "not_arabic" | "no_artist" | "empty_title";

export interface Candidate {
  lrclibId: number;
  titleAr?: string;
  titleLatin?: string;
  lyrics: string;
  /** artists[0] est l'artiste principal. */
  artists: ArtistInput[];
  dedupeKey: string;
}

export function transformTrack(track: LrclibTrack, aliases: AliasIndex): Candidate | { rejected: Rejection } {
  const lyrics = track.plainLyrics.replace(/\r\n?/g, "\n").trim();
  if (!lyrics) return { rejected: "empty_lyrics" };
  if (arabicRatio(lyrics) < MIN_ARABIC_RATIO) return { rejected: "not_arabic" };

  const artistNames = splitArtists(track.artistName);
  if (artistNames.length === 0) return { rejected: "no_artist" };

  const cleaned = cleanImportedTitle(track.name, artistNames);
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
