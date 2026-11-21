import { describe, expect, it } from "vitest";
import { artistDisplayName, artistsExcept, artistsLine } from "@/components/song/artistName";

const SABER = { nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" };

describe("artistDisplayName", () => {
  it("préfère le nom latin en français et le nom arabe en arabe", () => {
    expect(artistDisplayName(SABER, "fr")).toEqual({ name: "Saber Rebai", arabic: false });
    expect(artistDisplayName(SABER, "ar")).toEqual({ name: "صابر الرباعي", arabic: true });
  });

  it("se replie sur l'autre écriture quand un nom manque", () => {
    expect(artistDisplayName({ nameAr: "بلطي", nameLatin: null }, "fr")).toEqual({ name: "بلطي", arabic: true });
    expect(artistDisplayName({ nameAr: null, nameLatin: "Balti" }, "ar")).toEqual({ name: "Balti", arabic: false });
  });
});

describe("artistsLine", () => {
  const main = (id: string, nameAr: string, nameLatin: string) => ({ id, nameAr, nameLatin, role: "main" as const });
  const feat = (id: string, nameAr: string, nameLatin: string) => ({ id, nameAr, nameLatin, role: "feat" as const });

  it("liste les artistes principaux dans l'écriture et la langue de l'interface", () => {
    const artists = [main("a", "لطفي بوشناق", "Lotfi Bouchnak"), main("b", "صابر الرباعي", "Saber Rebai")];
    expect(artistsLine(artists, "fr")).toBe("Lotfi Bouchnak et Saber Rebai");
    expect(artistsLine(artists, "ar")).toBe(new Intl.ListFormat("ar", { type: "conjunction" }).format(["لطفي بوشناق", "صابر الرباعي"]));
  });

  it("laisse les invités de côté quand il y a des artistes principaux", () => {
    expect(artistsLine([main("a", "بلطي", "Balti"), feat("b", "صابر الرباعي", "Saber Rebai")], "fr")).toBe("Balti");
  });

  it("se replie sur les invités sans artiste principal, et rend une chaîne vide sans artiste", () => {
    expect(artistsLine([feat("b", "صابر الرباعي", "Saber Rebai")], "fr")).toBe("Saber Rebai");
    expect(artistsLine([], "fr")).toBe("");
  });
});

describe("artistsExcept", () => {
  const ref = (id: string, role: "main" | "feat" = "main") => ({ id, nameAr: null, nameLatin: id, role });

  it("retire l'artiste de la page, pour ne garder que les autres (page artiste)", () => {
    expect(artistsExcept([ref("a-balti"), ref("a-saber", "feat")], "a-saber")).toEqual([ref("a-balti")]);
  });

  it("rend une liste vide quand l'artiste chante seul", () => {
    expect(artistsExcept([ref("a-saber")], "a-saber")).toEqual([]);
  });
});
