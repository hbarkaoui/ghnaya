import { describe, expect, it } from "vitest";
import { searchSongs } from "@/lib/search/searchSongs";
import { PAGE_SIZE } from "@/lib/search/types";
import { searchCatalog } from "@/mocks/search";
import type { Song } from "@/types/catalog";

/**
 * Requêtes de référence du plan 1 (tâche 7), adaptées au jeu de données fictif :
 * [requête, identifiant de la chanson attendue dans le top 3].
 */
const GOLDEN_QUERIES: Array<[string, string]> = [
  ["sidi mansour", "s-sidi-mansour"],
  ["سيدي منصور", "s-sidi-mansour"],
  ["sidi mansur", "s-sidi-mansour"],
  ["sidi mansor", "s-sidi-mansour"],
  ["سيدى منصور", "s-sidi-mansour"],
  ["saber rebai", "s-sidi-mansour"],
  ["صابر الرباعي", "s-ala-nar"],
  ["3la nar", "s-ala-nar"],
  ["ana wel 3azab", "s-ana-wel-azab"],
  ["انا والعذاب", "s-ana-wel-azab"],
  ["bouchnak", "s-ana-wel-azab"],
  ["نحكيو على اللي فات", "s-ana-wel-azab"],
  ["enta 3omri", "s-enta-omri"],
  ["oum kalthoum", "s-enta-omri"],
  ["ام كلثوم", "s-enta-omri"],
  ["habaytak", "s-habaytak"],
  ["حبيتك", "s-habaytak"],
  ["fayrouz", "s-habaytak"],
  ["balti", "s-ya-lili"],
  ["بلطي", "s-ya-lili"],
  ["يستجيب القدر", "s-iradat-al-hayat"],
  ["chebbi", "s-iradat-al-hayat"],
  ["الشابي", "s-iradat-al-hayat"],
  ["ya lella", "s-ya-lella"],
  ["يا لالة", "s-ya-lella"],
  ["الجويني", "s-ya-lella"],
  ["khalli el ghnaya", "s-sidi-mansour"],
];

describe("searchSongs (données fictives) : requêtes de référence", () => {
  it.each(GOLDEN_QUERIES)("« %s » place %s dans le top 3", async (query, id) => {
    const res = await searchSongs(query);
    expect(res.items.slice(0, 3).map((i) => i.id)).toContain(id);
  });
});

describe("searchSongs (données fictives) : comportements", () => {
  it("met la chanson cherchée en tête", async () => {
    expect((await searchSongs("sidi mansour")).items[0].id).toBe("s-sidi-mansour");
    expect((await searchSongs("3la nar")).items[0].id).toBe("s-ala-nar");
  });

  it("refuse une requête trop courte", async () => {
    expect(await searchSongs(" a ")).toEqual({ items: [], total: 0, page: 1, tooShort: true });
    expect((await searchSongs("!!")).tooShort).toBe(true);
  });

  it("ne remonte pas tout le catalogue pour une clé de consonnes très courte", async () => {
    // « ya lella » a pour clé « l » : seule la chanson qui porte ce titre doit sortir.
    expect((await searchSongs("ya lella")).items.map((i) => i.id)).toEqual(["s-ya-lella"]);
  });

  it("filtre par dialecte", async () => {
    expect((await searchSongs("sidi mansour", { dialect: "eg" })).total).toBe(0);
    expect((await searchSongs("sidi mansour", { dialect: "tn" })).total).toBe(1);
  });

  it("renvoie l'extrait de paroles et les artistes", async () => {
    const chebbi = (await searchSongs("يستجيب القدر")).items[0];
    expect(chebbi.snippet).toBe("فلا بد أن يستجيب القدر");
    const sidi = (await searchSongs("sidi mansour")).items[0];
    expect(sidi.artists[0]).toMatchObject({ nameLatin: "Saber Rebai", role: "main" });
    expect(sidi.snippet).toBeNull();
  });

  it("trouve les paroles arabes depuis une requête en arabizi", async () => {
    const sidi = (await searchSongs("khalli el ghnaya")).items.find((i) => i.id === "s-sidi-mansour");
    expect(sidi?.snippet).toBe("خلّي الغناية تكمّل");
  });

  it("ne renvoie pas les paroles complètes", async () => {
    const hit = (await searchSongs("sidi mansour")).items[0];
    expect(Object.keys(hit).sort()).toEqual(["artists", "dialect", "id", "snippet", "titleAr", "titleLatin"]);
  });
});

describe("searchCatalog : pagination", () => {
  const song = (n: number): Song => ({
    id: `s-${n}`,
    titleAr: null,
    titleLatin: `Ghanni ${String(n).padStart(2, "0")}`,
    lyrics: "سطر",
    lyricsTranslit: null,
    translitStatus: "none",
    dialect: "tn",
    source: "lrclib",
    artists: [],
  });
  const CATALOG = Array.from({ length: 25 }, (_, i) => song(i + 1));

  it(`découpe en pages de ${PAGE_SIZE} et compte le total`, () => {
    const p1 = searchCatalog(CATALOG, "ghanni");
    expect(p1.items).toHaveLength(PAGE_SIZE);
    expect(p1.total).toBe(25);
    const p2 = searchCatalog(CATALOG, "ghanni", { page: 2 });
    expect(p2.items.map((i) => i.id)).toEqual(["s-21", "s-22", "s-23", "s-24", "s-25"]);
    expect(p2).toMatchObject({ total: 25, page: 2 });
  });

  it("au-delà de la dernière page : aucun résultat et un total à 0, comme la requête SQL du plan 1", () => {
    expect(searchCatalog(CATALOG, "ghanni", { page: 3 })).toEqual({ items: [], total: 0, page: 3, tooShort: false });
  });

  it("accepte une taille de page plus petite (aperçu de développement)", () => {
    const res = searchCatalog(CATALOG, "ghanni", { page: 2 }, 10);
    expect(res.items.map((i) => i.id)[0]).toBe("s-11");
    expect(res.items).toHaveLength(10);
  });

  it("ramène une page invalide à 1", () => {
    expect(searchCatalog(CATALOG, "ghanni", { page: 0 }).page).toBe(1);
  });
});
