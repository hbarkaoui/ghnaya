import { describe, expect, it } from "vitest";
import { artistHref, parseArtistParams } from "@/lib/artist/routes";

describe("parseArtistParams", () => {
  it("lit la page demandée", () => {
    expect(parseArtistParams({ page: "3" })).toEqual({ page: 3 });
  });

  it("prend la première valeur d'un paramètre répété", () => {
    expect(parseArtistParams({ page: ["2", "5"] })).toEqual({ page: 2 });
  });

  it("ramène une page absente, nulle, négative ou non entière à 1", () => {
    for (const page of [undefined, "0", "-2", "1.5", "abc", ""]) {
      expect(parseArtistParams({ page }).page).toBe(1);
    }
  });
});

describe("artistHref", () => {
  it("laisse la page 1 implicite", () => {
    expect(artistHref("a-saber")).toBe("/artiste/a-saber");
    expect(artistHref("a-saber", 1)).toBe("/artiste/a-saber");
  });

  it("ajoute ?page= à partir de la page 2", () => {
    expect(artistHref("a-saber", 2)).toBe("/artiste/a-saber?page=2");
  });

  it("encode l'identifiant", () => {
    expect(artistHref("a b/c")).toBe("/artiste/a%20b%2Fc");
  });
});
