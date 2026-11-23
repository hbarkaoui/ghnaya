import { describe, expect, it } from "vitest";
import { DIALECT_NAMES, TRANSLIT_SYSTEM, translitUserMessage } from "@/lib/translit/prompt";
import { DIALECTS } from "@/types/catalog";

describe("prompt de translittération", () => {
  it("impose une ligne latine par ligne arabe et les conventions de l'arabizi tunisien", () => {
    expect(TRANSLIT_SYSTEM).toContain("une ligne latine par ligne arabe");
    for (const convention of ["ع = 3", "ح = 7", "ق = 9", "ش = ch", "خ = kh", "غ = gh"]) {
      expect(TRANSLIT_SYSTEM).toContain(convention);
    }
  });

  it("nomme chaque dialecte", () => {
    for (const dialect of DIALECTS) expect(DIALECT_NAMES[dialect].length).toBeGreaterThan(0);
  });

  it("donne le dialecte, le nombre de lignes et les paroles, entre balises", () => {
    const message = translitUserMessage("يا ليل\n\nخلّي الغناية", "tn");
    expect(message).toContain(DIALECT_NAMES.tn);
    expect(message).toContain("3 lignes");
    expect(message).toContain("<paroles>\nيا ليل\n\nخلّي الغناية\n</paroles>");
  });
});
