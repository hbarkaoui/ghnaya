// Plan 1, tâche 7 : types de la recherche. Dialect et ArtistRef viennent de @/types/catalog
// (le plan 1 les importera de son schéma Drizzle, avec les mêmes valeurs).
import type { ArtistRef, Dialect } from "@/types/catalog";

export type { ArtistRef, Dialect };

export const PAGE_SIZE = 20;

export interface SongHit {
  id: string;
  titleAr: string | null;
  titleLatin: string | null;
  dialect: Dialect;
  artists: ArtistRef[];
  /** Ligne de paroles qui correspond à la requête, ou `null` si la correspondance vient du titre ou des artistes. */
  snippet: string | null;
}

export interface SearchOptions {
  artistId?: string;
  dialect?: Dialect;
  page?: number;
}

export interface SearchResult {
  items: SongHit[];
  /** Nombre total de résultats ; vaut 0 au-delà de la dernière page. */
  total: number;
  page: number;
  tooShort: boolean;
}
