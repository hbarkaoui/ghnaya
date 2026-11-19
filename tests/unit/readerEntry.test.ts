import { describe, expect, it } from "vitest";
import { toReaderEntry } from "@/lib/reader/entry";
import type { Song } from "@/types/catalog";

const SONG: Song = {
  id: "s-ya-lella",
  titleAr: "يا لالة",
  titleLatin: "Ya Lella",
  lyrics: "يا لالة غنّيلي",
  lyricsTranslit: "ya lella ghannili",
  translitStatus: "auto",
  dialect: "tn",
  source: "lrclib",
  artists: [{ id: "a-jouini", nameAr: "الهادي الجويني", nameLatin: "Hedi Jouini", role: "main" }],
};

describe("toReaderEntry", () => {
  it("ne garde de la chanson que ce dont le lecteur a besoin", () => {
    expect(toReaderEntry(SONG, 6, "Les voix de femmes commencent.")).toEqual({
      position: 6,
      note: "Les voix de femmes commencent.",
      song: {
        id: "s-ya-lella",
        titleAr: "يا لالة",
        titleLatin: "Ya Lella",
        lyrics: "يا لالة غنّيلي",
        lyricsTranslit: "ya lella ghannili",
        translitStatus: "auto",
        artists: SONG.artists,
      },
    });
  });

  it("donne une chanson seule en position 1, sans note", () => {
    const entry = toReaderEntry(SONG);
    expect(entry.position).toBe(1);
    expect(entry.note).toBeNull();
  });
});
