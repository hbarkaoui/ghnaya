import { describe, expect, it } from "vitest";
import { artistPage } from "@/mocks/artists";
import type { ArtistRef, Song } from "@/types/catalog";

const SABER: ArtistRef = { id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai", role: "main" };
const BALTI: ArtistRef = { id: "a-balti", nameAr: null, nameLatin: "Balti", role: "main" };

const song = (id: string, titleAr: string | null, titleLatin: string | null, artists: ArtistRef[]): Song => ({
  id,
  titleAr,
  titleLatin,
  lyrics: "سطر",
  lyricsTranslit: null,
  translitStatus: "none",
  dialect: "tn",
  source: "lrclib",
  artists,
});

const SONGS: Song[] = [
  song("s-ya-lili", null, "Ya Lili", [BALTI, { ...SABER, role: "feat" }]),
  song("s-sidi", "سيدي منصور", "Sidi Mansour", [SABER]),
  song("s-ala-nar", "على نار", null, [SABER]),
  song("s-autre", "أغنية", "Autre", [BALTI]),
];

describe("artistPage", () => {
  it("renvoie null pour un artiste inconnu", () => {
    expect(artistPage(SONGS, "a-inconnu", 1)).toBeNull();
  });

  it("donne les noms de l'artiste et ses chansons, invitées comprises, sans extrait", () => {
    const page = artistPage(SONGS, "a-saber", 1);
    expect(page?.artist).toEqual({ id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" });
    expect(page?.total).toBe(3);
    expect(page?.items.map((hit) => hit.id).sort()).toEqual(["s-ala-nar", "s-sidi", "s-ya-lili"]);
    expect(page?.items.every((hit) => hit.snippet === null)).toBe(true);
    expect(page?.items.find((hit) => hit.id === "s-ya-lili")?.artists).toEqual([BALTI, { ...SABER, role: "feat" }]);
  });

  it("trie par titre latin, ou par titre arabe quand il n'y en a pas (plan 1 : COALESCE(title_latin, title_ar))", () => {
    expect(artistPage(SONGS, "a-saber", 1)?.items.map((hit) => hit.id)).toEqual(["s-sidi", "s-ya-lili", "s-ala-nar"]);
  });

  it("découpe la liste en pages", () => {
    expect(artistPage(SONGS, "a-saber", 1, 2)).toMatchObject({ page: 1, lastPage: 2, total: 3 });
    expect(artistPage(SONGS, "a-saber", 1, 2)?.items.map((hit) => hit.id)).toEqual(["s-sidi", "s-ya-lili"]);
    expect(artistPage(SONGS, "a-saber", 2, 2)?.items.map((hit) => hit.id)).toEqual(["s-ala-nar"]);
  });

  it("renvoie une page vide au-delà de la dernière, en gardant le total", () => {
    expect(artistPage(SONGS, "a-saber", 3, 2)).toMatchObject({ page: 3, lastPage: 2, total: 3, items: [] });
  });
});
