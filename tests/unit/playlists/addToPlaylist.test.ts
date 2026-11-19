import { describe, expect, it } from "vitest";
import {
  PLAYLIST_NAME_MAX_LENGTH,
  appendSong,
  canEditPlaylist,
  editablePlaylists,
  parsePlaylistName,
  toAddTarget,
} from "@/lib/playlists/addToPlaylist";
import type { Playlist } from "@/types/catalog";

const JASMINS = { slug: "les-jasmins", name: "Les Jasmins" };
const SFAX = { slug: "malouf-sfax", name: "Malouf Sfax" };

const playlist = (id: string, club: Playlist["club"], songIds: string[], updatedAt: string): Playlist => ({
  id,
  name: id,
  club,
  items: songIds.map((songId, i) => ({ position: i + 1, songId, note: null })),
  updatedAt,
});

const leila = { id: "u-leila", isAnimator: false, clubSlugs: ["les-jasmins"] };
const sami = { id: "u-sami", isAnimator: true, clubSlugs: ["les-jasmins", "malouf-sfax"] };

const seance = playlist("seance", JASMINS, ["s-1", "s-2"], "2026-11-18T19:30:00Z");
const repetition = playlist("repetition", SFAX, ["s-3"], "2026-11-16T18:00:00Z");
const bardo = playlist("bardo", { slug: "chorale-du-bardo", name: "Chorale du Bardo" }, [], "2026-11-19T08:00:00Z");
const preferees = playlist("preferees", null, ["s-2"], "2026-11-17T21:10:00Z");
const apprendre = playlist("apprendre", null, [], "2026-11-05T09:00:00Z");
const deSami = playlist("de-sami", null, [], "2026-11-19T10:00:00Z");

const owners: Record<string, string> = { preferees: "u-leila", apprendre: "u-leila", "de-sami": "u-sami" };
const ownerOf = (p: Playlist) => (p.club ? null : (owners[p.id] ?? null));

describe("canEditPlaylist (règle des clubs)", () => {
  it("le propriétaire modifie sa playlist personnelle, personne d'autre", () => {
    expect(canEditPlaylist(leila, preferees, "u-leila")).toBe(true);
    expect(canEditPlaylist(sami, preferees, "u-leila")).toBe(false);
  });

  it("un membre ne modifie pas les playlists de son club", () => {
    expect(canEditPlaylist(leila, seance, null)).toBe(false);
  });

  it("l'animateur modifie les playlists des clubs qu'il anime, et seulement celles-là", () => {
    expect(canEditPlaylist(sami, seance, null)).toBe(true);
    expect(canEditPlaylist(sami, repetition, null)).toBe(true);
    expect(canEditPlaylist(sami, bardo, null)).toBe(false);
  });
});

describe("editablePlaylists", () => {
  const all = [seance, repetition, bardo, preferees, apprendre, deSami];

  it("liste les playlists personnelles d'un membre, sans celles de son club", () => {
    expect(editablePlaylists(leila, all, ownerOf).map((p) => p.id)).toEqual(["preferees", "apprendre"]);
  });

  it("liste celles d'un animateur, de la plus récemment modifiée à la plus ancienne", () => {
    expect(editablePlaylists(sami, all, ownerOf).map((p) => p.id)).toEqual(["de-sami", "seance", "repetition"]);
  });

  it("ne modifie pas la liste reçue", () => {
    const copy = [...all];
    editablePlaylists(sami, all, ownerOf);
    expect(all).toEqual(copy);
  });
});

describe("appendSong", () => {
  const now = "2026-11-19T12:00:00.000Z";

  it("ajoute la chanson en dernière position, sans note, et date la modification", () => {
    const result = appendSong(seance, "s-9", now);
    expect(result.status).toBe("added");
    if (result.status !== "added") return;
    expect(result.playlist.items.at(-1)).toEqual({ position: 3, songId: "s-9", note: null });
    expect(result.playlist.items).toHaveLength(3);
    expect(result.playlist.updatedAt).toBe(now);
  });

  it("ne modifie pas la playlist d'origine", () => {
    appendSong(seance, "s-9", now);
    expect(seance.items).toHaveLength(2);
    expect(seance.updatedAt).toBe("2026-11-18T19:30:00Z");
  });

  it("refuse un doublon : la chanson est déjà dans la playlist", () => {
    expect(appendSong(seance, "s-2", now)).toEqual({ status: "duplicate" });
  });

  it("ajoute en position 1 dans une playlist vide", () => {
    const result = appendSong(apprendre, "s-1", now);
    expect(result.status === "added" && result.playlist.items).toEqual([{ position: 1, songId: "s-1", note: null }]);
  });
});

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
