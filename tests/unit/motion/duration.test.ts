import { describe, expect, it } from "vitest";
import { parseCssDuration } from "@/lib/motion/duration";

describe("parseCssDuration", () => {
  it("lit une durée en millisecondes", () => {
    expect(parseCssDuration("250ms")).toBe(250);
  });

  it("convertit une durée en secondes", () => {
    expect(parseCssDuration("0.25s")).toBe(250);
    expect(parseCssDuration(".15s")).toBe(150);
  });

  it("ignore les espaces que getComputedStyle laisse autour d'une variable", () => {
    expect(parseCssDuration(" 150ms ")).toBe(150);
  });

  it("lit zéro, valeur des tokens quand le mouvement est réduit", () => {
    expect(parseCssDuration("0ms")).toBe(0);
    expect(parseCssDuration("0s")).toBe(0);
    expect(parseCssDuration("0")).toBe(0);
  });

  it("renvoie null pour une valeur absente ou invalide", () => {
    expect(parseCssDuration("")).toBeNull();
    expect(parseCssDuration("rapide")).toBeNull();
    expect(parseCssDuration("250")).toBeNull();
    expect(parseCssDuration("-10ms")).toBeNull();
  });
});
