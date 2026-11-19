import { describe, expect, it } from "vitest";
import {
  LYRICS_MAX_LENGTH,
  LYRICS_MIN_LENGTH,
  normalizeMultiline,
  proposalInputFromFormData,
  TRANSLIT_MAX_LENGTH,
  validateProposal,
  type ProposalInput,
} from "@/lib/contribution/validate";

const LYRICS = `يا ليل طوّل شوية
خلّي الغناية تكمّل

نغنّيو مع بعضنا
والقلب فرحان`;

const valid: ProposalInput = {
  titleAr: "سيدي منصور",
  titleLatin: "Sidi Mansour",
  artists: ["Saber Rebai"],
  lyrics: LYRICS,
  dialect: "tn",
  translit: "",
  rights: true,
};

const errorsOf = (input: Partial<ProposalInput>) => {
  const result = validateProposal({ ...valid, ...input });
  return result.ok ? {} : result.errors;
};

describe("normalizeMultiline", () => {
  it("unifie les fins de ligne et retire les espaces en fin de ligne", () => {
    expect(normalizeMultiline("ligne 1  \r\nligne 2\t\rligne 3")).toBe("ligne 1\nligne 2\nligne 3");
  });

  it("retire les lignes vides au début et à la fin", () => {
    expect(normalizeMultiline("\n\n  \nا\nب\n\n")).toBe("ا\nب");
  });

  it("garde une seule ligne vide entre deux couplets", () => {
    expect(normalizeMultiline("ا\n\n\n\nب")).toBe("ا\n\nب");
  });
});

