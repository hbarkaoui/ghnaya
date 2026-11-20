import { describe, expect, it } from "vitest";
import { sheetBackdropOpacity, sheetDragOffset, shouldCloseSheet } from "@/lib/motion/sheetDrag";

describe("sheetDragOffset", () => {
  it("suit le doigt vers le bas", () => {
    expect(sheetDragOffset(300, 380)).toBe(80);
  });

  it("ne monte pas au-dessus de sa position ouverte (pas de rebond)", () => {
    expect(sheetDragOffset(300, 250)).toBe(0);
  });
});

describe("shouldCloseSheet", () => {
  it("ferme une grande feuille glissée de plus de 96 px", () => {
    expect(shouldCloseSheet({ dy: 97, elapsedMs: 1000, height: 600 })).toBe(true);
  });

  it("garde ouverte une grande feuille glissée lentement de 96 px ou moins", () => {
    expect(shouldCloseSheet({ dy: 96, elapsedMs: 1000, height: 600 })).toBe(false);
  });

  it("ferme une petite feuille glissée de plus du quart de sa hauteur", () => {
    expect(shouldCloseSheet({ dy: 51, elapsedMs: 1000, height: 200 })).toBe(true);
    expect(shouldCloseSheet({ dy: 49, elapsedMs: 1000, height: 200 })).toBe(false);
  });

  it("ferme sur un geste rapide, même court", () => {
    expect(shouldCloseSheet({ dy: 30, elapsedMs: 40, height: 600 })).toBe(true);
  });

  it("ignore un geste rapide trop court pour être voulu", () => {
    expect(shouldCloseSheet({ dy: 20, elapsedMs: 10, height: 600 })).toBe(false);
  });

  it("garde ouverte une feuille glissée court et lentement", () => {
    expect(shouldCloseSheet({ dy: 30, elapsedMs: 100, height: 600 })).toBe(false);
  });

  it("ne divise pas par zéro quand le geste est instantané", () => {
    expect(shouldCloseSheet({ dy: 30, elapsedMs: 0, height: 600 })).toBe(true);
  });
});

describe("sheetBackdropOpacity", () => {
  it("garde le fond opaque tant que la feuille n'a pas bougé", () => {
    expect(sheetBackdropOpacity(0, 400)).toBe(1);
  });

  it("estompe le fond à mesure que la feuille descend", () => {
    expect(sheetBackdropOpacity(100, 400)).toBe(0.75);
  });

  it("efface le fond quand la feuille est sortie de l'écran", () => {
    expect(sheetBackdropOpacity(500, 400)).toBe(0);
  });

  it("garde le fond opaque si la hauteur est inconnue", () => {
    expect(sheetBackdropOpacity(50, 0)).toBe(1);
  });
});
