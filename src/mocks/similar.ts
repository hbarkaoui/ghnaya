import { suggestArtists } from "@/lib/contribution/artists";
import type { SongHit } from "@/lib/search/types";
import type { Song } from "@/types/catalog";
import { searchCatalog } from "./search";

export const SIMILAR_MAX = 3;

/** Le même catalogue sans les paroles, pour ne rapprocher les chansons que par leur titre et leurs artistes. */
const titlesOnly = new WeakMap<readonly Song[], Song[]>();
function withoutLyrics(songs: readonly Song[]): Song[] {
  let copy = titlesOnly.get(songs);
  if (!copy) {
    copy = songs.map((song) => ({ ...song, lyrics: "" }));
    titlesOnly.set(songs, copy);
  }
  return copy;
}

/**
 * « Existe peut-être déjà » (spec §8.2) : les chansons dont le titre ressemble à l'un des titres
 * saisis, celles des artistes saisis en premier, 3 au plus, sans extrait de paroles.
 * MAQUETTE : rejoue la recherche fictive ; le plan 3 appellera searchSongs sur le titre et l'artiste.
 */
export function findSimilarSongs(
  songs: readonly Song[],
  { titles, artists }: { titles: string[]; artists: string[] },
  limit = SIMILAR_MAX,
): SongHit[] {
  const catalog = withoutLyrics(songs);
  const hits: SongHit[] = [];
  for (const title of titles.map((t) => t.trim()).filter(Boolean)) {
    for (const hit of searchCatalog(catalog, title).items) if (!hits.some((h) => h.id === hit.id)) hits.push(hit);
  }
  const names = artists.map((a) => a.trim()).filter(Boolean);
  const sameArtist = (hit: SongHit) => names.some((name) => suggestArtists(name, hit.artists).length > 0);
  return [...hits.filter(sameArtist), ...hits.filter((hit) => !sameArtist(hit))].slice(0, limit);
}
