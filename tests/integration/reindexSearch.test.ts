import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { upsertArtist } from "@/lib/catalog/artists";
import { songSearchColumns } from "@/lib/catalog/searchColumns";
import { songDedupeKey, upsertSong } from "@/lib/catalog/songs";
import { db } from "@/lib/db/client";
import { reindexSearch } from "../../scripts/reindexSearch";
import { resetDb } from "./helpers";

async function addOumKalthoum(titleAr: string, sourceRef: string): Promise<string> {
  const a = await upsertArtist(db, { nameAr: "أم كلثوم", nameLatin: "Oum Kalthoum" });
  const { id } = await upsertSong(db, {
    titleAr,
    lyrics: "يا ليل",
    dialect: "eg",
    source: "lrclib",
    sourceRef,
    artists: [{ ...a, role: "main" }],
  });
  return id;
}

async function row(id: string) {
  const r = await db.execute<{ search_key: string; lyrics_search_key: string; dedupe_key: string }>(
    sql`SELECT search_key, lyrics_search_key, dedupe_key FROM songs WHERE id = ${id}`,
  );
  return r.rows[0];
}

describe("reindexSearch", () => {
  beforeEach(resetDb);

  it("recalcule les colonnes de recherche et la clé de dédoublonnage, puis ne change plus rien", async () => {
    const id = await addOumKalthoum("انت عمري", "1");
    // État laissé par une ancienne table de clés (ع valait « 3 »).
    await db.execute(sql`UPDATE songs SET search_key = 'ntmr3', lyrics_search_key = 'l', dedupe_key = 'oum kalthoum|ntmr3'`);
    await db.execute(sql`UPDATE artists SET search_key = 'old'`);

    expect(await reindexSearch(db)).toMatchObject({ artistsUpdated: 1, songsUpdated: 1, dedupeConflicts: 0 });
    const cols = songSearchColumns({ titleAr: "انت عمري", lyrics: "يا ليل", artists: [{ nameAr: "أم كلثوم", nameLatin: "Oum Kalthoum" }] });
    expect(await row(id)).toEqual({
      search_key: cols.searchKey,
      lyrics_search_key: cols.lyricsSearchKey,
      dedupe_key: songDedupeKey("oum kalthoum", "انت عمري"),
    });
    const artist = await db.execute<{ search_key: string }>(sql`SELECT search_key FROM artists`);
    expect(artist.rows[0].search_key).not.toBe("old");

    expect(await reindexSearch(db)).toMatchObject({ artistsUpdated: 0, songsUpdated: 0, dedupeConflicts: 0 });
  });

  it("signale sans rien supprimer deux chansons qui prendraient la même clé de dédoublonnage", async () => {
    const kept = await addOumKalthoum("انت عمري", "1");
    const other = await addOumKalthoum("فات الميعاد", "2");
    // Une ancienne clé, qui deviendrait celle de la première chanson une fois recalculée.
    await db.execute(sql`UPDATE songs SET title_ar = 'إنت عمري', dedupe_key = 'oum kalthoum|old' WHERE id = ${other}`);

    const lines: string[] = [];
    expect(await reindexSearch(db, (l) => lines.push(l))).toMatchObject({ dedupeConflicts: 1 });
    expect(lines.some((l) => l.includes(other) && l.includes(kept))).toBe(true);
    expect((await row(other)).dedupe_key).toBe("oum kalthoum|old");
    const n = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs`);
    expect(Number(n.rows[0].n)).toBe(2);
  });
});
