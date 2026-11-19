import { describe, expect, it } from "vitest";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { countSignificant, detectScript } from "@/lib/text/detectScript";

// Repris du plan 1, tâche 2.

describe("normalizeArabic", () => {
  it("supprime tashkeel et tatweel", () => {
    expect(normalizeArabic("غَنّـــي")).toBe("غني");
  });
  it("unifie les variantes de lettres", () => {
    expect(normalizeArabic("أإآٱ")).toBe("اااا");
    expect(normalizeArabic("على")).toBe("علي");
    expect(normalizeArabic("ليلة")).toBe("ليله");
    expect(normalizeArabic("مؤمن سائل")).toBe("مومن سايل");
    expect(normalizeArabic("کتاب ی")).toBe("كتاب ي");
  });
  it("convertit les chiffres arabo-indiens", () => {
    expect(normalizeArabic("٣ ۷")).toBe("3 7");
  });
  it("remplace la ponctuation et réduit les espaces", () => {
    expect(normalizeArabic("  يا  ليل،\n يا عين!  ")).toBe("يا ليل يا عين");
  });
});

describe("normalizeLatin", () => {
  it("minuscules, sans accents ni ponctuation", () => {
    expect(normalizeLatin("Saber Rebaï — (Live)")).toBe("saber rebai live");
  });
  it("garde les chiffres de l’arabizi", () => {
    expect(normalizeLatin("Ana wel 3azab")).toBe("ana wel 3azab");
  });
});

describe("detectScript / countSignificant", () => {
  it("détecte arabe, latin et mixte", () => {
    expect(detectScript("سيدي منصور")).toBe("arabic");
    expect(detectScript("sidi mansour")).toBe("latin");
    expect(detectScript("Habaytak حبيتك")).toBe("mixed");
    expect(detectScript("3")).toBe("latin");
  });
  it("compte lettres et chiffres", () => {
    expect(countSignificant(" a ! ")).toBe(1);
    expect(countSignificant("يا 3")).toBe(3);
  });
});
