import {
  appendSong,
  editablePlaylists,
  type AppendResult,
  type PlaylistEditor,
} from "@/lib/playlists/addToPlaylist";
import type { Playlist } from "@/types/catalog";
import { CLUBS, PLAYLISTS } from "./catalog";

/**
 * MAQUETTE : écritures en mémoire sur les playlists fictives (ajout d'une chanson, création rapide),
 * en attendant la base du plan 3. Les playlists sont dans PLAYLISTS (catalog.ts), partagé par toutes
 * les copies du module ; les propriétaires des playlists personnelles créées pendant la session sont
 * rangés de la même façon sur globalThis.
 */
const memory = globalThis as typeof globalThis & { __ghnayaPersonalOwners?: Map<string, string> };
const PERSONAL_OWNERS = (memory.__ghnayaPersonalOwners ??= new Map<string, string>());

/** Les playlists personnelles du jeu de départ appartiennent à Leïla (u-leila, voir session.ts). */
const SEED_PERSONAL_OWNER = "u-leila";

/** Propriétaire d'une playlist personnelle (`owner_user_id` de la spec) ; `null` pour une playlist de club. */
export const personalOwnerOf = (playlist: Playlist): string | null =>
  playlist.club ? null : (PERSONAL_OWNERS.get(playlist.id) ?? SEED_PERSONAL_OWNER);

/** Playlists que l'utilisateur peut modifier : les siennes, et celles des clubs qu'il anime. */
export const editablePlaylistsFor = (user: PlaylistEditor): Playlist[] =>
  editablePlaylists(user, PLAYLISTS, personalOwnerOf);

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
  const playlist: Playlist = { id: crypto.randomUUID(), name, club, items: [], updatedAt: new Date().toISOString() };
  PLAYLISTS.push(playlist);
  if (!club) PERSONAL_OWNERS.set(playlist.id, ownerId);
  return playlist;
}
