import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { buildAliasIndex } from "../../scripts/import/artistAliases";
import { readLrclibTracks } from "../../scripts/import/lrclibReader";
import { runLrclibImport } from "../../scripts/import/runLrclibImport";
import { resetDb } from "./helpers";

const ALIASES = buildAliasIndex(`
- name_ar: صابر الرباعي
  name_latin: Saber Rebai
  aliases: []
- name_ar: لطفي بوشناق
  name_latin: Lotfi Bouchnak
  aliases: []
`);

/** Petit export au format LRCLIB (tables tracks et lyrics). */
function makeDump(
  rows: Array<{ id: number; name: string; artist: string; lyrics: string | null; instrumental?: boolean }>,
): string {
  const file = path.join(mkdtempSync(path.join(tmpdir(), "lrclib-")), "dump.sqlite3");
  const s = new Database(file);
  s.exec(`
    CREATE TABLE tracks (id INTEGER PRIMARY KEY, name TEXT, artist_name TEXT, last_lyrics_id INTEGER);
    CREATE TABLE lyrics (id INTEGER PRIMARY KEY, plain_lyrics TEXT, track_id INTEGER,
      has_plain_lyrics BOOLEAN, instrumental BOOLEAN);`);
  const insertLyrics = s.prepare("INSERT INTO lyrics VALUES (?, ?, ?, ?, ?)");
  const insertTrack = s.prepare("INSERT INTO tracks VALUES (?, ?, ?, ?)");
  for (const r of rows) {
    insertLyrics.run(r.id, r.lyrics, r.id, r.lyrics ? 1 : 0, r.instrumental ? 1 : 0);
    insertTrack.run(r.id, r.name, r.artist, r.id);
  }
  s.close();
  return file;
}

const DUMP_ROWS = [
  { id: 1, name: "سيدي منصور", artist: "صابر الرباعي", lyrics: "سطر تجريبي أول\nسطر تجريبي ثاني أطول" },
  { id: 2, name: "Sidi Mansour (Official Video)", artist: "Saber Rebai", lyrics: "سطر تجريبي أول" },
  { id: 3, name: "Yellow", artist: "Coldplay", lyrics: "Look at the stars" },
  { id: 4, name: "Instrumental", artist: "X", lyrics: null, instrumental: true },
  { id: 5, name: "Balti - Ena (Official Music Video)", artist: "Balti", lyrics: "كلام تجريبي في الحومة" },
  { id: 6, name: "Nebni (feat. Lotfi Bouchnak)", artist: "Balti", lyrics: "سطر تجريبي للأغنية" },
];

describe("runLrclibImport", () => {
  beforeEach(resetDb);

  it("dry-run : rapport sans écriture", async () => {
    const report = await runLrclibImport({
      db,
      tracks: readLrclibTracks(makeDump(DUMP_ROWS)),
      aliases: ALIASES,
      dryRun: true,
    });
    expect(report).toMatchObject({ read: 5, candidates: 4, unique: 3, merged: 1, inserted: 0 });
    expect(report.rejected.not_arabic).toBe(1);
    const r = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs`);
    expect(Number(r.rows[0].n)).toBe(0);
  });

  it("importe, fusionne les doublons, et reste idempotent", async () => {
    const dump = makeDump(DUMP_ROWS);
    const first = await runLrclibImport({ db, tracks: readLrclibTracks(dump), aliases: ALIASES, dryRun: false });
    expect(first).toMatchObject({ inserted: 3, updated: 0, errors: 0 });

    const sidi = await db.execute<{ title_ar: string; title_latin: string; source_ref: string }>(
      sql`SELECT title_ar, title_latin, source_ref FROM songs WHERE search_key LIKE 'sdmnsr%'`,
    );
    expect(sidi.rows).toEqual([{ title_ar: "سيدي منصور", title_latin: "Sidi Mansour", source_ref: "1" }]);

    const nebni = await db.execute<{ role: string; name_latin: string }>(sql`
      SELECT sa.role, a.name_latin FROM songs s
      JOIN song_artists sa ON sa.song_id = s.id JOIN artists a ON a.id = sa.artist_id
      WHERE s.title_latin = 'Nebni' ORDER BY sa.position`);
    expect(nebni.rows).toEqual([
      { role: "main", name_latin: "Balti" },
      { role: "feat", name_latin: "Lotfi Bouchnak" },
    ]);
    const ena = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs WHERE title_latin = 'Ena'`);
    expect(Number(ena.rows[0].n)).toBe(1);

    const second = await runLrclibImport({ db, tracks: readLrclibTracks(dump), aliases: ALIASES, dryRun: false });
    expect(second).toMatchObject({ inserted: 0, updated: 3 });
    const total = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs`);
    expect(Number(total.rows[0].n)).toBe(3);
  });

  it("signale la progression tous les 100 000 pistes, même refusées", async () => {
    function* nonArabic(n: number) {
      for (let id = 1; id <= n; id++) yield { id, name: `Song ${id}`, artistName: "Band", plainLyrics: "la la la" };
    }
    const lines: string[] = [];
    const report = await runLrclibImport({
      db,
      tracks: nonArabic(200_000),
      aliases: ALIASES,
      dryRun: true,
      log: (line) => lines.push(line),
    });
    expect(report.rejected.not_arabic).toBe(200_000);
    expect(lines).toEqual(["… 100000 pistes lues, 0 chansons retenues", "… 200000 pistes lues, 0 chansons retenues"]);
  });
});
