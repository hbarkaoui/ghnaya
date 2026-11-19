import type { Playlist } from "@/types/catalog";

/**
 * Droits sur une playlist (spec §10, règle des clubs du 19/11/2026) :
 *  - un club est privé : seuls ses membres voient ses playlists ;
 *  - une playlist personnelle est privée : seul son propriétaire la voit ;
 *  - les playlists d'un club se modifient par ses animateurs ; les membres les lisent et les copient.
 *
 * MAQUETTE : un utilisateur `isAnimator` anime tous ses clubs. La vraie base lira le rôle dans
 * `club_members.role` (lib/clubs).
 */
export interface PlaylistViewer {
  id: string;
  isAnimator: boolean;
  clubSlugs: string[];
}

type Access = Pick<Playlist, "club" | "ownerId">;

export function canViewPlaylist(user: PlaylistViewer | null, playlist: Access): boolean {
  if (!user) return false;
  return playlist.club ? user.clubSlugs.includes(playlist.club.slug) : playlist.ownerId === user.id;
}

export function canEditPlaylist(user: PlaylistViewer | null, playlist: Access): boolean {
  if (!user || !canViewPlaylist(user, playlist)) return false;
  return playlist.club ? user.isAnimator : true;
}

/** « Copier dans mes playlists » : pour un membre qui lit la playlist de son club sans pouvoir la modifier. */
export function canCopyPlaylist(user: PlaylistViewer | null, playlist: Access): boolean {
  return playlist.club !== null && canViewPlaylist(user, playlist) && !canEditPlaylist(user, playlist);
}
