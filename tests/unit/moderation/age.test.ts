import { describe, expect, it } from "vitest";
import { ageOf, formatAge, formatProposalDate } from "@/lib/moderation/age";

const NOW = new Date("2026-11-19T12:00:00Z");

describe("ageOf : l'ancienneté d'un élément de la file", () => {
  it("compte en minutes la première heure, au moins 1", () => {
    expect(ageOf("2026-11-19T11:59:50Z", NOW)).toEqual({ value: 1, unit: "minute" });
    expect(ageOf("2026-11-19T11:15:00Z", NOW)).toEqual({ value: 45, unit: "minute" });
  });

  it("compte en heures le premier jour", () => {
    expect(ageOf("2026-11-19T09:00:00Z", NOW)).toEqual({ value: 3, unit: "hour" });
    expect(ageOf("2026-11-18T12:30:00Z", NOW)).toEqual({ value: 23, unit: "hour" });
  });

  it("compte en jours jusqu'à deux semaines", () => {
    expect(ageOf("2026-11-18T12:00:00Z", NOW)).toEqual({ value: 1, unit: "day" });
    expect(ageOf("2026-11-06T12:00:00Z", NOW)).toEqual({ value: 13, unit: "day" });
  });

  it("compte en semaines au-delà, puis en mois après huit semaines", () => {
    expect(ageOf("2026-11-05T12:00:00Z", NOW)).toEqual({ value: 2, unit: "week" });
    expect(ageOf("2026-09-01T12:00:00Z", NOW)).toEqual({ value: 2, unit: "month" });
  });

  it("ne donne jamais une ancienneté négative (horloges décalées)", () => {
    expect(ageOf("2026-11-19T12:05:00Z", NOW)).toEqual({ value: 1, unit: "minute" });
  });
});

describe("formatAge", () => {
  it("écrit l'ancienneté en français, avec une espace insécable entre le nombre et son mot", () => {
    expect(formatAge("2026-11-16T12:00:00Z", NOW, "fr")).toBe("il y a 3 jours");
  });

  it("écrit l'ancienneté en arabe, en chiffres occidentaux", () => {
    const text = formatAge("2026-11-16T12:00:00Z", NOW, "ar");
    expect(text).toMatch(/3/);
    expect(text).not.toMatch(/[٠-٩]/);
    expect(text).toMatch(/[؀-ۿ]/);
  });
});

describe("formatProposalDate", () => {
  it("écrit la date dans la langue de l'interface, en chiffres occidentaux", () => {
    expect(formatProposalDate("2026-11-18T10:00:00Z", "fr")).toBe("18 novembre 2026");
    expect(formatProposalDate("2026-11-18T10:00:00Z", "ar")).toMatch(/^18 .+ 2026$/);
  });
});
