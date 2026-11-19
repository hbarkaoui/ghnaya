import { describe, expect, it } from "vitest";
import { clubCoverStyle, clubInitial, hashName } from "@/components/club/cover";

const NAMES = [
  "Les Jasmins",
  "Malouf Sfax",
  "Chorale du Bardo",
  "نادي الياسمين",
  "Nghanniw",
  "Club des Voix de Carthage",
  "Les Amis du Malouf",
  "أصوات المدينة",
  "Sidi Bou Saïd Chante",
  "Tarab Paris",
];

describe("hashName", () => {
  it("ignore la casse, les espaces superflus et la forme Unicode", () => {
    expect(hashName("Les Jasmins")).toBe(hashName("  les   JASMINS "));
    expect(hashName("Saïd")).toBe(hashName("Saïd"));
  });
});

describe("clubCoverStyle", () => {
  it("est déterministe : le même nom donne toujours la même couverture", () => {
    for (const name of NAMES) expect(clubCoverStyle(name)).toEqual(clubCoverStyle(name));
  });

  it("varie sur 10 noms : au moins 3 combinaisons de couleurs et les 2 orientations", () => {
    const styles = NAMES.map(clubCoverStyle);
    expect(new Set(styles.map((s) => s.combo)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(styles.map((s) => s.rotation)).size).toBe(2);
  });

  it("ne produit que des valeurs valides", () => {
    for (const s of NAMES.map(clubCoverStyle)) {
      expect([1, 2, 3, 4]).toContain(s.combo);
      expect([0, 22.5]).toContain(s.rotation);
      expect(["outline", "filled", "double"]).toContain(s.motif);
    }
  });
});

describe("clubInitial", () => {
  it("saute les mots génériques et l'article arabe", () => {
    expect(clubInitial("Les Jasmins")).toBe("J");
    expect(clubInitial("Club des Voix de Carthage")).toBe("V");
    expect(clubInitial("Chorale du Bardo")).toBe("B");
    expect(clubInitial("نادي الياسمين")).toBe("ي");
    expect(clubInitial("أصوات المدينة")).toBe("أ");
  });

  it("met en majuscule et ne renvoie jamais une chaîne vide", () => {
    expect(clubInitial("tarab paris")).toBe("T");
    expect(clubInitial("Club")).toBe("C");
    expect(clubInitial("   ")).toBe("·");
  });
});
