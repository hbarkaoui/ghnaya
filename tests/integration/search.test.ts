import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { searchSongs } from "@/lib/search/searchSongs";
import { GOLDEN_QUERIES } from "../fixtures/search-golden";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

async function saberId(): Promise<string> {
  const r = await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`);
  return r.rows[0].id;
}

describe("searchSongs : requêtes de référence", () => {
  let ids = new Map<string, string>();
  beforeAll(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });

  it("écrit chaque chanson fictive sous un UUID distinct", () => {
    expect(new Set(ids.values()).size).toBe(ids.size);
  });

  it.each(GOLDEN_QUERIES)("« %s » place %s dans le top 3", async (query, ref) => {
    const res = await searchSongs(query);
    expect(res.items.slice(0, 3).map((i) => i.id)).toContain(ids.get(ref));
  });
});

describe("searchSongs : comportements", () => {
  let ids = new Map<string, string>();
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });

  it("met la chanson cherchée en tête", async () => {
    expect((await searchSongs("sidi mansour")).items[0].id).toBe(ids.get("s-sidi-mansour"));
    expect((await searchSongs("3la nar")).items[0].id).toBe(ids.get("s-ala-nar"));
  });

  it("refuse une requête trop courte", async () => {
    expect(await searchSongs(" a ")).toEqual({ items: [], total: 0, page: 1, tooShort: true });
    expect((await searchSongs("!!")).tooShort).toBe(true);
  });

  it("ne remonte pas tout le catalogue pour une clé de consonnes très courte", async () => {
    // « ya lella » a pour clé « l » : seule la chanson qui porte ce titre doit sortir (écart 4).
    expect((await searchSongs("ya lella")).items.map((i) => i.id)).toEqual([ids.get("s-ya-lella")]);
  });

  it("exclut les chansons retirées", async () => {
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, ids.get("s-sidi-mansour")!));
    const res = await searchSongs("sidi mansour");
    expect(res.items.map((i) => i.id)).not.toContain(ids.get("s-sidi-mansour"));
  });

  it("filtre par dialecte", async () => {
    expect((await searchSongs("sidi mansour", { dialect: "eg" })).total).toBe(0);
    expect((await searchSongs("sidi mansour", { dialect: "tn" })).total).toBe(1);
  });

  it("filtre par artiste", async () => {
    const res = await searchSongs("طول شوية", { artistId: await saberId() });
    expect(res.items.map((i) => i.id).sort()).toEqual([ids.get("s-sidi-mansour"), ids.get("s-ala-nar")].sort());
  });

  it("renvoie l'extrait de paroles et les artistes", async () => {
    const chebbi = (await searchSongs("يستجيب القدر")).items[0];
    expect(chebbi.snippet).toBe("فلا بد أن يستجيب القدر");
    const sidi = (await searchSongs("sidi mansour")).items[0];
    expect(sidi.artists[0]).toMatchObject({ nameLatin: "Saber Rebai", role: "main" });
    expect(sidi.snippet).toBeNull();
  });

  it("trouve les paroles arabes depuis une requête en arabizi", async () => {
    const sidi = (await searchSongs("khalli el ghnaya")).items.find((i) => i.id === ids.get("s-sidi-mansour"));
    expect(sidi?.snippet).toBe("خلّي الغناية تكمّل");
  });

  it("ne renvoie pas les paroles complètes", async () => {
    const hit = (await searchSongs("sidi mansour")).items[0];
    expect(Object.keys(hit).sort()).toEqual(["artists", "dialect", "id", "snippet", "titleAr", "titleLatin"]);
  });

  it("pagine et compte : au-delà de la dernière page, aucun résultat et un total à 0", async () => {
    const res = await searchSongs("طول شوية");
    expect(res.total).toBeGreaterThanOrEqual(2);
    expect(await searchSongs("طول شوية", { page: 2 })).toEqual({ items: [], total: 0, page: 2, tooShort: false });
  });

  it("ramène une page invalide à 1", async () => {
    expect((await searchSongs("sidi mansour", { page: 0 })).page).toBe(1);
    expect((await searchSongs("sidi mansour", { page: Number.NaN })).page).toBe(1);
  });
});
