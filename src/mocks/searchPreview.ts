import type { SearchOptions, SearchResult } from "@/lib/search/types";
import { SONGS } from "./catalog";
import { searchCatalog, SIMULATED_LATENCY_MS } from "./search";

/**
 * Aperçus de développement de /recherche, par le paramètre `?apercu=` (jamais en production) :
 *  - `limite` : simule la limite de requêtes atteinte (plan 1, tâche 9 : 60 recherches par minute) ;
 *  - `pagination` : pages de 3 résultats, car le jeu fictif compte moins de 20 chansons.
 */
export const SEARCH_PREVIEWS = ["limite", "pagination"] as const;
export type SearchPreview = (typeof SEARCH_PREVIEWS)[number];
export const PREVIEW_PAGE_SIZE = 3;

export function searchPreviewFrom(value: string | string[] | undefined): SearchPreview | null {
  if (process.env.NODE_ENV === "production") return null;
  const v = Array.isArray(value) ? value[0] : value;
  return SEARCH_PREVIEWS.includes(v as SearchPreview) ? (v as SearchPreview) : null;
}

export async function searchWithSmallPages(raw: string, opts: SearchOptions): Promise<SearchResult> {
  const result = searchCatalog(SONGS, raw, opts, PREVIEW_PAGE_SIZE);
  if (!result.tooShort) await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  return result;
}
