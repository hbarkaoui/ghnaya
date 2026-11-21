import { describe, expect, it } from "vitest";
import { PAGE_SIZE } from "@/lib/search/types";
import { SONGS } from "@/mocks/catalog";
import { searchCatalog } from "@/mocks/search";
import type { Song } from "@/types/catalog";
import { GOLDEN_QUERIES } from "../../fixtures/search-golden";

/**
 * Recherche en mémoire des aperçus de développement (`?apercu=pagination`). La recherche en base, elle,
 * est testée contre PostgreSQL dans `tests/integration/search.test.ts`, sur les mêmes requêtes.
 */
describe("searchCatalog (données fictives) : requêtes de référence", () => {
  it.each(GOLDEN_QUERIES)("« %s » place %s dans le top 3", (query, id) => {
    expect(searchCatalog(SONGS, query).items.slice(0, 3).map((i) => i.id)).toContain(id);
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

describe("searchCatalog : paroles cherchées mot par mot", () => {
  const song = (id: string, lyrics: string): Song => ({
    id,
    titleAr: null,
    titleLatin: `Chanson ${id}`,
    lyrics,
    lyricsTranslit: null,
    translitStatus: "none",
    dialect: "eg",
    source: "lrclib",
    artists: [],
  });

  it("trouve les paroles qui ont tous les mots de la requête, après celles qui ont la phrase exacte", () => {
    // Version chantée de « فات الميعاد », reprises comprises : la phrase exacte n'y est pas.
    const catalog = [
      song("chantee", "تفيد بإيه، إيه، إيه يا ندم\nوتعمل إيه يا عتاب"),
      song("exacte", "تفيد بإيه يا ندم وتعمل إيه يا عتاب"),
      song("partielle", "تفيد يا ندم"),
    ];
    const res = searchCatalog(catalog, "تفيد بإيه يا ندم");
    expect(res.items.map((i) => i.id)).toEqual(["exacte", "chantee"]);
    expect(res.items[1].snippet).toBe("تفيد بإيه، إيه، إيه يا ندم");
  });

  it("ne cherche pas mot par mot une requête d'un seul mot de 3 lettres ou plus", () => {
    expect(searchCatalog([song("loin", "ندم بعيد عن الحب")], "يا الندم").items).toEqual([]);
  });
});
