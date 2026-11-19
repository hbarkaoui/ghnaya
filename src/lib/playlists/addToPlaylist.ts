import type { Playlist } from "@/types/catalog";

/**
 * Logique pure de la feuille « Ajouter à une playlist » : qui peut modifier quelle playlist, l'ajout
 * sans doublon et le nom d'une nouvelle playlist. Partagée par les actions serveur (vérification) et
 * la feuille (validation du nom avant l'envoi).
 */

/** Ce qu'il faut savoir de l'utilisateur pour décider de ses droits (DemoUser, puis la session du plan 2). */
export interface PlaylistEditor {
  id: string;
  /** Rôle d'animateur attribué par un admin. */
  isAnimator: boolean;
  /** Clubs de l'utilisateur ; pour un animateur, les clubs qu'il anime. */
  clubSlugs: readonly string[];
}

/**
 * Droits sur une playlist (spec §10, règle des clubs du 19/11/2026) :
 *  - une playlist personnelle n'est modifiable que par son propriétaire ;
 *  - une playlist de club n'est modifiable que par un animateur de ce club. Un membre la lit et peut
 *    la copier, mais ne la modifie pas.
 */
export function canEditPlaylist(user: PlaylistEditor, playlist: Pick<Playlist, "club">, ownerId: string | null): boolean {
  if (playlist.club) return user.isAnimator && user.clubSlugs.includes(playlist.club.slug);
  return ownerId === user.id;
}

/** Playlists modifiables par l'utilisateur, de la plus récemment modifiée à la plus ancienne. */
export function editablePlaylists(
  user: PlaylistEditor,
  playlists: readonly Playlist[],
  ownerOf: (playlist: Playlist) => string | null,
): Playlist[] {
  return playlists
    .filter((p) => canEditPlaylist(user, p, ownerOf(p)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export type AppendResult = { status: "added"; playlist: Playlist } | { status: "duplicate" };

/**
 * Ajoute une chanson à la fin de la playlist, sans note. Une chanson déjà présente n'est pas ajoutée
 * une deuxième fois (« Déjà dans … »). Renvoie une nouvelle playlist, sans modifier celle reçue.
 */
export function appendSong(playlist: Playlist, songId: string, now: string): AppendResult {
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
