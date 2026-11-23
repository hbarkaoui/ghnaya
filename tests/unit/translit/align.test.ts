import { describe, expect, it } from "vitest";
import { checkAlignment, translitLines } from "@/lib/translit/align";

const LYRICS = "يا ليل\nطوّل شويّة\n\nخلّي الغناية";

describe("translitLines", () => {
  it("normalise les retours à la ligne Windows, les espaces de fin et les lignes vides", () => {
    expect(translitLines("ya lil  \r\ntawwel\r\n   \r\nkhalli\n\n")).toEqual(["ya lil", "tawwel", "", "khalli"]);
  });
});

describe("checkAlignment", () => {
  it("accepte une ligne latine par ligne arabe, lignes vides aux mêmes places", () => {
    expect(checkAlignment(LYRICS, "ya lil\ntawwel chwaya\n\nkhalli el-ghnaya\n")).toEqual({
      ok: true,
      text: "ya lil\ntawwel chwaya\n\nkhalli el-ghnaya",
    });
  });

  it("refuse un nombre de lignes différent, en donnant les deux nombres", () => {
    expect(checkAlignment(LYRICS, "ya lil tawwel chwaya\n\nkhalli el-ghnaya")).toEqual({ ok: false, expected: 4, actual: 3 });
  });

  it("refuse une ligne vide déplacée, même avec le bon nombre de lignes", () => {
    expect(checkAlignment(LYRICS, "ya lil\n\ntawwel chwaya\nkhalli el-ghnaya")).toEqual({ ok: false, expected: 4, actual: 4 });
  });

  it("refuse une réponse vide", () => {
    expect(checkAlignment(LYRICS, "  \n")).toMatchObject({ ok: false });
  });
});
