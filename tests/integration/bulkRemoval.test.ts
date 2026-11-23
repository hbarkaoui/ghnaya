// Plan 3, tâche 8 : retrait en masse par source, au besoin par artiste (spec §9), et son annulation.
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getSongById } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { runBulk, type BulkArgs } from "@/lib/moderation/bulk";
import { searchSongs } from "@/lib/search/searchSongs";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

const REASON = "Retrait demandé par les ayants droit.";
const args = (over: Partial<BulkArgs> = {}): BulkArgs => ({
  source: "lrclib",
  reason: REASON,
  artistId: null,
  dryRun: false,
  restore: false,
  ...over,
});
const count = async (where: string) =>
  Number((await db.execute<{ n: string }>(sql.raw(`SELECT count(*) AS n FROM songs WHERE ${where}`))).rows[0].n);

describe("retrait en masse", () => {
  let ids = new Map<string, string>();
  let lrclib = 0;
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    lrclib = await count("source = 'lrclib'");
  });

  it("--dry-run compte sans rien changer", async () => {
    expect(lrclib).toBeGreaterThan(0);
    expect(await runBulk(db, args({ dryRun: true }))).toBe(lrclib);
    expect(await count("status = 'removed'")).toBe(0);
  });

  it("retire toutes les chansons de la source, protégées des imports, et laisse les autres", async () => {
    expect(await runBulk(db, args())).toBe(lrclib);
    expect(await count("source = 'lrclib' AND status = 'removed' AND import_locked AND removed_reason IS NOT NULL")).toBe(lrclib);
    expect(await count("source <> 'lrclib' AND status = 'removed'")).toBe(0);
    expect(await getSongById(ids.get("s-sidi-mansour")!)).toBeNull();
    expect((await searchSongs("sidi mansour")).items).toEqual([]);
    expect(await runBulk(db, args())).toBe(0);
  });

  it("filtre par artiste", async () => {
    const [{ id: saber }] = (await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`)).rows;
    const expected = Number(
      (
        await db.execute<{ n: string }>(sql`
          SELECT count(*) AS n FROM songs s JOIN song_artists sa ON sa.song_id = s.id
          WHERE sa.artist_id = ${saber} AND s.source = 'lrclib'`)
      ).rows[0].n,
    );
    expect(expected).toBeGreaterThan(0);
    expect(await runBulk(db, args({ artistId: saber }))).toBe(expected);
    expect(await count("status = 'removed'")).toBe(expected);
    expect((await getSongById(ids.get("s-ya-lili")!))?.titleLatin).toBe("Ya Lili");
  });

  it("--restore rétablit les chansons retirées pour ce motif, et seulement celles-là", async () => {
    await runBulk(db, args());
    const other = ids.get("s-habaytak")!;
    await db.update(songs).set({ removedReason: "Retrait d'un modérateur." }).where(eq(songs.id, other));
    expect(await runBulk(db, args({ restore: true, dryRun: true }))).toBe(lrclib - 1);
    expect(await runBulk(db, args({ restore: true }))).toBe(lrclib - 1);
    expect(await count("status = 'removed'")).toBe(1);
    expect((await getSongById(ids.get("s-sidi-mansour")!))?.titleLatin).toBe("Sidi Mansour");
    expect(await getSongById(other)).toBeNull();
    expect(await runBulk(db, args({ restore: true, reason: "Autre motif." }))).toBe(0);
  });
});
