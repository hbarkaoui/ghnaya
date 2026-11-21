import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getArtistPage, getSongById, isUuid } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

const UNKNOWN_UUID = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";

async function saberId(): Promise<string> {
  const r = await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`);
  return r.rows[0].id;
}

describe("queries", () => {
  let ids = new Map<string, string>();
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });

  it("isUuid", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("s-sidi-mansour")).toBe(false);
    expect(isUuid(UNKNOWN_UUID)).toBe(true);
  });

  it("getSongById renvoie la chanson, ses artistes et sa translittération", async () => {
    const song = await getSongById(ids.get("s-sidi-mansour")!);
    expect(song).toMatchObject({
      id: ids.get("s-sidi-mansour"),
      titleAr: "سيدي منصور",
      titleLatin: "Sidi Mansour",
      dialect: "tn",
      source: "lrclib",
    });
    expect(song?.lyrics).toContain("خلّي الغناية تكمّل");
    expect(song?.artists).toEqual([expect.objectContaining({ nameLatin: "Saber Rebai", role: "main" })]);
    expect(song?.translitStatus).not.toBe(undefined);
  });

  it("getSongById renvoie null pour une chanson retirée, inconnue ou un id invalide", async () => {
    const id = ids.get("s-sidi-mansour")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, id));
    expect(await getSongById(id)).toBeNull();
    expect(await getSongById(UNKNOWN_UUID)).toBeNull();
    expect(await getSongById("abc")).toBeNull();
  });

  it("getArtistPage liste les chansons publiées de l'artiste, triées par titre", async () => {
    const data = await getArtistPage(await saberId(), 1);
    expect(data?.artist).toMatchObject({ nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" });
    expect(data?.items.map((i) => i.id).sort()).toEqual([ids.get("s-sidi-mansour"), ids.get("s-ala-nar")].sort());
    expect(data).toMatchObject({ total: 2, page: 1, lastPage: 1 });
    expect(data?.items.every((i) => i.snippet === null && i.artists.length > 0)).toBe(true);
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, ids.get("s-ala-nar")!));
    expect((await getArtistPage(await saberId(), 1))?.total).toBe(1);
  });

  it("getArtistPage pagine ; au-delà de la dernière page, la liste est vide et le total connu", async () => {
    const id = await saberId();
    const first = await getArtistPage(id, 1, 1);
    expect(first).toMatchObject({ total: 2, lastPage: 2 });
    expect(first?.items).toHaveLength(1);
    const beyond = await getArtistPage(id, 3, 1);
    expect(beyond).toMatchObject({ total: 2, page: 3, items: [] });
  });

  it("getArtistPage renvoie null pour un artiste inconnu, sans chanson publiée ou un id invalide", async () => {
    expect(await getArtistPage(UNKNOWN_UUID, 1)).toBeNull();
    expect(await getArtistPage("a-saber", 1)).toBeNull();
    await db.update(songs).set({ status: "removed" });
    expect(await getArtistPage(await saberId(), 1)).toBeNull();
  });
});
