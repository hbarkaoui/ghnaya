import { describe, expect, it } from "vitest";
import {
  NAME_MAX_LENGTH,
  NOTE_MAX_LENGTH,
  insertItem,
  moveItem,
  normalizeNote,
  normalizePlaylistName,
  removeItem,
  setItemNote,
} from "@/lib/playlist/edit";

const item = (position: number, songId: string, note: string | null = null) => ({ position, songId, note });
const ITEMS = [item(1, "a", "tonalité Ré"), item(2, "b"), item(3, "c")];
const order = (items: { songId: string }[]) => items.map((i) => i.songId);
const positions = (items: { position: number }[]) => items.map((i) => i.position);

describe("moveItem : ↑ / ↓ dans une playlist", () => {
  it("monte une chanson d'un cran et renumérote à partir de 1", () => {
    const moved = moveItem(ITEMS, "b", "up");
    expect(order(moved)).toEqual(["b", "a", "c"]);
    expect(positions(moved)).toEqual([1, 2, 3]);
  });

  it("descend une chanson d'un cran", () => {
    expect(order(moveItem(ITEMS, "a", "down"))).toEqual(["b", "a", "c"]);
  });

  it("garde la note avec sa chanson", () => {
    expect(moveItem(ITEMS, "a", "down").find((i) => i.songId === "a")?.note).toBe("tonalité Ré");
  });

  it("ne bouge pas la première vers le haut ni la dernière vers le bas", () => {
    expect(order(moveItem(ITEMS, "a", "up"))).toEqual(["a", "b", "c"]);
    expect(order(moveItem(ITEMS, "c", "down"))).toEqual(["a", "b", "c"]);
  });

  it("ignore une chanson absente (demande périmée)", () => {
    expect(moveItem(ITEMS, "z", "up")).toEqual(ITEMS);
  });

  it("suit l'ordre des positions même si le tableau est dans le désordre", () => {
    const shuffled = [item(2, "b"), item(1, "a"), item(3, "c")];
    expect(order(moveItem(shuffled, "c", "up"))).toEqual(["a", "c", "b"]);
  });

  it("ne modifie pas le tableau reçu", () => {
    const copy = structuredClone(ITEMS);
    moveItem(ITEMS, "b", "up");
    expect(ITEMS).toEqual(copy);
  });
});

describe("removeItem : retrait d'une chanson", () => {
  it("retire la chanson et renumérote", () => {
    const left = removeItem(ITEMS, "a");
    expect(order(left)).toEqual(["b", "c"]);
    expect(positions(left)).toEqual([1, 2]);
  });

  it("ignore une chanson absente", () => {
    expect(removeItem(ITEMS, "z")).toEqual(ITEMS);
  });
});

describe("insertItem : annuler un retrait", () => {
  it("remet la chanson à sa position, avec sa note", () => {
    const restored = insertItem(removeItem(ITEMS, "a"), item(1, "a", "tonalité Ré"));
    expect(restored).toEqual(ITEMS);
  });

  it("place la chanson en fin de liste si sa position dépasse", () => {
    expect(order(insertItem([item(1, "b")], item(5, "a")))).toEqual(["b", "a"]);
  });

  it("ne crée jamais de doublon", () => {
    expect(insertItem(ITEMS, item(1, "c"))).toEqual(ITEMS);
  });
});

describe("notes de l'animateur", () => {
  it("normalizeNote retire les espaces autour, et une note vide devient null", () => {
    expect(normalizeNote("  tonalité Ré  ")).toBe("tonalité Ré");
    expect(normalizeNote("   ")).toBeNull();
    expect(normalizeNote("")).toBeNull();
  });

  it("normalizeNote ramène une note sur une ligne et la limite en longueur", () => {
    expect(normalizeNote("ligne 1\nligne 2")).toBe("ligne 1 ligne 2");
    expect(normalizeNote("x".repeat(NOTE_MAX_LENGTH + 20))).toHaveLength(NOTE_MAX_LENGTH);
  });

  it("setItemNote change seulement la note de la chanson visée", () => {
    const noted = setItemNote(ITEMS, "b", " seulement le 2e couplet ");
    expect(noted.map((i) => i.note)).toEqual(["tonalité Ré", "seulement le 2e couplet", null]);
  });

  it("setItemNote efface la note avec un texte vide", () => {
    expect(setItemNote(ITEMS, "a", "  ")[0].note).toBeNull();
  });
});

describe("normalizePlaylistName : renommage", () => {
  it("retire les espaces superflus", () => {
    expect(normalizePlaylistName("  Séance   du jeudi ")).toBe("Séance du jeudi");
  });

  it("refuse un nom vide", () => {
    expect(normalizePlaylistName("   ")).toBeNull();
  });

  it("limite la longueur", () => {
    expect(normalizePlaylistName("a".repeat(NAME_MAX_LENGTH + 5))).toHaveLength(NAME_MAX_LENGTH);
  });
});
