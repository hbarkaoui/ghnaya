import { ARTIST_PAGE_SIZE } from "@/lib/artist/routes";
import type { SongHit } from "@/lib/search/types";
import type { ArtistRef, Song } from "@/types/catalog";
import { SONGS } from "./catalog";

export interface ArtistPage {
  artist: Pick<ArtistRef, "id" | "nameAr" | "nameLatin">;
  /** Chansons publiées de l'artiste, principal ou invité. */
  total: number;
  page: number;
  lastPage: number;
  /** Chansons de la page, sous la forme d'un résultat de recherche sans extrait (SongResultItem). */
  items: SongHit[];
}

/** Clé de tri du plan 1 (`getArtistWithSongs`) : COALESCE(title_latin, title_ar). */
const sortKey = (song: Song) => song.titleLatin ?? song.titleAr ?? "";

/**
 * Page artiste lue dans un catalogue : l'artiste, le nombre de ses chansons et une page de ces chansons,
 * triées par titre. `null` si aucune chanson publiée ne cite l'artiste. Au-delà de la dernière page, la
 * liste est vide et le total reste connu.
 */
export function artistPage(songs: Song[], id: string, page: number, pageSize = ARTIST_PAGE_SIZE): ArtistPage | null {
  const own = songs.filter((song) => song.artists.some((a) => a.id === id));
  const ref = own[0]?.artists.find((a) => a.id === id);
  if (!ref) return null;

  const sorted = [...own].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const start = (page - 1) * pageSize;
  return {
    artist: { id: ref.id, nameAr: ref.nameAr, nameLatin: ref.nameLatin },
    total: sorted.length,
    page,
    lastPage: Math.max(1, Math.ceil(sorted.length / pageSize)),
    items: sorted.slice(start, start + pageSize).map(({ id: songId, titleAr, titleLatin, dialect, artists }) => ({
      id: songId,
      titleAr,
      titleLatin,
      dialect,
      artists,
      snippet: null,
    })),
  };
}

/**
 * MAQUETTE : page artiste dans les chansons publiées en mémoire (une chanson retirée n'y est plus).
 * Le plan 1 (tâche 8) remplacera ce corps par `getArtistWithSongs`, avec la même pagination.
 */
export const getArtistPage = (id: string, page: number): ArtistPage | null => artistPage(SONGS, id, page);
