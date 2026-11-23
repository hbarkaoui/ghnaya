import { describe, expect, it } from "vitest";
import {
  canApproveRevision,
  canContribute,
  canCopyPlaylist,
  canCreateClub,
  canEditPlaylist,
  canManageClub,
  canModerate,
  canViewPlaylist,
  clubRoleOf,
  clubsAnimatedBy,
} from "@/lib/auth/permissions";
import { userWith } from "./support";

describe("permissions de base", () => {
  it("seuls les modérateurs et les admins modèrent", () => {
    expect(canModerate(null)).toBe(false);
    expect(canModerate(userWith())).toBe(false);
    expect(canModerate(userWith({ globalRole: "moderator" }))).toBe(true);
    expect(canModerate(userWith({ globalRole: "admin" }))).toBe(true);
  });

  it("seuls les animateurs créent un club", () => {
    expect(canCreateClub(null)).toBe(false);
    expect(canCreateClub(userWith())).toBe(false);
    expect(canCreateClub(userWith({ globalRole: "admin" }))).toBe(false);
    expect(canCreateClub(userWith({ isAnimator: true }))).toBe(true);
  });
});

describe("permissions de club", () => {
  const sami = userWith({
    isAnimator: true,
    clubs: [
      { slug: "les-jasmins", name: "Les Jasmins", role: "animator" },
      { slug: "malouf-sfax", name: "Malouf Sfax", role: "member" },
    ],
  });

  it("lit le rôle dans le club, et rien pour un club dont on n'est pas membre", () => {
    expect(clubRoleOf(sami, "les-jasmins")).toBe("animator");
    expect(clubRoleOf(sami, "malouf-sfax")).toBe("member");
    expect(clubRoleOf(sami, "nghanniw")).toBeNull();
    expect(clubRoleOf(null, "les-jasmins")).toBeNull();
  });

  it("gère seulement les clubs qu'on anime, même avec le rôle global d'animateur", () => {
    expect(canManageClub(sami, "les-jasmins")).toBe(true);
    expect(canManageClub(sami, "malouf-sfax")).toBe(false);
  });

  it("un membre promu animateur de son club le gère, sans le rôle global", () => {
    const leila = userWith({ clubs: [{ slug: "les-jasmins", name: "Les Jasmins", role: "animator" }] });
    expect(canManageClub(leila, "les-jasmins")).toBe(true);
  });

  it("liste les clubs animés, pour y créer une playlist", () => {
    expect(clubsAnimatedBy(sami)).toEqual([{ slug: "les-jasmins", name: "Les Jasmins" }]);
    expect(clubsAnimatedBy(null)).toEqual([]);
  });
});

// Droits sur les playlists (repris de l'ancien rights.test.ts)
const member = (slug: string) => ({ slug, name: slug, role: "member" as const });
const animator = (slug: string) => ({ slug, name: slug, role: "animator" as const });
const LEILA = { ...userWith({ clubs: [member("les-jasmins")] }), id: "u-leila" };
const SAMI = {
  ...userWith({ isAnimator: true, clubs: [animator("les-jasmins"), animator("malouf-sfax")] }),
  id: "u-sami",
};
const NO_CLUB = { ...userWith(), id: "u-leila" };

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

describe("rôle dans le club", () => {
  it("un animateur global ne modifie pas la playlist d'un club où il est simple membre", () => {
    const sami = userWith({ isAnimator: true, clubs: [{ slug: "malouf-sfax", name: "Malouf Sfax", role: "member" }] });
    const playlist = { club: { slug: "malouf-sfax", name: "Malouf Sfax" }, ownerId: null };
    expect(canViewPlaylist(sami, playlist)).toBe(true);
    expect(canEditPlaylist(sami, playlist)).toBe(false);
    expect(canCopyPlaylist(sami, playlist)).toBe(true);
  });
});

describe("propositions et modération", () => {
  it("proposer exige une adresse vérifiée (spec §8.7)", () => {
    expect(canContribute(null)).toBe(false);
    expect(canContribute(userWith())).toBe(true);
    expect(canContribute(userWith({ emailVerified: false }))).toBe(false);
  });

  it("un modérateur n'approuve pas sa propre proposition ; un admin si (spec §4.3)", () => {
    const own = { authorId: "u1" };
    const other = { authorId: "u2" };
    const deleted = { authorId: null };
    expect(canApproveRevision(null, other)).toBe(false);
    expect(canApproveRevision(userWith(), other)).toBe(false);
    expect(canApproveRevision(userWith({ globalRole: "moderator" }), other)).toBe(true);
    expect(canApproveRevision(userWith({ globalRole: "moderator" }), own)).toBe(false);
    expect(canApproveRevision(userWith({ globalRole: "moderator" }), deleted)).toBe(true);
    expect(canApproveRevision(userWith({ globalRole: "admin" }), own)).toBe(true);
  });
});
