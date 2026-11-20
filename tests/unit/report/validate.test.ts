import { describe, expect, it } from "vitest";
import {
  DETAILS_MAX_LENGTH,
  DETAILS_MIN_LENGTH,
  isReportReason,
  reportInputFromFormData,
  validateReport,
  type ReportInput,
} from "@/lib/report/validate";

const valid: ReportInput = {
  reason: "wrong_lyrics",
  details: "Les deux derniers vers du premier couplet sont inversés.",
  email: "",
};

const AS_VISITOR = { emailRequired: true } as const;
const AS_MEMBER = { emailRequired: false } as const;

const errorsOf = (input: Partial<ReportInput>, options: { emailRequired: boolean } = AS_MEMBER) => {
  const result = validateReport({ ...valid, ...input }, options);
  return result.ok ? {} : result.errors;
};

describe("isReportReason", () => {
  it("accepte les cinq motifs de la spec", () => {
    for (const reason of ["copyright", "wrong_lyrics", "duplicate", "spam", "other"]) {
      expect(isReportReason(reason)).toBe(true);
    }
  });

  it("refuse une valeur inconnue ou vide", () => {
    expect(isReportReason("")).toBe(false);
    expect(isReportReason("droits")).toBe(false);
    expect(isReportReason("toString")).toBe(false);
  });
});

describe("validateReport : membre connecté", () => {
  it("accepte un signalement complet, sans e-mail", () => {
    expect(validateReport(valid, AS_MEMBER)).toEqual({
      ok: true,
      report: { reason: "wrong_lyrics", details: valid.details, contactEmail: null },
    });
  });

  it("ignore une adresse envoyée quand même : le compte suffit", () => {
    const result = validateReport({ ...valid, email: "pas une adresse" }, AS_MEMBER);
    expect(result).toMatchObject({ ok: true, report: { contactEmail: null } });
  });
});

describe("validateReport : motif", () => {
  it("exige un motif", () => {
    expect(errorsOf({ reason: "" })).toEqual({ reason: { code: "reasonMissing" } });
  });

  it("refuse un motif inconnu comme un motif absent", () => {
    expect(errorsOf({ reason: "piratage" })).toEqual({ reason: { code: "reasonMissing" } });
  });
});

describe("validateReport : détails", () => {
  it("exige des détails", () => {
    expect(errorsOf({ details: "  \n " })).toEqual({ details: { code: "detailsMissing" } });
  });

  it(`refuse moins de ${DETAILS_MIN_LENGTH} caractères, espaces autour retirés`, () => {
    expect(errorsOf({ details: `  ${"a".repeat(DETAILS_MIN_LENGTH - 1)}  ` })).toEqual({
      details: { code: "detailsTooShort", values: { min: String(DETAILS_MIN_LENGTH) } },
    });
    expect(errorsOf({ details: "a".repeat(DETAILS_MIN_LENGTH) })).toEqual({});
  });

  it(`refuse plus de ${DETAILS_MAX_LENGTH} caractères`, () => {
    expect(errorsOf({ details: "a".repeat(DETAILS_MAX_LENGTH + 1) })).toEqual({
      details: { code: "detailsTooLong", values: { max: String(DETAILS_MAX_LENGTH) } },
    });
    expect(errorsOf({ details: "a".repeat(DETAILS_MAX_LENGTH) })).toEqual({});
  });

  it("normalise les détails : fins de ligne, espaces de fin, lignes vides en trop", () => {
    const result = validateReport({ ...valid, details: "\n  Premier vers faux.  \r\n\r\n\r\n\r\nDeuxième aussi.\n\n" }, AS_MEMBER);
    expect(result).toMatchObject({ ok: true, report: { details: "Premier vers faux.\n\nDeuxième aussi." } });
  });

  it("accepte des détails en arabe", () => {
    expect(errorsOf({ details: "البيت الثاني من المقطع الأول غير صحيح." })).toEqual({});
  });
});

describe("validateReport : visiteur", () => {
  it("exige une adresse e-mail", () => {
    expect(errorsOf({ email: " " }, AS_VISITOR)).toEqual({ email: { code: "emailMissing" } });
  });

  it("refuse une adresse mal formée", () => {
    expect(errorsOf({ email: "droits@editions" }, AS_VISITOR)).toEqual({ email: { code: "emailInvalid" } });
  });

  it("garde l'adresse normalisée comme contact", () => {
    const result = validateReport({ ...valid, reason: "copyright", email: "  Droits@Exemple-Editions.com " }, AS_VISITOR);
    expect(result).toEqual({
      ok: true,
      report: { reason: "copyright", details: valid.details, contactEmail: "droits@exemple-editions.com" },
    });
  });
});

describe("validateReport : plusieurs erreurs", () => {
  it("signale chaque champ fautif en une fois", () => {
    expect(errorsOf({ reason: "", details: "", email: "" }, AS_VISITOR)).toEqual({
      reason: { code: "reasonMissing" },
      details: { code: "detailsMissing" },
      email: { code: "emailMissing" },
    });
  });
});

describe("reportInputFromFormData", () => {
  it("lit le motif, les détails et l'adresse", () => {
    const data = new FormData();
    data.set("reason", "spam");
    data.set("details", "Publicité pour un site de paris.");
    data.set("email", "nour@example.com");
    expect(reportInputFromFormData(data)).toEqual({
      reason: "spam",
      details: "Publicité pour un site de paris.",
      email: "nour@example.com",
    });
  });

  it("remplace un champ absent par une chaîne vide (membre : pas de champ e-mail)", () => {
    expect(reportInputFromFormData(new FormData())).toEqual({ reason: "", details: "", email: "" });
  });

  it("ignore un fichier envoyé à la place d'un texte", () => {
    const data = new FormData();
    data.set("details", new Blob(["x"]), "x.txt");
    expect(reportInputFromFormData(data).details).toBe("");
  });
});
