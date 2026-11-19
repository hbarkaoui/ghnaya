import { SONGS } from "@/mocks/catalog";
import { searchCatalog, SIMULATED_LATENCY_MS } from "@/mocks/search";
import type { SearchOptions, SearchResult } from "./types";

export { findSnippet, prepareQuery, type PreparedQuery } from "./query";

/**
 * Interface unique de recherche (plan 1, tâche 7) : titre, artistes et paroles, en arabe comme en
 * arabizi, 20 résultats par page.
 *
 * MAQUETTE : cherche dans les chansons fictives, avec un délai simulé. Le plan 1 remplacera ce corps
 * par la requête SQL (pg_trgm), sans changer la signature ni le type SongHit.
 */
export async function searchSongs(raw: string, opts: SearchOptions = {}): Promise<SearchResult> {
  const result = searchCatalog(SONGS, raw, opts);
  if (!result.tooShort && SIMULATED_LATENCY_MS > 0) await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return result;
}
