"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canCopyPlaylist, canEditPlaylist } from "@/lib/auth/permissions";
import { isUuid } from "@/lib/catalog/queries";
import { songExists } from "@/lib/catalog/read";
import { db } from "@/lib/db/client";
import {
  insertItem,
  moveItem,
  normalizeNote,
  normalizePlaylistName,
  removeItem,
  setItemNote,
  type Direction,
} from "@/lib/playlist/edit";
import { getPlaylist } from "@/lib/playlist/queries";
import { copyPlaylist, deletePlaylist, editItems, renamePlaylist } from "@/lib/playlist/write";
import { getCurrentUser } from "@/lib/session";

/**
 * Actions du mode édition d'une playlist et de « Copier dans mes playlists ». Une action serveur est
 * joignable directement par POST : chacune vérifie les droits et la forme de ses arguments, et une
 * demande refusée ou périmée ne change rien.
 */

const isText = (value: unknown): value is string => typeof value === "string";

async function editablePlaylist(playlistId: unknown) {
  if (!isText(playlistId)) return null;
  const [playlist, user] = await Promise.all([getPlaylist(playlistId), getCurrentUser()]);
  return playlist && canEditPlaylist(user, playlist) ? playlist : null;
}

/** Les playlists apparaissent aussi sur l'accueil, dans le lecteur et dans les clubs. */
const refreshPages = () => revalidatePath("/", "layout");

export async function movePlaylistSong(playlistId: string, songId: string, direction: Direction): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId) || (direction !== "up" && direction !== "down")) return;
  await editItems(db, playlist.id, (items) => moveItem(items, songId, direction));
  refreshPages();
}

export async function removePlaylistSong(playlistId: string, songId: string): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId)) return;
  await editItems(db, playlist.id, (items) => removeItem(items, songId));
  refreshPages();
}

/** « Annuler » après un retrait : la chanson revient à sa position, avec sa note. */
export async function restorePlaylistSong(
  playlistId: string,
  item: { songId: string; position: number; note: string | null },
): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !item || !isText(item.songId) || !isUuid(item.songId) || !Number.isInteger(item.position)) return;
  if (!(await songExists(item.songId))) return;
  const note = isText(item.note) ? normalizeNote(item.note) : null;
  await editItems(db, playlist.id, (items) => insertItem(items, { songId: item.songId, position: item.position, note }));
  refreshPages();
}

export async function savePlaylistNote(playlistId: string, songId: string, note: string): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId) || !isText(note)) return;
  await editItems(db, playlist.id, (items) => setItemNote(items, songId, note));
  refreshPages();
}

export type RenameResult = { ok: true; name: string } | { ok: false; error: "empty" | "forbidden" };

export async function renamePlaylistAction(playlistId: string, rawName: string): Promise<RenameResult> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(rawName)) return { ok: false, error: "forbidden" };
  const name = normalizePlaylistName(rawName);
  if (!name) return { ok: false, error: "empty" };
  await renamePlaylist(db, playlist.id, name);
  refreshPages();
  return { ok: true, name };
}

export type CopyResult = { ok: true; id: string } | { ok: false };

/** « Copier dans mes playlists » : une copie personnelle de la playlist d'un club, mêmes chansons et notes. */
export async function copyPlaylistToMine(playlistId: string): Promise<CopyResult> {
  if (!isText(playlistId)) return { ok: false };
  const [user, playlist] = await Promise.all([getCurrentUser(), getPlaylist(playlistId)]);
  if (!user || !playlist || !canCopyPlaylist(user, playlist)) return { ok: false };
  const id = await copyPlaylist(db, playlist.id, user.id);
  if (!id) return { ok: false };
  refreshPages();
  return { ok: true, id };
}

export type DeleteState = { error?: "forbidden" } | null;

/**
 * Supprimer la playlist (spec §10), puis revenir à son club ou à « Mes playlists ».
 * Signature de `useActionState` : l'état précédent et le formulaire ne servent pas.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deletePlaylistAction(playlistId: string, _prev: DeleteState, _formData: FormData): Promise<DeleteState> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist) return { error: "forbidden" };
  await deletePlaylist(db, playlist.id);
  refreshPages();
  redirect(playlist.club ? `/clubs/${encodeURIComponent(playlist.club.slug)}` : "/playlists");
}
