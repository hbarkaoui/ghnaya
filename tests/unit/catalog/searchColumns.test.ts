import { describe, expect, it } from "vitest";
import { artistSearchColumns, songSearchColumns } from "@/lib/catalog/searchColumns";

describe("searchColumns", () => {
  it("artiste : répartit arabe et latin, clé commune dédoublonnée", () => {
    expect(artistSearchColumns({ nameAr: "صابر الرباعي", nameLatin: "Saber Rebai", aliases: ["Saber Rebaï"] })).toEqual({
      searchAr: "صابر الرباعي",
      searchLatin: "saber rebai",
      searchKey: "sbrlrb3 sbrb",
    });
  });
  it("chanson : titre puis artistes, paroles normalisées", () => {
    const cols = songSearchColumns({
      titleAr: "سيدي منصور",
      titleLatin: "Sidi Mansour",
      lyrics: "يَا لِيل\nيا عين",
      artists: [{ nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" }],
    });
    expect(cols.searchAr).toBe("سيدي منصور صابر الرباعي");
    expect(cols.searchLatin).toBe("sidi mansour saber rebai");
    expect(cols.searchKey).toBe("sdmnsr sbrlrb3 sbrb");
    expect(cols.lyricsSearchAr).toBe("يا ليل يا عين");
    expect(cols.lyricsSearchKey).toBe("l3n");
  });
});
