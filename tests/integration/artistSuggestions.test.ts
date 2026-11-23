// Plan 3, tâche 4 : artistes connus en base, pour l'autocomplétion et pour la résolution des noms saisis (spec §8.1).
import { beforeAll, describe, expect, it } from "vitest";
import { artistCandidates, suggestArtistsFromDb } from "@/lib/catalog/artistSuggestions";
import { resolveArtists } from "@/lib/contribution/artists";
import { db } from "@/lib/db/client";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

const names = (artists: { nameLatin: string | null }[]) => artists.map((a) => a.nameLatin);

describe("artistes connus, lus en base", () => {
  beforeAll(async () => {
    await resetDb();
    await seedFixtures(db);
  });

  it("propose les artistes dès 2 lettres, dans l'écriture tapée", async () => {
    expect(names(await suggestArtistsFromDb("sab"))[0]).toBe("Saber Rebai");
    expect(names(await suggestArtistsFromDb("صابر"))[0]).toBe("Saber Rebai");
    expect(names(await suggestArtistsFromDb("oum kal"))[0]).toBe("Oum Kalthoum");
  });

  it("rapproche l'arabizi de l'arabe par la clé de consonnes", async () => {
    expect(names(await suggestArtistsFromDb("fayrouz"))).toContain("Fairuz");
  });

  it("ne propose rien sous 2 lettres, ni pour un nom inconnu", async () => {
    expect(await suggestArtistsFromDb("s")).toEqual([]);
    expect(await suggestArtistsFromDb("   ")).toEqual([]);
    expect(await suggestArtistsFromDb("zzzzzz")).toEqual([]);
  });

  it("classe les artistes dont le nom commence par la saisie en premier, et respecte la limite demandée", async () => {
    // « ou » est dans quatre noms ; « Oum Kalthoum » le commence.
    const all = await suggestArtistsFromDb("ou");
    expect(names(all)[0]).toBe("Oum Kalthoum");
    expect(all).toHaveLength(4);
    expect(names(await suggestArtistsFromDb("ou", 2))).toEqual(names(all).slice(0, 2));
  });

  it("retrouve l'artiste d'un nom saisi, quelle que soit la casse, et laisse un nom inconnu nouveau", async () => {
    const typed = ["saber rebai", "Artiste Nouveau"];
    const resolved = resolveArtists(typed, await artistCandidates(typed));
    expect(resolved[0]).toMatchObject({ nameLatin: "Saber Rebai", nameAr: "صابر الرباعي" });
    expect(resolved[0].id).toEqual(expect.any(String));
    expect(resolved[1]).toEqual({ id: null, nameAr: null, nameLatin: "Artiste Nouveau" });
  });

  it("ne renvoie aucun candidat pour un nom sans lettres", async () => {
    expect(await artistCandidates(["", "  ", "--"])).toEqual([]);
  });
});
