import { describe, expect, it } from "vitest";
import { songDisplayTitle } from "@/components/song/songTitle";

describe("songDisplayTitle", () => {
  const both = { titleAr: "سيدي منصور", titleLatin: "Sidi Mansour" };

  it("préfère le titre latin en français et le titre arabe en arabe", () => {
    expect(songDisplayTitle(both, "fr")).toBe("Sidi Mansour");
    expect(songDisplayTitle(both, "ar")).toBe("سيدي منصور");
  });

  it("se replie sur l'autre titre quand un seul existe", () => {
    expect(songDisplayTitle({ titleAr: "على نار", titleLatin: null }, "fr")).toBe("على نار");
    expect(songDisplayTitle({ titleAr: null, titleLatin: "Ya Lili" }, "ar")).toBe("Ya Lili");
  });
});
