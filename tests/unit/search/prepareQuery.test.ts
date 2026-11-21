import { describe, expect, it } from "vitest";
import { findSnippet, prepareQuery } from "@/lib/search/query";

// Repris du plan 1, tâche 7.

describe("prepareQuery", () => {
  it("requête arabe : pas de partie latine", () => {
    expect(prepareQuery(" سيدى منصور ")).toEqual({ significant: 9, ar: "سيدي منصور", lat: "", key: "sdmnsr" });
  });
  it("requête latine : pas de partie arabe", () => {
    expect(prepareQuery("Sidi Mansour")).toEqual({ significant: 11, ar: "", lat: "sidi mansour", key: "sdmnsr" });
  });
});

describe("findSnippet", () => {
  it("renvoie la première ligne qui correspond", () => {
    const lyrics = "إذا الشعب يوما أراد الحياة\nفلا بد أن يستجيب القدر";
    expect(findSnippet(lyrics, prepareQuery("يستجيب القدر"))).toBe("فلا بد أن يستجيب القدر");
    expect(findSnippet(lyrics, prepareQuery("zzzz"))).toBeNull();
  });
});
