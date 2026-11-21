"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  insertItem,
  moveItem,
  normalizeNote,
  normalizePlaylistName,
  removeItem,
  setItemNote,
  type Direction,
} from "@/lib/playlist/edit";
import { canCopyPlaylist, canEditPlaylist } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/session";
import { getPlaylist } from "@/mocks/catalog";
import { songExists } from "@/lib/catalog/read";
import { addPlaylist, savePlaylist } from "@/mocks/playlistStore";
import type { Playlist } from "@/types/catalog";

// MAQUETTE : retiré à la tâche 9 (copie locale de l'ancienne fonction pure, remplacée par la base).
function copyPlaylist(source: Playlist, { id, ownerId, now }: { id: string; ownerId: string; now: string }): Playlist {
  return { id, name: source.name, club: null, ownerId, items: source.items.map((item) => ({ ...item })), updatedAt: now };
}

/**
 * Actions du mode édition d'une playlist et de « Copier dans mes playlists ».
 * Une action serveur est joignable directement par POST : chacune vérifie les droits de l'utilisateur
 * et la forme de ses arguments, et une demande refusée ou périmée ne change rien.
 * MAQUETTE : les modifications vivent en mémoire (mocks/playlistStore).
 */

const isText = (value: unknown): value is string => typeof value === "string";

async function editablePlaylist(playlistId: unknown) {
  if (!isText(playlistId)) return null;
  const playlist = getPlaylist(playlistId);
  return playlist && canEditPlaylist(await getCurrentUser(), playlist) ? playlist : null;
}

/** Les playlists apparaissent aussi sur l'accueil, dans le lecteur et dans les clubs. */
const refreshPages = () => revalidatePath("/", "layout");

export async function movePlaylistSong(playlistId: string, songId: string, direction: Direction): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId) || (direction !== "up" && direction !== "down")) return;
  savePlaylist(playlist.id, { items: moveItem(playlist.items, songId, direction) });
  refreshPages();
}

export async function removePlaylistSong(playlistId: string, songId: string): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId)) return;
  savePlaylist(playlist.id, { items: removeItem(playlist.items, songId) });
  refreshPages();
}

/** « Annuler » après un retrait : la chanson revient à sa position, avec sa note. */
export async function restorePlaylistSong(
  playlistId: string,
  item: { songId: string; position: number; note: string | null },
): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !item || !isText(item.songId) || !(await songExists(item.songId)) || !Number.isInteger(item.position)) return;
  const note = isText(item.note) ? normalizeNote(item.note) : null;
  savePlaylist(playlist.id, { items: insertItem(playlist.items, { songId: item.songId, position: item.position, note }) });
  refreshPages();
}

export async function savePlaylistNote(playlistId: string, songId: string, note: string): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId) || !isText(note)) return;
  savePlaylist(playlist.id, { items: setItemNote(playlist.items, songId, note) });
  refreshPages();
}

export type RenameResult = { ok: true; name: string } | { ok: false; error: "empty" | "forbidden" };

export async function renamePlaylist(playlistId: string, rawName: string): Promise<RenameResult> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(rawName)) return { ok: false, error: "forbidden" };
  const name = normalizePlaylistName(rawName);
  if (!name) return { ok: false, error: "empty" };
  savePlaylist(playlist.id, { name });
  refreshPages();
  return { ok: true, name };
}

export type CopyResult = { ok: true; id: string } | { ok: false };

/** « Copier dans mes playlists » : une copie personnelle de la playlist d'un club, mêmes chansons et notes. */
export async function copyPlaylistToMine(playlistId: string): Promise<CopyResult> {
  if (!isText(playlistId)) return { ok: false };
  const user = await getCurrentUser();
  const playlist = getPlaylist(playlistId);
  if (!user || !playlist || !canCopyPlaylist(user, playlist)) return { ok: false };
  const copy = copyPlaylist(playlist, { id: randomUUID(), ownerId: user.id, now: new Date().toISOString() });
  addPlaylist(copy);
  refreshPages();
  return { ok: true, id: copy.id };
}
