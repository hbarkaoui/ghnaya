import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

export async function resetDb(): Promise<void> {
  await db.execute(sql`TRUNCATE song_artists, songs, artists, rate_limits CASCADE`);
}
