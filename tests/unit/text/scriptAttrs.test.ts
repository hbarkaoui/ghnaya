import { describe, expect, it } from "vitest";
import { scriptAttrs, textOf } from "@/lib/text/scriptAttrs";

describe("scriptAttrs", () => {
  it("balise un fragment arabe en lang=ar et dir=rtl (interface française)", () => {
    expect(scriptAttrs("سلمى")).toEqual({ lang: "ar", dir: "rtl" });
  });

  it("met un fragment latin en dir=ltr, sans deviner sa langue (français, arabizi…)", () => {
    expect(scriptAttrs("Les Jasmins")).toEqual({ dir: "ltr" });
  });

  it("laisse le navigateur choisir pour un texte mêlé ou sans lettre", () => {
    expect(scriptAttrs("Sidi Mansour سيدي منصور")).toEqual({ dir: "auto" });
    expect(scriptAttrs("2026")).toEqual({ dir: "auto" });
    expect(scriptAttrs("")).toEqual({ dir: "auto" });
  });

  it("ne se laisse pas tromper par les chiffres et la ponctuation d'un nom latin", () => {
    expect(scriptAttrs("Séance du 12/12 !")).toEqual({ dir: "ltr" });
  });
});

describe("textOf", () => {
  it("rassemble le texte des morceaux que t.rich passe à une balise", () => {
    expect(textOf(["Les ", "Jasmins"])).toBe("Les Jasmins");
    expect(textOf("سلمى")).toBe("سلمى");
    expect(textOf(42)).toBe("42");
  });

  it("ignore ce qui n'est pas du texte", () => {
    expect(textOf([null, undefined, false, "Nour"])).toBe("Nour");
  });
});
