import { describe, expect, it } from "vitest";
import { toSearchKey } from "@/lib/text/searchKey";

// Repris du plan 1, tâche 3.

const SAME_KEY: Array<[string, string, string]> = [
  ["سيدي منصور", "Sidi Mansour", "sdmnsr"],
  ["سيدى منصور", "sidi mansur", "sdmnsr"],
  ["ولا", "wala", "l"],
  ["غنّي", "Ghanni", "gn"],
  ["أنا والعذاب", "Ana wel 3azab", "nlzb"],
  // ع est muet : les titres latins des plateformes l'omettent souvent (« Omri », « Maad »).
  ["انت عمري", "Enta Omri", "ntmr"],
  ["انت عمري", "enta 3omri", "ntmr"],
  ["فات الميعاد", "Fat El Maad", "ftlmd"],
  ["ڨلبي", "galbi", "klb"],
  ["حبيبي", "habibi", "hb"],
  ["حبي", "7obi", "hb"],
  ["شمس", "chams", "cms"],
  ["خليها", "khalliha", "xlh"],
  ["قلبي", "9albi", "klb"],
];

describe("toSearchKey", () => {
  it.each(SAME_KEY)("%s et %s donnent %s", (ar, lat, key) => {
    expect(toSearchKey(ar)).toBe(key);
    expect(toSearchKey(lat)).toBe(key);
  });
  it("ignore la ponctuation et les caractères inconnus", () => {
    expect(toSearchKey("Sidi-Mansour !!")).toBe("sdmnsr");
  });
  it("renvoie une chaîne vide pour une entrée sans consonne", () => {
    expect(toSearchKey("aïe ي")).toBe("");
  });
});
