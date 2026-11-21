import { canEditPlaylist } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/auth/types";
import type { Playlist } from "@/types/catalog";
import { CLUBS, PLAYLISTS } from "./catalog";

// MAQUETTE : retiré à la tâche 9 (copies locales des anciennes fonctions pures, remplacées par la base).
type PlaylistEditor = CurrentUser;
type AppendResult = { status: "added"; playlist: Playlist } | { status: "duplicate" };

const editablePlaylists = (user: PlaylistEditor, playlists: readonly Playlist[]): Playlist[] =>
  playlists.filter((p) => canEditPlaylist(user, p)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

function appendSong(playlist: Playlist, songId: string, now: string): AppendResult {
  if (playlist.items.some((item) => item.songId === songId)) return { status: "duplicate" };
  return {
    status: "added",
    playlist: {
      ...playlist,
      items: [...playlist.items, { position: playlist.items.length + 1, songId, note: null }],
      updatedAt: now,
    },
  };
}

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
