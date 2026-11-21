import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { resetDb } from "./helpers";

const base = { lyrics: "يا ليل يا عين", source: "lrclib" as const, dedupeKey: "k1" };

describe("schéma", () => {
  beforeEach(resetDb);

  it("pg_trgm produit des trigrammes pour l’arabe (locale UTF-8)", async () => {
    const res = await db.execute<{ t: string[] }>(sql`SELECT show_trgm('سيدي') AS t`);
    expect(res.rows[0].t.length).toBeGreaterThan(0);
  });

  it("exige au moins un titre", async () => {
    await expect(db.insert(songs).values({ ...base })).rejects.toThrow();
  });

  it("interdit deux imports avec la même dedupe_key, autorise deux contributions", async () => {
    await db.insert(songs).values({ ...base, titleAr: "أ", sourceRef: "1" });
    await expect(db.insert(songs).values({ ...base, titleAr: "ب", sourceRef: "2" })).rejects.toThrow();
    const contribution = { ...base, source: "contribution" as const, titleAr: "ج" };
    await db.insert(songs).values({ ...contribution, sourceRef: null });
    await expect(db.insert(songs).values({ ...contribution, sourceRef: null })).resolves.toBeDefined();
  });
});
