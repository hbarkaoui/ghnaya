import { describe, expect, it } from "vitest";
import {
  PLAYLIST_NAME_MAX_LENGTH,
  parsePlaylistName,
  toAddTarget,
} from "@/lib/playlist/addToPlaylist";
import type { Playlist } from "@/types/catalog";

const JASMINS = { slug: "les-jasmins", name: "Les Jasmins" };

const playlist = (
  id: string,
  club: Playlist["club"],
  songIds: string[],
  updatedAt: string,
  ownerId: string | null = null,
): Playlist => ({
  id,
  name: id,
  club,
  ownerId,
  items: songIds.map((songId, i) => ({ position: i + 1, songId, note: null })),
  updatedAt,
});


const seance = playlist("seance", JASMINS, ["s-1", "s-2"], "2026-11-18T19:30:00Z");

describe("parsePlaylistName", () => {
  it("retire les espaces au début et à la fin, et réduit les espaces répétés", () => {
    expect(parsePlaylistName("  Séance   du jeudi ")).toEqual({ ok: true, name: "Séance du jeudi" });
  });

  it("accepte un nom en arabe", () => {
    expect(parsePlaylistName("جلسة الخميس")).toEqual({ ok: true, name: "جلسة الخميس" });
  });

  it("refuse un nom vide ou fait d'espaces", () => {
    expect(parsePlaylistName("")).toEqual({ ok: false, error: "empty" });
    expect(parsePlaylistName("   ")).toEqual({ ok: false, error: "empty" });
  });

  it("refuse une valeur qui n'est pas du texte (action serveur appelée directement)", () => {
    expect(parsePlaylistName(undefined)).toEqual({ ok: false, error: "empty" });
    expect(parsePlaylistName(42)).toEqual({ ok: false, error: "empty" });
  });

  it(`limite le nom à ${PLAYLIST_NAME_MAX_LENGTH} caractères`, () => {
    expect(parsePlaylistName("a".repeat(PLAYLIST_NAME_MAX_LENGTH)).ok).toBe(true);
    expect(parsePlaylistName("a".repeat(PLAYLIST_NAME_MAX_LENGTH + 1))).toEqual({ ok: false, error: "tooLong" });
  });

  it("compte les caractères et non les unités UTF-16 (emoji)", () => {
    expect(parsePlaylistName("🎵".repeat(PLAYLIST_NAME_MAX_LENGTH)).ok).toBe(true);
  });
});

describe("toAddTarget", () => {
  it("garde ce dont la feuille a besoin : nom, club, chansons et date", () => {
    expect(toAddTarget(seance)).toEqual({
      id: "seance",
      name: "seance",
      club: JASMINS,
      songIds: ["s-1", "s-2"],
      updatedAt: "2026-11-18T19:30:00Z",
    });
  });
});
