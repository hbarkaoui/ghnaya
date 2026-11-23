import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export async function resetDb(): Promise<void> {
  await db.execute(sql`TRUNCATE reports, song_revisions, playlist_items, playlists, club_members, clubs, verifications, accounts, sessions,
    users, song_artists, songs, artists, rate_limits CASCADE`);
}
