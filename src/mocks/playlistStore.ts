import type { Playlist } from "@/types/catalog";
import { PLAYLISTS, getPlaylist } from "./catalog";

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

// songExists et readerPositionsOf : voir la passerelle `@/lib/catalog/read` (UUID en base, sinon fictif).
