import { describe, expect, it } from "vitest";
import { parseSearchParams, searchHref } from "@/lib/search/searchParams";

describe("parseSearchParams", () => {
  it("lit la requête, la page et le dialecte", () => {
    expect(parseSearchParams({ q: "sidi mansour", page: "2", dialecte: "tn" })).toEqual({
      q: "sidi mansour",
      page: 2,
      dialect: "tn",
    });
  });

  it("prend la première valeur d'un paramètre répété", () => {
    expect(parseSearchParams({ q: ["a", "b"], page: ["3", "4"] })).toMatchObject({ q: "a", page: 3 });
  });

  it("ramène une page absente, nulle, négative ou non entière à 1", () => {
    for (const page of [undefined, "0", "-2", "1.5", "abc", ""]) {
      expect(parseSearchParams({ page }).page).toBe(1);
    }
  });

  it("ignore un dialecte inconnu", () => {
    expect(parseSearchParams({ dialecte: "klingon" }).dialect).toBeUndefined();
  });

  it("renvoie une requête vide sans paramètre q", () => {
    expect(parseSearchParams({}).q).toBe("");
  });
});

describe("searchHref", () => {
  it("construit l'adresse de recherche, sans la page 1", () => {
    expect(searchHref({ q: "sidi mansour", page: 1 })).toBe("/recherche?q=sidi+mansour");
    expect(searchHref({ q: "سيدي", dialect: "tn", page: 2 })).toBe(
      "/recherche?q=%D8%B3%D9%8A%D8%AF%D9%8A&dialecte=tn&page=2",
    );
  });

  it("garde un paramètre d'aperçu de développement", () => {
    expect(searchHref({ q: "يا", page: 2, preview: "pagination" })).toBe(
      "/recherche?q=%D9%8A%D8%A7&page=2&apercu=pagination",
    );
  });
});
