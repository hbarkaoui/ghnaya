import { describe, expect, it } from "vitest";
import { arabicRatio } from "@/lib/text/arabicRatio";
import { cleanImportedTitle, splitArtists, splitTitleScripts } from "@/lib/text/titles";

describe("splitArtists", () => {
  it("découpe sur feat., ft., featuring, virgule et &", () => {
    expect(splitArtists("Balti feat. Hamouda")).toEqual(["Balti", "Hamouda"]);
    expect(splitArtists("A ft. B, C & D featuring E")).toEqual(["A", "B", "C", "D", "E"]);
  });
  it("dédoublonne sans tenir compte de la casse ni des accents", () => {
    expect(splitArtists("Saber Rebaï & saber rebai")).toEqual(["Saber Rebaï"]);
  });
});

describe("cleanImportedTitle", () => {
  it("retire les numéros de piste", () => {
    expect(cleanImportedTitle("02. قديش كان في ناس", ["فيروز"]).title).toBe("قديش كان في ناس");
  });
  it("retire le préfixe artiste et le bruit vidéo", () => {
    expect(cleanImportedTitle("Balti - Ena (Official Music Video)", ["Balti"]).title).toBe("Ena");
    expect(cleanImportedTitle("Fairuz Habaytak Bel Saif حبيتك بالصيف", ["Fairuz"]).title).toBe(
      "Habaytak Bel Saif حبيتك بالصيف",
    );
  });
  it("extrait les invités du titre", () => {
    expect(cleanImportedTitle("Nebni (feat. EMP1RE, Lotfi Bouchnak & Allchestra)", ["Balti"])).toEqual({
      title: "Nebni",
      featuring: ["EMP1RE", "Lotfi Bouchnak", "Allchestra"],
    });
  });
  it("gère « Artiste feat. Invité - Titre »", () => {
    expect(cleanImportedTitle("Balti ft. Akram Mag - Regragi Style (Official Music Video)", ["Balti"])).toEqual({
      title: "Regragi Style",
      featuring: ["Akram Mag"],
    });
  });
  it("retire le bruit en arabe et après une barre verticale", () => {
    expect(cleanImportedTitle("على نار (فيديو كليب) | 2019", []).title).toBe("على نار");
  });
  it("ne vide jamais un titre", () => {
    expect(cleanImportedTitle("Fairuz", ["Fairuz"]).title).toBe("Fairuz");
  });
});

describe("splitTitleScripts", () => {
  it("sépare les parties arabe et latine", () => {
    expect(splitTitleScripts("Habaytak Bel Saif حبيتك بالصيف")).toEqual({
      titleAr: "حبيتك بالصيف",
      titleLatin: "Habaytak Bel Saif",
    });
    expect(splitTitleScripts("Habaytak - حبيتك")).toEqual({ titleAr: "حبيتك", titleLatin: "Habaytak" });
    expect(splitTitleScripts("سيدي منصور")).toEqual({ titleAr: "سيدي منصور" });
    expect(splitTitleScripts("Sidi Mansour")).toEqual({ titleLatin: "Sidi Mansour" });
  });
});

describe("arabicRatio", () => {
  it("calcule la part de lettres arabes", () => {
    expect(arabicRatio("يا ليل")).toBe(1);
    expect(arabicRatio("ya lil")).toBe(0);
    expect(arabicRatio("يا ya")).toBe(0.5);
    expect(arabicRatio("123 !")).toBe(0);
  });
});
