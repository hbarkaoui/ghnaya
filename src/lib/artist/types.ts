import type { SongHit } from "@/lib/search/types";
import type { ArtistRef } from "@/types/catalog";

/** Une page de /artiste/[id] : lue en base (`lib/catalog/queries`) ou dans le catalogue fictif. */
export interface ArtistPage {
  artist: Pick<ArtistRef, "id" | "nameAr" | "nameLatin">;
  /** Chansons publiées de l'artiste, principal ou invité. */
  total: number;
  page: number;
  lastPage: number;
  /** Chansons de la page, sous la forme d'un résultat de recherche sans extrait (SongResultItem). */
  items: SongHit[];
}
