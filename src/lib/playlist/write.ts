import "server-only";
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { playlistItems, playlists } from "@/lib/db/schema";
import type { PlaylistItem } from "@/types/catalog";

/**
 * Écritures des playlists (spec §10). L'appelant (Server Action) a vérifié les droits avec
 * `lib/auth/permissions` et l'existence de la chanson. Chaque modification verrouille la playlist
 * (`FOR UPDATE`) : deux ajouts simultanés reçoivent des positions distinctes.
 */

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type PlaylistOwner = { userId: string } | { clubId: string };

const lock = (tx: Tx, playlistId: string) => tx.execute(sql`SELECT id FROM playlists WHERE id = ${playlistId} FOR UPDATE`);
const touch = (tx: Tx, playlistId: string) =>
  tx.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));

export function createPlaylist(
  db: Db,
  input: { name: string; owner: PlaylistOwner; createdBy: string; songId?: string },
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(playlists)
      .values({
        name: input.name,
        ownerUserId: "userId" in input.owner ? input.owner.userId : null,
        clubId: "clubId" in input.owner ? input.owner.clubId : null,
        createdBy: input.createdBy,
      })
      .returning({ id: playlists.id });
    if (input.songId) await tx.insert(playlistItems).values({ playlistId: row.id, songId: input.songId, position: 1 });
    return row.id;
  });
}

/** Ajoute la chanson en fin de playlist. `duplicate` si elle y est déjà (« Déjà dans … »). */
export function appendSong(db: Db, playlistId: string, songId: string): Promise<"added" | "duplicate"> {
  return db.transaction(async (tx) => {
    await lock(tx, playlistId);
    const res = await tx.execute(sql`
      INSERT INTO playlist_items (playlist_id, song_id, position)
      SELECT ${playlistId}, ${songId}, COALESCE(MAX(position), 0) + 1 FROM playlist_items WHERE playlist_id = ${playlistId}
      ON CONFLICT (playlist_id, song_id) DO NOTHING
      RETURNING id`);
    if (res.rows.length === 0) return "duplicate";
    await touch(tx, playlistId);
    return "added";
  });
}

/**
 * Applique une modification pure de `lib/playlist/edit` (monter, descendre, retirer, remettre, annoter)
 * aux chansons lues sous verrou, puis réécrit la liste, positions 1 à n (écart 8).
 */
export function editItems(db: Db, playlistId: string, edit: (items: PlaylistItem[]) => PlaylistItem[]): Promise<void> {
  return db.transaction(async (tx) => {
    await lock(tx, playlistId);
    const current = await tx
      .select({ position: playlistItems.position, songId: playlistItems.songId, note: playlistItems.note })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(playlistItems.position);
    const next = [...edit(current)].sort((a, b) => a.position - b.position);
    if (JSON.stringify(next) === JSON.stringify(current)) return;

    await tx.delete(playlistItems).where(eq(playlistItems.playlistId, playlistId));
    if (next.length > 0) {
      await tx
        .insert(playlistItems)
        .values(next.map((item, i) => ({ playlistId, songId: item.songId, position: i + 1, note: item.note })));
    }
    await touch(tx, playlistId);
  });
}

export async function renamePlaylist(db: Db, playlistId: string, name: string): Promise<void> {
  await db.update(playlists).set({ name, updatedAt: new Date() }).where(eq(playlists.id, playlistId));
}

/** Copie personnelle d'une playlist (« Copier dans mes playlists ») : mêmes chansons, même ordre, mêmes notes. */
export function copyPlaylist(db: Db, sourceId: string, ownerId: string): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [source] = await tx.select({ name: playlists.name }).from(playlists).where(eq(playlists.id, sourceId));
    if (!source) return null;
    const [copy] = await tx
      .insert(playlists)
      .values({ name: source.name, ownerUserId: ownerId, createdBy: ownerId })
      .returning({ id: playlists.id });
    await tx.execute(sql`
      INSERT INTO playlist_items (playlist_id, song_id, position, note)
      SELECT ${copy.id}, song_id, position, note FROM playlist_items WHERE playlist_id = ${sourceId}`);
    return copy.id;
  });
}

export async function deletePlaylist(db: Db, playlistId: string): Promise<void> {
  await db.delete(playlists).where(eq(playlists.id, playlistId));
}
