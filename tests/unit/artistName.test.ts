import { describe, expect, it } from "vitest";
import { artistDisplayName } from "@/components/song/artistName";

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
