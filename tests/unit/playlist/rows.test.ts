import { describe, expect, it } from "vitest";
import { copyPlaylist, readablePositions } from "@/lib/playlist/rows";

describe("readablePositions : numéros du lecteur", () => {
  const isReadable = (songId: string) => songId !== "retiree";

  it("numérote les chansons lisibles à partir de 1, dans l'ordre des positions", () => {
    const items = [
      { position: 2, songId: "b" },
      { position: 1, songId: "a" },
    ];
    expect(readablePositions(items, isReadable)).toEqual(new Map([["a", 1], ["b", 2]]));
  });

  it("saute une chanson retirée : elle n'a pas de numéro, la suivante prend sa place", () => {
    const items = [
      { position: 1, songId: "a" },
      { position: 2, songId: "retiree" },
      { position: 3, songId: "c" },
    ];
    const numbers = readablePositions(items, isReadable);
    expect(numbers.get("retiree")).toBeUndefined();
    expect(numbers.get("c")).toBe(2);
    expect(numbers.size).toBe(2);
  });

  it("une playlist vide n'a aucun numéro", () => {
    expect(readablePositions([], isReadable).size).toBe(0);
  });
});

describe("copyPlaylist : copie personnelle d'une playlist de club", () => {
  const source = {
    id: "seance-du-jeudi",
    name: "Séance du jeudi",
    club: { slug: "les-jasmins", name: "Les Jasmins" },
    ownerId: null,
    items: [{ position: 1, songId: "a", note: "tonalité Ré" }],
    updatedAt: "2026-11-18T19:30:00Z",
  };

  it("crée une playlist personnelle, avec le même nom, les mêmes chansons et les mêmes notes", () => {
    const copy = copyPlaylist(source, { id: "copie-1", ownerId: "u-leila", now: "2026-11-19T10:00:00Z" });
    expect(copy).toEqual({
      id: "copie-1",
      name: "Séance du jeudi",
      club: null,
      ownerId: "u-leila",
      items: [{ position: 1, songId: "a", note: "tonalité Ré" }],
      updatedAt: "2026-11-19T10:00:00Z",
    });
  });

  it("ne partage pas ses chansons avec l'original", () => {
    const copy = copyPlaylist(source, { id: "copie-1", ownerId: "u-leila", now: "2026-11-19T10:00:00Z" });
    copy.items[0].note = null;
    expect(source.items[0].note).toBe("tonalité Ré");
  });
});
