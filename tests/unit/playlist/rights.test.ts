import { describe, expect, it } from "vitest";
import { canCopyPlaylist, canEditPlaylist, canViewPlaylist } from "@/lib/playlist/rights";

const LEILA = { id: "u-leila", isAnimator: false, clubSlugs: ["les-jasmins"] };
const SAMI = { id: "u-sami", isAnimator: true, clubSlugs: ["les-jasmins", "malouf-sfax"] };
const NO_CLUB = { id: "u-leila", isAnimator: false, clubSlugs: [] };

const clubPlaylist = (slug: string) => ({ club: { slug, name: slug }, ownerId: null });
const personal = (ownerId: string) => ({ club: null, ownerId });

describe("voir une playlist", () => {
  it("un membre voit les playlists de son club, pas celles d'un autre club", () => {
    expect(canViewPlaylist(LEILA, clubPlaylist("les-jasmins"))).toBe(true);
    expect(canViewPlaylist(LEILA, clubPlaylist("malouf-sfax"))).toBe(false);
  });

  it("chacun voit ses playlists personnelles, pas celles des autres", () => {
    expect(canViewPlaylist(LEILA, personal("u-leila"))).toBe(true);
    expect(canViewPlaylist(SAMI, personal("u-leila"))).toBe(false);
  });

  it("un membre sans club ne voit aucune playlist de club", () => {
    expect(canViewPlaylist(NO_CLUB, clubPlaylist("les-jasmins"))).toBe(false);
  });

  it("un visiteur ne voit aucune playlist", () => {
    expect(canViewPlaylist(null, clubPlaylist("les-jasmins"))).toBe(false);
    expect(canViewPlaylist(null, personal("u-leila"))).toBe(false);
  });
});

describe("modifier une playlist", () => {
  it("un membre ne modifie pas les playlists de son club", () => {
    expect(canEditPlaylist(LEILA, clubPlaylist("les-jasmins"))).toBe(false);
  });

  it("un animateur modifie les playlists de ses clubs, et seulement les siens", () => {
    expect(canEditPlaylist(SAMI, clubPlaylist("les-jasmins"))).toBe(true);
    expect(canEditPlaylist(SAMI, clubPlaylist("malouf-sfax"))).toBe(true);
    expect(canEditPlaylist(SAMI, clubPlaylist("chorale-du-bardo"))).toBe(false);
  });

  it("chacun modifie ses playlists personnelles, pas celles des autres", () => {
    expect(canEditPlaylist(LEILA, personal("u-leila"))).toBe(true);
    expect(canEditPlaylist(SAMI, personal("u-leila"))).toBe(false);
  });

  it("un visiteur ne modifie rien", () => {
    expect(canEditPlaylist(null, personal("u-leila"))).toBe(false);
  });
});

describe("copier une playlist dans ses playlists", () => {
  it("un membre peut copier une playlist de son club", () => {
    expect(canCopyPlaylist(LEILA, clubPlaylist("les-jasmins"))).toBe(true);
  });

  it("pas une playlist d'un autre club, ni une playlist personnelle", () => {
    expect(canCopyPlaylist(LEILA, clubPlaylist("malouf-sfax"))).toBe(false);
    expect(canCopyPlaylist(LEILA, personal("u-leila"))).toBe(false);
  });

  it("l'animateur, qui modifie la playlist, n'a pas besoin de la copier", () => {
    expect(canCopyPlaylist(SAMI, clubPlaylist("les-jasmins"))).toBe(false);
  });

  it("un visiteur ne copie rien", () => {
    expect(canCopyPlaylist(null, clubPlaylist("les-jasmins"))).toBe(false);
  });
});
