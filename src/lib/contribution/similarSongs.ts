import "server-only";
import { suggestArtists } from "@/lib/contribution/artists";
import { searchSongs } from "@/lib/search/searchSongs";
import type { SongHit } from "@/lib/search/types";

export const SIMILAR_MAX = 3;

/**
 * « Existe peut-être déjà » (spec §8.2) : les chansons dont le titre ressemble à l'un des titres saisis,
 * celles des artistes saisis en premier, 3 au plus, sans extrait de paroles (écart 5). La recherche porte
 * sur les titres : avec les paroles, un mot courant (« الليل ») ferait remonter des chansons sans rapport.
 */
export async function findSimilarSongs(
  { titles, artists }: { titles: string[]; artists: string[] },
  limit = SIMILAR_MAX,
): Promise<SongHit[]> {
  const hits: SongHit[] = [];
  for (const title of titles.map((t) => t.trim()).filter(Boolean)) {
    for (const hit of (await searchSongs(title, { inLyrics: false })).items) {
      if (!hits.some((h) => h.id === hit.id)) hits.push(hit);
    }
  }
  const names = artists.map((a) => a.trim()).filter(Boolean);
  const sameArtist = (hit: SongHit) => names.some((name) => suggestArtists(name, hit.artists).length > 0);
  return [...hits.filter(sameArtist), ...hits.filter((hit) => !sameArtist(hit))].slice(0, limit);
}
