import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getArtistPage, getSong, readerPositionsOf, songExists } from "@/lib/catalog/read";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

const UNKNOWN_UUID = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";

describe("passerelle de lecture du catalogue", () => {
  let ids = new Map<string, string>();
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });

  it("lit un UUID en base ; un identifiant fictif ou inconnu n'est aucune chanson", async () => {
    expect(await getSong(ids.get("s-sidi-mansour")!)).toMatchObject({
      id: ids.get("s-sidi-mansour"),
      titleLatin: "Sidi Mansour",
    });
    expect(await getSong("s-sidi-mansour")).toBeUndefined();
    expect(await getSong(UNKNOWN_UUID)).toBeUndefined();
    expect(await getSong("s-inconnue")).toBeUndefined();
  });

  it("lit la page artiste en base ; un identifiant fictif n'est aucun artiste", async () => {
    const r = await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`);
    expect((await getArtistPage(r.rows[0].id, 1))?.artist.nameLatin).toBe("Saber Rebai");
    expect(await getArtistPage("a-saber", 1)).toBeNull();
  });

  it("numérote une playlist d'après la base seule, sans les chansons retirées, inconnues ou fictives", async () => {
    const removed = ids.get("s-ala-nar")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    const playlist = {
      items: [
        { position: 1, songId: ids.get("s-sidi-mansour")!, note: null },
        { position: 2, songId: removed, note: null },
        { position: 3, songId: ids.get("s-habaytak")!, note: null },
        { position: 4, songId: UNKNOWN_UUID, note: null },
        { position: 5, songId: "s-sidi-mansour", note: null },
      ],
    };
    expect([...(await readerPositionsOf(playlist))]).toEqual([
      [ids.get("s-sidi-mansour"), 1],
      [ids.get("s-habaytak"), 2],
    ]);
  });

  it("songExists : connue publiée ou retirée, en base seulement", async () => {
    const removed = ids.get("s-ala-nar")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    expect(await songExists(removed)).toBe(true);
    expect(await songExists(ids.get("s-habaytak")!)).toBe(true);
    expect(await songExists(UNKNOWN_UUID)).toBe(false);
    expect(await songExists("s-sidi-mansour")).toBe(false);
  });
});
