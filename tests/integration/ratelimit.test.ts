import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { hitRateLimit, purgeOldRateLimits } from "@/lib/ratelimit/fixedWindow";
import { resetDb } from "./helpers";

describe("hitRateLimit", () => {
  beforeEach(resetDb);

  // Fenêtre d'une heure : évite qu'un test chevauche deux fenêtres.
  it("autorise jusqu'à la limite puis refuse", async () => {
    expect(await hitRateLimit("search:1.2.3.4", 2, 3600)).toEqual({ allowed: true, remaining: 1 });
    expect(await hitRateLimit("search:1.2.3.4", 2, 3600)).toEqual({ allowed: true, remaining: 0 });
    expect(await hitRateLimit("search:1.2.3.4", 2, 3600)).toEqual({ allowed: false, remaining: 0 });
  });

  it("compte chaque clé séparément", async () => {
    await hitRateLimit("search:a", 1, 3600);
    expect((await hitRateLimit("search:b", 1, 3600)).allowed).toBe(true);
  });

  it("purge les fenêtres de plus d'un jour", async () => {
    await db.execute(sql`INSERT INTO rate_limits VALUES ('old', now() - interval '2 days', 5)`);
    await purgeOldRateLimits();
    const r = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM rate_limits WHERE key = 'old'`);
    expect(Number(r.rows[0].n)).toBe(0);
  });
});
