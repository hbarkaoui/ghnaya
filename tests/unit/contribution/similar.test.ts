import { describe, expect, it } from "vitest";
import { SONGS } from "@/mocks/catalog";
import { findSimilarSongs } from "@/mocks/similar";

const ids = (hits: { id: string }[]) => hits.map((h) => h.id);

describe("findSimilarSongs (« existe peut-être déjà »)", () => {
  it("trouve la chanson par son titre latin ou arabe", () => {
    expect(ids(findSimilarSongs(SONGS, { titles: ["sidi mansour"], artists: ["Saber Rebai"] }))[0]).toBe("s-sidi-mansour");
    expect(ids(findSimilarSongs(SONGS, { titles: ["سيدي منصور"], artists: [] }))[0]).toBe("s-sidi-mansour");
  });

  it("place d'abord les chansons du même artiste", () => {
    // « ya lili » ressort Ya Lili (Balti) puis Ya Lella (Hedi Jouini).
    expect(ids(findSimilarSongs(SONGS, { titles: ["ya lili"], artists: ["Hedi Jouini"] }))).toEqual([
      "s-ya-lella",
      "s-ya-lili",
    ]);
  });

  it("ne liste pas deux fois une chanson trouvée par ses deux titres", () => {
    expect(ids(findSimilarSongs(SONGS, { titles: ["سيدي منصور", "Sidi Mansour"], artists: [] }))).toEqual([
      "s-sidi-mansour",
    ]);
  });

  it("montre 3 chansons au plus, sans extrait de paroles", () => {
    const hits = findSimilarSongs(SONGS, { titles: ["ya"], artists: ["oum kalthoum"] });
    expect(hits.length).toBeLessThanOrEqual(3);
    expect(hits.every((h) => h.snippet === null)).toBe(true);
  });

  it("ne cherche rien sans titre", () => {
    expect(findSimilarSongs(SONGS, { titles: ["", " "], artists: ["Saber Rebai"] })).toEqual([]);
  });

  it("ne rapproche pas une chanson par ses seules paroles", () => {
    // « الليل » apparaît dans plusieurs paroles, mais dans aucun titre.
    expect(findSimilarSongs(SONGS, { titles: ["الليل"], artists: [] })).toEqual([]);
  });
});
