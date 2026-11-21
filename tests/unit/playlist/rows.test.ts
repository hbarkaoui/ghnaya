import { describe, expect, it } from "vitest";
import { readablePositions } from "@/lib/playlist/rows";

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
