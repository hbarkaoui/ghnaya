import { describe, expect, it } from "vitest";
import { searchCatalog } from "@/mocks/search";
import { createSongStore } from "@/mocks/songStore";
import type { Song } from "@/types/catalog";

const song = (id: string, titleLatin: string): Song => ({
  id,
  titleAr: null,
  titleLatin,
  lyrics: "سطر",
  lyricsTranslit: null,
  translitStatus: "none",
  dialect: "tn",
  source: "lrclib",
  artists: [],
});

const setup = () => {
  const songs = [song("s-zina", "Zina"), song("s-ommi", "Ommi Tounes")];
  const removed: Pick<Song, "id" | "titleAr" | "titleLatin" | "artists">[] = [];
  return { songs, removed, store: createSongStore(songs, removed) };
};

describe("effets de la modération sur le catalogue en mémoire", () => {
  it("publie une chanson nouvelle", () => {
    const { songs, store } = setup();
    store.publish(song("s-nouvelle", "Lamma Bada"));
    expect(songs.map((s) => s.id)).toEqual(["s-zina", "s-ommi", "s-nouvelle"]);
  });

  it("remplace une chanson corrigée à sa place, et la recherche voit la correction", () => {
    const { songs, store } = setup();
    expect(searchCatalog(songs, "zina").total).toBe(1);
    store.publish(song("s-zina", "Zinet el Banet"));
    expect(songs.map((s) => s.titleLatin)).toEqual(["Zinet el Banet", "Ommi Tounes"]);
    expect(searchCatalog(songs, "banet").items.map((s) => s.id)).toEqual(["s-zina"]);
  });

  it("retire une chanson (retrait doux) : elle quitte le catalogue et la recherche, et reste connue comme retirée", () => {
    const { songs, removed, store } = setup();
    expect(searchCatalog(songs, "zina").total).toBe(1);
    expect(store.remove("s-zina")).toBe(true);
    expect(songs.map((s) => s.id)).toEqual(["s-ommi"]);
    expect(removed.map((s) => s.id)).toEqual(["s-zina"]);
    expect(searchCatalog(songs, "zina").total).toBe(0);
  });

  it("ne retire pas une chanson inconnue ou déjà retirée", () => {
    const { store } = setup();
    expect(store.remove("s-inconnue")).toBe(false);
    store.remove("s-zina");
    expect(store.remove("s-zina")).toBe(false);
  });
});
