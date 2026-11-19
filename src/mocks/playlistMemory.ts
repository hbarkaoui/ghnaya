import {
  appendSong,
  editablePlaylists,
  type AppendResult,
  type PlaylistEditor,
} from "@/lib/playlist/addToPlaylist";
import type { Playlist } from "@/types/catalog";
import { CLUBS, PLAYLISTS } from "./catalog";

/**
 * MAQUETTE : écritures en mémoire sur les playlists fictives (ajout d'une chanson, création rapide),
 * en attendant la base du plan 3. Les playlists sont dans PLAYLISTS (catalog.ts), partagé par toutes
 * les copies du module ; le propriétaire d'une playlist personnelle est son `ownerId`.
 */

/** Playlists que l'utilisateur peut modifier : les siennes, et celles des clubs qu'il anime. */
export const editablePlaylistsFor = (user: PlaylistEditor): Playlist[] => editablePlaylists(user, PLAYLISTS);

/** Clubs où l'utilisateur peut créer une playlist : ceux qu'il anime (aucun pour un membre). */
export const clubsAnimatedBy = (user: PlaylistEditor) =>
  user.isAnimator ? user.clubSlugs.flatMap((slug) => CLUBS.filter((club) => club.slug === slug)) : [];

/** Ajoute la chanson à la playlist en mémoire. Les droits sont vérifiés par l'appelant (action serveur). */
export function storeSongInPlaylist(playlist: Playlist, songId: string): AppendResult {
  const result = appendSong(playlist, songId, new Date().toISOString());
  if (result.status === "added") {
    const index = PLAYLISTS.findIndex((p) => p.id === playlist.id);
    if (index !== -1) PLAYLISTS[index] = result.playlist;
  }
  return result;
}

/** Crée une playlist vide, personnelle (`club` à null) ou de club. */
export function storeNewPlaylist({
  name,
  club,
  ownerId,
}: {
  name: string;
  club: Playlist["club"];
  ownerId: string;
}): Playlist {
  const playlist: Playlist = {
    id: crypto.randomUUID(),
    name,
    club,
    ownerId: club ? null : ownerId,
    items: [],
    updatedAt: new Date().toISOString(),
  };
  PLAYLISTS.push(playlist);
  return playlist;
}
