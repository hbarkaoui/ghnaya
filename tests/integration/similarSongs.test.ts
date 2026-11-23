// Plan 3, tâche 4 : « Cette chanson existe peut-être déjà » (spec §8.2, écart 5).
import { beforeAll, describe, expect, it } from "vitest";
import { findSimilarSongs } from "@/lib/contribution/similarSongs";
import { db } from "@/lib/db/client";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

describe("findSimilarSongs", () => {
  let ids = new Map<string, string>();
  beforeAll(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });
  const idsOf = (hits: { id: string }[]) => hits.map((h) => h.id);

  it("trouve la chanson par son titre latin ou arabe", async () => {
    expect(idsOf(await findSimilarSongs({ titles: ["sidi mansour"], artists: ["Saber Rebai"] }))[0]).toBe(
      ids.get("s-sidi-mansour"),
    );
    expect(idsOf(await findSimilarSongs({ titles: ["سيدي منصور"], artists: [] }))[0]).toBe(ids.get("s-sidi-mansour"));
  });

  it("place d'abord les chansons de l'artiste saisi", async () => {
    // « ya lili » ressort Ya Lili (Balti) puis Ya Lella (Hedi Jouini) : l'artiste remet Ya Lella devant.
    expect(idsOf(await findSimilarSongs({ titles: ["ya lili"], artists: ["Hedi Jouini"] }))).toEqual([
      ids.get("s-ya-lella"),
      ids.get("s-ya-lili"),
    ]);
  });

  it("ne liste pas deux fois une chanson trouvée par ses deux titres", async () => {
    expect(idsOf(await findSimilarSongs({ titles: ["سيدي منصور", "Sidi Mansour"], artists: [] }))).toEqual([
      ids.get("s-sidi-mansour"),
    ]);
  });

  it("montre 3 chansons au plus, sans extrait de paroles", async () => {
    const hits = await findSimilarSongs({ titles: ["ya"], artists: [] });
    expect(hits).toHaveLength(3);
    expect(hits.every((h) => h.snippet === null)).toBe(true);
  });

  it("ne cherche rien sans titre", async () => {
    expect(await findSimilarSongs({ titles: ["", " "], artists: ["Saber Rebai"] })).toEqual([]);
  });

  it("ne rapproche pas une chanson par ses seules paroles", async () => {
    // « الليل » apparaît dans huit paroles, mais dans aucun titre ni nom d'artiste.
    expect(await findSimilarSongs({ titles: ["الليل"], artists: [] })).toEqual([]);
  });
});
