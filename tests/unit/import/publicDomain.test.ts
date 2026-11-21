import { describe, expect, it } from "vitest";
import { checkSong, isPublicDomain, type PublicDomainSong } from "../../../scripts/import/publicDomainSchema";

const song: PublicDomainSong = {
  key: "test",
  title_ar: "عنوان",
  artists: [{ name_ar: "فنان" }],
  lyricist: "شاعر",
  author_death_year: 1934,
  traditional: false,
  dialect: "msa",
  lyrics: "سطر أول من القصيدة\nسطر ثاني من القصيدة",
};

describe("isPublicDomain", () => {
  it("applique vie + 50 ans à compter du 1er janvier suivant le décès", () => {
    expect(isPublicDomain({ traditional: false, author_death_year: 1975 }, 2026)).toBe(true);
    expect(isPublicDomain({ traditional: false, author_death_year: 1976 }, 2026)).toBe(false);
    expect(isPublicDomain({ traditional: true }, 2026)).toBe(true);
    expect(isPublicDomain({ traditional: false }, 2026)).toBe(false);
  });
});

describe("checkSong", () => {
  it("accepte une œuvre libre sans translittération", () => {
    expect(checkSong(song, 2026)).toBeNull();
  });
  it("refuse une œuvre encore protégée", () => {
    expect(checkSong({ ...song, author_death_year: 1990 }, 2026)).toEqual({ key: "test", reason: "not_public_domain" });
  });
  it("refuse une translittération mal alignée", () => {
    expect(checkSong({ ...song, lyrics_translit: "une seule ligne" }, 2026)).toEqual({
      key: "test",
      reason: "translit_misaligned",
    });
  });
});