describe("validateProposal", () => {
  it("accepte une proposition complète et la normalise", () => {
    const result = validateProposal({
      ...valid,
      titleAr: "  سيدي منصور ",
      titleLatin: " ",
      artists: [" Saber Rebai ", "", "  "],
      lyrics: `\n${LYRICS}\r\n\n`,
    });
    expect(result).toEqual({
      ok: true,
      draft: {
        titleAr: "سيدي منصور",
        titleLatin: null,
        artists: ["Saber Rebai"],
        lyrics: LYRICS,
        lyricsTranslit: null,
        dialect: "tn",
      },
    });
  });

  describe("titres", () => {
    it("exige au moins un titre, arabe ou latin", () => {
      expect(errorsOf({ titleAr: " ", titleLatin: "" })).toEqual({ title: { code: "titleMissing" } });
      expect(errorsOf({ titleAr: "", titleLatin: "Sidi Mansour" })).toEqual({});
      expect(errorsOf({ titleAr: "سيدي منصور", titleLatin: "" })).toEqual({});
    });

    it("demande des lettres arabes dans le titre arabe", () => {
      expect(errorsOf({ titleAr: "Sidi Mansour" })).toEqual({ titleAr: { code: "titleArNotArabic" } });
    });

    it("refuse les lettres arabes dans le titre latin", () => {
      expect(errorsOf({ titleLatin: "Sidi منصور" })).toEqual({ titleLatin: { code: "titleLatinHasArabic" } });
    });

    it("limite la longueur des titres", () => {
      expect(errorsOf({ titleLatin: "a".repeat(201) })).toEqual({
        titleLatin: { code: "titleTooLong", values: { max: "200" } },
      });
    });
  });

  describe("artistes", () => {
    it("exige au moins un artiste", () => {
      expect(errorsOf({ artists: ["", " "] })).toEqual({ artists: { code: "artistsMissing" } });
    });

    it("retire les doublons, sans tenir compte de la casse ni des accents", () => {
      const result = validateProposal({ ...valid, artists: ["Saber Rebai", "saber rébai"] });
      expect(result.ok && result.draft.artists).toEqual(["Saber Rebai"]);
    });

    it("limite le nombre d'artistes et la longueur d'un nom", () => {
      expect(errorsOf({ artists: ["A", "B", "C", "D", "E", "F", "G"] })).toEqual({
        artists: { code: "artistsTooMany", values: { max: "6" } },
      });
      expect(errorsOf({ artists: ["a".repeat(121)] })).toEqual({
        artists: { code: "artistTooLong", values: { max: "120" } },
      });
    });
  });

  describe("paroles", () => {
    it("exige les paroles", () => {
      expect(errorsOf({ lyrics: "  \n " })).toEqual({ lyrics: { code: "lyricsMissing" } });
    });

    it(`demande ${LYRICS_MIN_LENGTH} caractères au moins et ${LYRICS_MAX_LENGTH} au plus`, () => {
      expect(errorsOf({ lyrics: "يا ليل" })).toEqual({
        lyrics: { code: "lyricsTooShort", values: { min: "20" } },
      });
      expect(errorsOf({ lyrics: "ي".repeat(LYRICS_MAX_LENGTH + 1) })).toEqual({
        lyrics: { code: "lyricsTooLong", values: { max: "20000" } },
      });
    });

    it("demande des paroles en lettres arabes (le latin va dans la translittération)", () => {
      expect(errorsOf({ lyrics: "ya lil tawel chwaya\nkhalli el ghnaya tkammel" })).toEqual({
        lyrics: { code: "lyricsNotArabic" },
      });
    });
  });

  it("exige un dialecte connu", () => {
    expect(errorsOf({ dialect: "" })).toEqual({ dialect: { code: "dialectMissing" } });
    expect(errorsOf({ dialect: "klingon" })).toEqual({ dialect: { code: "dialectMissing" } });
  });

  describe("translittération facultative", () => {
    it("est alignée ligne à ligne sur les paroles", () => {
      const translit = "ya lil tawel chwaya\nkhalli el ghnaya tkammel\n\nnghanniw m3a ba3dhna\nwel galb farhan";
      const result = validateProposal({ ...valid, translit });
      expect(result.ok && result.draft.lyricsTranslit).toBe(translit);
    });

    it("signale un nombre de lignes différent", () => {
      expect(errorsOf({ translit: "ya lil tawel chwaya\nkhalli el ghnaya tkammel" })).toEqual({
        translit: { code: "translitLines", values: { expected: "5", actual: "2" } },
      });
    });

    it("limite sa longueur", () => {
      expect(errorsOf({ translit: "a".repeat(TRANSLIT_MAX_LENGTH + 1) })).toEqual({
        translit: { code: "translitTooLong", values: { max: "30000" } },
      });
    });

    it("s'écrit en lettres latines", () => {
      expect(errorsOf({ translit: "يا ليل\nخلّي\n\nنغنّيو\nوالقلب" })).toEqual({
        translit: { code: "translitHasArabic" },
      });
    });
  });

  it("exige la déclaration des droits", () => {
    expect(errorsOf({ rights: false })).toEqual({ rights: { code: "rightsMissing" } });
  });

  it("signale toutes les erreurs d'un coup", () => {
    expect(
      Object.keys(errorsOf({ titleAr: "", titleLatin: "", artists: [], lyrics: "", dialect: "", rights: false })),
    ).toEqual(["title", "artists", "lyrics", "dialect", "rights"]);
  });
});

describe("proposalInputFromFormData", () => {
  it("lit les champs du formulaire, artistes multiples compris", () => {
    const data = new FormData();
    data.set("titleAr", "سيدي منصور");
    data.set("titleLatin", "Sidi Mansour");
    data.append("artist", "Saber Rebai");
    data.append("artist", "Lotfi Bouchnak");
    data.set("lyrics", LYRICS);
    data.set("dialect", "tn");
    data.set("translit", "");
    data.set("rights", "on");
    expect(proposalInputFromFormData(data)).toEqual({
      titleAr: "سيدي منصور",
      titleLatin: "Sidi Mansour",
      artists: ["Saber Rebai", "Lotfi Bouchnak"],
      lyrics: LYRICS,
      dialect: "tn",
      translit: "",
      rights: true,
    });
  });

  it("remplace les champs absents par des valeurs vides", () => {
    expect(proposalInputFromFormData(new FormData())).toEqual({
      titleAr: "",
      titleLatin: "",
      artists: [],
      lyrics: "",
      dialect: "",
      translit: "",
      rights: false,
    });
  });
});
