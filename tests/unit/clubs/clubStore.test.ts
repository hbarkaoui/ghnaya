import { afterEach, describe, expect, it } from "vitest";
import { PLAYLISTS } from "@/mocks/catalog";
import {
  clubPlaylists,
  clubSlugsOf,
  createClub,
  createClubPlaylist,
  deleteClub,
  getClub,
  joinClub,
  memberships,
  renameClub,
  resetClubStore,
  roleIn,
} from "@/mocks/clubStore";

afterEach(() => resetClubStore());

describe("clubs fictifs : état de départ", () => {
  it("chaque club a au moins un animateur", () => {
    const slugs = new Set(memberships().map((m) => m.clubSlug));
    for (const slug of slugs) {
      expect(memberships().some((m) => m.clubSlug === slug && m.role === "animator")).toBe(true);
    }
  });

  it("hors de Sami (animateur), personne n'est dans plus d'un club", () => {
    const users = new Set(memberships().map((m) => m.userId));
    for (const id of users) if (id !== "u-sami") expect(clubSlugsOf(id).length).toBeLessThanOrEqual(1);
  });

  it("les adhésions de départ des personnes de démonstration", () => {
    expect(clubSlugsOf("u-leila")).toEqual(["les-jasmins"]);
    expect(clubSlugsOf("u-nour")).toEqual([]);
    expect(clubSlugsOf("u-rania")).toEqual(["les-jasmins"]);
    expect(clubSlugsOf("u-sami")).toEqual(["les-jasmins", "malouf-sfax", "chorale-du-bardo"]);
  });
});

describe("clubs fictifs : modifications en mémoire", () => {
  it("le créateur d'un club en devient l'animateur, avec un slug libre", () => {
    const club = createClub("Les Jasmins", "u-sami");
    expect(club.slug).toBe("les-jasmins-2");
    expect(roleIn(club.slug, "u-sami")).toBe("animator");
  });

  it("renommer un club renomme aussi ses playlists, sans changer le slug", () => {
    renameClub("les-jasmins", "Jasmins de Tunis");
    expect(getClub("les-jasmins")?.name).toBe("Jasmins de Tunis");
    expect(clubPlaylists("les-jasmins").every((p) => p.club?.name === "Jasmins de Tunis")).toBe(true);
  });

  it("supprimer un club retire ses playlists et ses membres", () => {
    deleteClub("les-jasmins");
    expect(getClub("les-jasmins")).toBeUndefined();
    expect(PLAYLISTS.some((p) => p.club?.slug === "les-jasmins")).toBe(false);
    expect(clubSlugsOf("u-leila")).toEqual([]);
  });

  it("une nouvelle playlist de club passe en tête des playlists du club", () => {
    const playlist = createClubPlaylist("les-jasmins", "Séance du samedi");
    expect(clubPlaylists("les-jasmins")[0]).toEqual(playlist);
  });

  it("un membre qui rejoint un autre club quitte le sien", () => {
    expect(joinClub({ id: "u-leila", isAnimator: false }, "nghanniw")).toMatchObject({ ok: true, left: ["les-jasmins"] });
    expect(clubSlugsOf("u-leila")).toEqual(["nghanniw"]);
  });

  it("la réinitialisation revient à l'état de départ", () => {
    deleteClub("les-jasmins");
    resetClubStore();
    expect(clubSlugsOf("u-leila")).toEqual(["les-jasmins"]);
    expect(clubPlaylists("les-jasmins").length).toBeGreaterThan(0);
  });
});
