import { readablePositions } from "@/lib/playlist/rows";
import type { Playlist } from "@/types/catalog";
import { PLAYLISTS, getPlaylist, getRemovedSong, getSong } from "./catalog";

/**
 * MAQUETTE : modifications des playlists, en mémoire. Elles durent le temps du serveur de
 * développement (un redémarrage, ou la modification de catalog.ts, les efface). Le plan des
 * playlists les remplacera par des écritures en base, avec les mêmes contrôles de droits.
 */

/** Change le nom ou les chansons d'une playlist, et note l'heure de la modification (tri de « Vos séances »). */
export function savePlaylist(id: string, change: Partial<Pick<Playlist, "name" | "items">>): Playlist | undefined {
  const playlist = getPlaylist(id);
  if (!playlist) return undefined;
  Object.assign(playlist, change, { updatedAt: new Date().toISOString() });
  return playlist;
}

export function addPlaylist(playlist: Playlist): void {
  PLAYLISTS.push(playlist);
}

/** Chanson connue de la base, publiée ou retirée (pour annuler un retrait sans accepter n'importe quel identifiant). */
export const songExists = (id: string) => getSong(id) !== undefined || getRemovedSong(id) !== undefined;

/** Une chanson est lisible tant qu'elle n'a pas été retirée. */
export const isReadableSong = (id: string) => getSong(id) !== undefined;

/** Numéros du lecteur pour les chansons lisibles de la playlist (les chansons retirées n'en ont pas). */
export const readerPositionsOf = (playlist: Playlist) => readablePositions(playlist.items, isReadableSong);
