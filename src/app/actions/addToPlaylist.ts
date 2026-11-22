"use server";

import { canEditPlaylist, clubsAnimatedBy } from "@/lib/auth/permissions";
import { isUuid } from "@/lib/catalog/queries";
import { getSong } from "@/lib/catalog/read";
import { getClubBySlug } from "@/lib/clubs/queries";
import { db } from "@/lib/db/client";
import {
  parsePlaylistName,
  toAddTarget,
  type AddTarget,
  type PlaylistNameError,
} from "@/lib/playlist/addToPlaylist";
import { getPlaylist } from "@/lib/playlist/queries";
import { appendSong, createPlaylist } from "@/lib/playlist/write";
import { getCurrentUser } from "@/lib/session";

/** Échecs communs : session expirée, chanson ou playlist introuvable, droits insuffisants. */
type Failure = { status: "signedOut" | "notFound" | "forbidden" };

export type AddToPlaylistResult = { status: "added" | "duplicate"; target: AddTarget } | Failure;

/** Seules les chansons de la base vont dans une playlist (clé étrangère) : une chanson fictive est introuvable. */
const findSong = async (songId: unknown) =>
  typeof songId === "string" && isUuid(songId) ? getSong(songId) : undefined;

/**
 * Ajoute une chanson à une playlist modifiable par l'utilisateur, sans doublon.
 * Les droits sont revérifiés ici : une action serveur peut être appelée directement.
 */
export async function addSongToPlaylist(playlistId: string, songId: string): Promise<AddToPlaylistResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "signedOut" };

  const playlist = typeof playlistId === "string" ? await getPlaylist(playlistId) : null;
  if (!playlist || !(await findSong(songId))) return { status: "notFound" };
  if (!canEditPlaylist(user, playlist)) return { status: "forbidden" };

  const status = await appendSong(db, playlist.id, songId);
  const updated = (await getPlaylist(playlist.id)) ?? playlist;
  return { status, target: toAddTarget(updated) };
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
  const user = await getCurrentUser();
  if (!user) return { status: "signedOut" };

  const parsed = parsePlaylistName(input?.name);
  if (!parsed.ok) return { status: "invalid", error: parsed.error };
  if (!(await findSong(input.songId))) return { status: "notFound" };

  let owner: { userId: string } | { clubId: string } = { userId: user.id };
  if (input.clubSlug != null) {
    const allowed = clubsAnimatedBy(user).some((club) => club.slug === input.clubSlug);
    const club = allowed ? await getClubBySlug(input.clubSlug) : null;
    if (!club) return { status: "forbidden" };
    owner = { clubId: club.id };
  }

  const id = await createPlaylist(db, { name: parsed.name, owner, createdBy: user.id, songId: input.songId });
  const playlist = await getPlaylist(id);
  return playlist ? { status: "created", target: toAddTarget(playlist) } : { status: "notFound" };
}
