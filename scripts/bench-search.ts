// Plan 1, tâche 15 : `pnpm bench:search [--sample 1000]`. Mesure la latence de searchSongs sur des requêtes
// tirées de la base (titres, artistes, débuts de vers) et la précision sur data/search-golden.yaml.
// Sort en échec si le p95 dépasse 300 ms ou si une requête de référence n'a pas son titre dans le top 3.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { sql } from "drizzle-orm";
import { parse } from "yaml";
import { z } from "zod";
import { db, pool } from "@/lib/db/client";
import { WORD_SIMILARITY_THRESHOLD } from "@/lib/search/query";
import { searchSongs } from "@/lib/search/searchSongs";
import { toSearchKey } from "@/lib/text/searchKey";

const P95_TARGET_MS = 300;
const GOLDEN_FILE = "data/search-golden.yaml";
// expected_artist sert aux requêtes sur un nom d'artiste : un artiste prolifique a bien plus de 3 chansons,
// donc aucun titre précis n'a de raison d'être dans le top 3, alors qu'une de ses chansons, si.
const Golden = z.array(
  z.union([
    z.object({ query: z.string().min(1), expected_title: z.string().min(1) }).strict(),
    z.object({ query: z.string().min(1), expected_artist: z.string().min(1) }).strict(),
  ]),
);

function percentile(sortedMs: number[], p: number): number {
  return sortedMs[Math.min(sortedMs.length - 1, Math.floor((p / 100) * sortedMs.length))] ?? 0;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = performance.now();
  const value = await fn();
  return { ms: performance.now() - start, value };
}

async function sampleQueries(n: number): Promise<string[]> {
  const res = await db.execute<{
    title_ar: string | null;
    title_latin: string | null;
    artist: string | null;
    line: string;
  }>(sql`
    SELECT s.title_ar, s.title_latin,
      (SELECT COALESCE(a.name_latin, a.name_ar) FROM song_artists sa JOIN artists a ON a.id = sa.artist_id
        WHERE sa.song_id = s.id ORDER BY sa.position LIMIT 1) AS artist,
      split_part(s.lyrics, E'\n', 2) AS line
    FROM songs s WHERE s.status = 'published' ORDER BY random() LIMIT ${n}`);
  const queries: string[] = [];
  for (const r of res.rows) {
    if (r.title_latin) queries.push(r.title_latin);
    if (r.title_ar) queries.push(r.title_ar);
    if (r.artist) queries.push(r.artist);
    const words = r.line.split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
    if (words) queries.push(words);
  }
  return queries.slice(0, n);
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { sample: { type: "string", default: "1000" } } });
  const sample = Number(values.sample);
  if (!Number.isInteger(sample) || sample < 1) throw new Error(`--sample attend un entier positif, reçu « ${values.sample} ».`);
  const golden = Golden.parse(parse(readFileSync(GOLDEN_FILE, "utf8")));
  const count = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs WHERE status = 'published'`);
  console.log(`Chansons publiées : ${count.rows[0]?.n ?? 0} — seuil word_similarity : ${WORD_SIMILARITY_THRESHOLD}`);

  const queries = await sampleQueries(sample);
  for (const q of queries.slice(0, 20)) await searchSongs(q); // préchauffage, non mesuré

  const durations: number[] = [];
  for (const q of queries) durations.push((await timed(() => searchSongs(q))).ms);

  const misses: string[] = [];
  for (const g of golden) {
    const { ms, value } = await timed(() => searchSongs(g.query));
    durations.push(ms);
    const top3 = value.items.slice(0, 3);
    const sameKey = (key: string, names: { ar: string | null; latin: string | null }) =>
      toSearchKey(names.ar ?? "") === key || toSearchKey(names.latin ?? "") === key;
    if ("expected_artist" in g) {
      const key = toSearchKey(g.expected_artist);
      if (!top3.some((h) => h.artists.some((a) => sameKey(key, { ar: a.nameAr, latin: a.nameLatin })))) {
        const got = top3.map((h) => h.artists.map((a) => a.nameLatin ?? a.nameAr).join(", ")).join(" | ");
        misses.push(`« ${g.query} » → attendu l'artiste « ${g.expected_artist} », obtenu : ${got || "aucun résultat"}`);
      }
    } else {
      const key = toSearchKey(g.expected_title);
      if (!top3.some((h) => sameKey(key, { ar: h.titleAr, latin: h.titleLatin }))) {
        const got = top3.map((h) => h.titleAr ?? h.titleLatin).join(" | ") || "aucun résultat";
        misses.push(`« ${g.query} » → attendu « ${g.expected_title} », obtenu : ${got}`);
      }
    }
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const p95 = percentile(sorted, 95);
  console.log(
    `Requêtes : ${sorted.length} — p50 ${percentile(sorted, 50).toFixed(0)} ms — p95 ${p95.toFixed(0)} ms — p99 ${percentile(sorted, 99).toFixed(0)} ms (objectif p95 ≤ ${P95_TARGET_MS} ms)`,
  );
  console.log(`Référence : ${golden.length - misses.length}/${golden.length} dans le top 3`);
  for (const m of misses) console.log(`  ✗ ${m}`);
  if (p95 > P95_TARGET_MS || misses.length > 0) process.exitCode = 1;
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
