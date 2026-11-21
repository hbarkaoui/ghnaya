import { describe, expect, it } from "vitest";
import { canCreateClub, canManageClub, canModerate, clubRoleOf, clubsAnimatedBy } from "@/lib/auth/permissions";
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
