import "server-only";
import { sql, type SQL } from "drizzle-orm";
import type { CurrentUser } from "@/lib/auth/types";
import { isUuid } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { inList } from "@/lib/db/sqlList";
import type { Playlist, PlaylistItem } from "@/types/catalog";

type Row = {
  id: string;
  name: string;
  owner_user_id: string | null;
  updated_at: Date | string;
  club_slug: string | null;
  club_name: string | null;
  items: PlaylistItem[];
};

const toPlaylist = (r: Row): Playlist => ({
  id: r.id,
  name: r.name,
  club: r.club_slug && r.club_name ? { slug: r.club_slug, name: r.club_name } : null,
  ownerId: r.owner_user_id,
  items: r.items,
  updatedAt: new Date(r.updated_at).toISOString(),
});

/** Playlists qui répondent à `where`, avec leurs chansons dans l'ordre, de la plus récemment modifiée à la plus ancienne. */
async function playlistsWhere(where: SQL): Promise<Playlist[]> {
  const res = await db.execute<Row>(sql`
    SELECT p.id, p.name, p.owner_user_id, p.updated_at, c.slug AS club_slug, c.name AS club_name,
      COALESCE((
        SELECT json_agg(json_build_object('position', i.position, 'songId', i.song_id, 'note', i.note) ORDER BY i.position)
        FROM playlist_items i WHERE i.playlist_id = p.id
      ), '[]'::json) AS items
    FROM playlists p LEFT JOIN clubs c ON c.id = p.club_id
    WHERE ${where}
    ORDER BY p.updated_at DESC, p.id`);
  return res.rows.map(toPlaylist);
}

/** Une playlist, sans contrôle d'accès : l'appelant vérifie `canViewPlaylist`. */
export async function getPlaylist(id: string): Promise<Playlist | null> {
  if (!isUuid(id)) return null;
  const [playlist] = await playlistsWhere(sql`p.id = ${id}`);
  return playlist ?? null;
}

export const personalPlaylistsOf = (userId: string): Promise<Playlist[]> =>
  playlistsWhere(sql`p.owner_user_id = ${userId}`);

export async function clubPlaylistsOf(slugs: readonly string[]): Promise<Playlist[]> {
  if (slugs.length === 0) return [];
  return playlistsWhere(sql`c.slug IN (${inList(slugs)})`);
}

/** Playlists où l'utilisateur peut ajouter une chanson : les siennes, et celles des clubs qu'il anime. */
export async function editablePlaylistsOf(user: CurrentUser): Promise<Playlist[]> {
  const animated = user.clubs.filter((club) => club.role === "animator").map((club) => club.slug);
  const clubClause = animated.length > 0 ? sql` OR c.slug IN (${inList(animated)})` : sql``;
  return playlistsWhere(sql`(p.owner_user_id = ${user.id}${clubClause})`);
}
