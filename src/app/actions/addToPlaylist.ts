"use server";

import {
  canEditPlaylist,
  parsePlaylistName,
  toAddTarget,
  type AddTarget,
  type PlaylistNameError,
} from "@/lib/playlists/addToPlaylist";
import { getCurrentUser } from "@/lib/session";
import { getPlaylist, getSong } from "@/mocks/catalog";
import { clubsAnimatedBy, personalOwnerOf, storeNewPlaylist, storeSongInPlaylist } from "@/mocks/playlistMemory";

/** Délai simulé d'un aller-retour avec la base, pour voir l'état « en cours » de la feuille. */
const SIMULATED_DELAY_MS = 250;
const simulateLatency = () => new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

/** Échecs communs : session expirée, chanson ou playlist introuvable, droits insuffisants. */
type Failure = { status: "signedOut" | "notFound" | "forbidden" };

export type AddToPlaylistResult = { status: "added" | "duplicate"; target: AddTarget } | Failure;

/**
 * Ajoute une chanson à une playlist modifiable par l'utilisateur, sans doublon.
 * MAQUETTE : écrit dans les données fictives en mémoire ; le plan 3 écrira dans `playlist_items`.
 * Les droits sont revérifiés ici : une action serveur peut être appelée directement.
 */
export async function addSongToPlaylist(playlistId: string, songId: string): Promise<AddToPlaylistResult> {
  await simulateLatency();
  const user = await getCurrentUser();
  if (!user) return { status: "signedOut" };

  const playlist = typeof playlistId === "string" ? getPlaylist(playlistId) : undefined;
  if (!playlist || typeof songId !== "string" || !getSong(songId)) return { status: "notFound" };
  if (!canEditPlaylist(user, playlist, personalOwnerOf(playlist))) return { status: "forbidden" };

  const result = storeSongInPlaylist(playlist, songId);
  return result.status === "added"
    ? { status: "added", target: toAddTarget(result.playlist) }
    : { status: "duplicate", target: toAddTarget(playlist) };
}

export type CreatePlaylistResult =
  | { status: "created"; target: AddTarget }
  | { status: "invalid"; error: PlaylistNameError }
  | Failure;

/**
 * Création rapide depuis la feuille : une playlist personnelle, ou une playlist d'un club que
 * l'utilisateur anime (`clubSlug`), qui reçoit aussitôt la chanson.
 */
export async function createPlaylistWithSong(input: {
  name: string;
  clubSlug: string | null;
  songId: string;
}): Promise<CreatePlaylistResult> {
  await simulateLatency();
  const user = await getCurrentUser();
  if (!user) return { status: "signedOut" };

  const parsed = parsePlaylistName(input?.name);
  if (!parsed.ok) return { status: "invalid", error: parsed.error };
  if (typeof input.songId !== "string" || !getSong(input.songId)) return { status: "notFound" };

  let club = null;
  if (input.clubSlug != null) {
    club = clubsAnimatedBy(user).find((c) => c.slug === input.clubSlug);
    if (!club) return { status: "forbidden" };
  }

  const playlist = storeNewPlaylist({ name: parsed.name, club, ownerId: user.id });
  const result = storeSongInPlaylist(playlist, input.songId);
  return { status: "created", target: toAddTarget(result.status === "added" ? result.playlist : playlist) };
}
