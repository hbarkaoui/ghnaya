import { describe, expect, it } from "vitest";
import { knownArtists, resolveArtists, suggestArtists, type KnownArtist } from "@/lib/contribution/artists";
import { SONGS } from "@/mocks/catalog";

const ARTISTS: KnownArtist[] = [
  { id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" },
  { id: "a-oum", nameAr: "أم كلثوم", nameLatin: "Oum Kalthoum" },
  { id: "a-fairuz", nameAr: "فيروز", nameLatin: "Fairuz" },
  { id: "a-bouchnak", nameAr: "لطفي بوشناق", nameLatin: null },
  { id: "a-mkalo", nameAr: null, nameLatin: "Mkalo" },
];

const ids = (artists: KnownArtist[]) => artists.map((a) => a.id);

describe("knownArtists", () => {
  it("rassemble les artistes du catalogue, chacun une seule fois", () => {
    const artists = knownArtists(SONGS);
    expect(artists.length).toBe(new Set(artists.map((a) => a.id)).size);
    expect(artists).toContainEqual({ id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" });
  });
});

describe("suggestArtists", () => {
  it("ne propose rien sous 2 lettres", () => {
    expect(suggestArtists("s", ARTISTS)).toEqual([]);
    expect(suggestArtists("  ", ARTISTS)).toEqual([]);
  });

  it("trouve un nom latin par son début, sans tenir compte de la casse", () => {
    expect(ids(suggestArtists("sab", ARTISTS))).toEqual(["a-saber"]);
  });

  it("trouve un nom arabe, avec ou sans hamza", () => {
    expect(ids(suggestArtists("ام كل", ARTISTS))).toEqual(["a-oum"]);
  });

  it("trouve un nom arabe à partir de l'arabizi, et inversement", () => {
    expect(ids(suggestArtists("bouchnak", ARTISTS))).toEqual(["a-bouchnak"]);
    expect(ids(suggestArtists("fairouz", ARTISTS))).toEqual(["a-fairuz"]);
    expect(ids(suggestArtists("مكالو", ARTISTS))).toEqual(["a-mkalo"]);
  });

  it("ignore l'article « ال » d'un nom arabe quand on tape en arabizi", () => {
    const artists: KnownArtist[] = [{ id: "a-riahi", nameAr: "علي الرياحي", nameLatin: null }];
    expect(ids(suggestArtists("riahi", artists))).toEqual(["a-riahi"]);
  });

  it("compare l'arabizi mot à mot, sans rapprocher deux mots d'un seul", () => {
    // « ام كل » (Oum Kalthoum) a la même clé de consonnes que « Mkalo », mais en deux mots.
    expect(ids(suggestArtists("ام كل", ARTISTS))).toEqual(["a-oum"]);
  });

  it("place les noms qui commencent par la requête avant ceux qui la contiennent", () => {
    const artists: KnownArtist[] = [
      { id: "contains", nameAr: null, nameLatin: "Hedi Jouini" },
      { id: "prefix", nameAr: null, nameLatin: "Jouini Band" },
    ];
    expect(ids(suggestArtists("joui", artists))).toEqual(["prefix", "contains"]);
  });

  it("limite le nombre de suggestions", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ id: `a${i}`, nameAr: null, nameLatin: `Salah ${i}` }));
    expect(suggestArtists("sal", many)).toHaveLength(5);
    expect(suggestArtists("sal", many, 3)).toHaveLength(3);
  });
});

describe("resolveArtists", () => {
  it("relie un nom connu, dans l'une ou l'autre écriture, à l'artiste existant", () => {
    expect(resolveArtists(["saber rebai", "فيروز"], ARTISTS)).toEqual([
      { id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" },
      { id: "a-fairuz", nameAr: "فيروز", nameLatin: "Fairuz" },
    ]);
  });

  it("crée un nouvel artiste, rangé selon l'écriture de son nom", () => {
    expect(resolveArtists(["Emel Mathlouthi", "آمال المثلوثي"], ARTISTS)).toEqual([
      { id: null, nameAr: null, nameLatin: "Emel Mathlouthi" },
      { id: null, nameAr: "آمال المثلوثي", nameLatin: null },
    ]);
  });

  it("ne garde qu'une fois un artiste saisi dans les deux écritures", () => {
    expect(resolveArtists(["Saber Rebai", "صابر الرباعي"], ARTISTS)).toEqual([
      { id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" },
    ]);
  });
});
