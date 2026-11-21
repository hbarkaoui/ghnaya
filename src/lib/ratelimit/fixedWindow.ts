// Plan 1, tâche 9 : limitation de débit à fenêtre fixe, stockée dans PostgreSQL. Sur Vercel, chaque
// requête peut tomber sur une instance différente : un compteur en mémoire ne suffirait pas.
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

/** 60 recherches par minute et par adresse IP (contraintes globales du plan 1). */
export const SEARCH_RATE_LIMIT = { limit: 60, windowSeconds: 60 } as const;
const PURGE_PROBABILITY = 0.01;

export async function purgeOldRateLimits(): Promise<void> {
  await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
}

export async function hitRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const res = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (
      ${key},
      to_timestamp(floor(extract(epoch FROM now()) / ${windowSeconds}::int) * ${windowSeconds}::int),
      1
    )
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`);
  if (Math.random() < PURGE_PROBABILITY) void purgeOldRateLimits().catch(() => undefined);
  const count = Number(res.rows[0].count);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
