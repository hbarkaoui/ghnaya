import type { Playlist } from "@/types/catalog";

/**
 * Logique pure de la feuille « Ajouter à une playlist » : le nom d'une nouvelle playlist et ce que la feuille affiche. Partagée par les actions serveur (vérification) et
 * la feuille (validation du nom avant l'envoi).
 */

export const PLAYLIST_NAME_MAX_LENGTH = 60;

export type PlaylistNameError = "empty" | "tooLong";
export type ParsedPlaylistName = { ok: true; name: string } | { ok: false; error: PlaylistNameError };

/**
 * Nom d'une nouvelle playlist : espaces superflus retirés, au plus 60 caractères (comptés en caractères
 * et non en unités UTF-16). Accepte une valeur quelconque, puisqu'une action serveur peut être appelée
 * directement.
 */
export function parsePlaylistName(raw: unknown): ParsedPlaylistName {
  const name = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  if (name === "") return { ok: false, error: "empty" };
  if ([...name].length > PLAYLIST_NAME_MAX_LENGTH) return { ok: false, error: "tooLong" };
  return { ok: true, name };
}

/** Une playlist telle que la feuille l'affiche : le client n'a besoin ni des notes ni des positions. */
export interface AddTarget {
  id: string;
  name: string;
  club: { slug: string; name: string } | null;
  songIds: string[];
  updatedAt: string;
}

export const toAddTarget = (playlist: Playlist): AddTarget => ({
  id: playlist.id,
  name: playlist.name,
  club: playlist.club,
  songIds: playlist.items.map((item) => item.songId),
  updatedAt: playlist.updatedAt,
});
