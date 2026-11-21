// Plan 1, tâche 10 : orchestration de l'import LRCLIB. Lit tout l'export, garde la meilleure version de
// chaque chanson, puis l'écrit (sauf en dry-run, qui ne fait que mesurer).
import { artistIdentityKey, upsertArtist, type UpsertedArtist } from "@/lib/catalog/artists";
import { upsertSong, type SongArtistRef } from "@/lib/catalog/songs";
import type { Db } from "@/lib/db/client";
import type { AliasIndex } from "./artistAliases";
import type { LrclibTrack } from "./lrclibReader";
import { keepBest, transformTrack, type Candidate, type Rejection } from "./lrclibTransform";

export interface ImportReport {
  read: number;
  rejected: Record<Rejection, number>;
  candidates: number;
  unique: number;
  merged: number;
  /** Estimation grossière : paroles × 3, pour tenir compte des colonnes de recherche et des index. */
  estimatedBytes: number;
  inserted: number;
  updated: number;
  locked: number;
  errors: number;
}

const MAX_LOGGED_ERRORS = 20;

export async function runLrclibImport(opts: {
  db: Db;
  tracks: Iterable<LrclibTrack>;
  aliases: AliasIndex;
  dryRun: boolean;
  log?: (line: string) => void;
}): Promise<ImportReport> {
  const log = opts.log ?? (() => undefined);
  const report: ImportReport = {
    read: 0,
    rejected: { empty_lyrics: 0, not_arabic: 0, no_artist: 0, empty_title: 0 },
    candidates: 0,
    unique: 0,
    merged: 0,
    estimatedBytes: 0,
    inserted: 0,
    updated: 0,
    locked: 0,
    errors: 0,
  };

  const best = new Map<string, Candidate>();
  for (const track of opts.tracks) {
    report.read += 1;
    const result = transformTrack(track, opts.aliases);
    if ("rejected" in result) {
      report.rejected[result.rejected] += 1;
      continue;
    }
    report.candidates += 1;
    keepBest(best, result);
    if (report.read % 100_000 === 0) log(`… ${report.read} pistes lues, ${best.size} chansons retenues`);
  }
  report.unique = best.size;
  report.merged = report.candidates - report.unique;
  for (const c of best.values()) report.estimatedBytes += Buffer.byteLength(c.lyrics) * 3;
  if (opts.dryRun) return report;

  const artistCache = new Map<string, UpsertedArtist>();
  for (const c of best.values()) {
    try {
      const refs: SongArtistRef[] = [];
      for (const [i, input] of c.artists.entries()) {
        const key = artistIdentityKey(input);
        let artist = artistCache.get(key);
        if (!artist) {
          artist = await upsertArtist(opts.db, input);
          artistCache.set(key, artist);
        }
        refs.push({ ...artist, role: i === 0 ? "main" : "feat" });
      }
      const { outcome } = await upsertSong(opts.db, {
        titleAr: c.titleAr,
        titleLatin: c.titleLatin,
        lyrics: c.lyrics,
        dialect: "other",
        source: "lrclib",
        sourceRef: String(c.lrclibId),
        artists: refs,
      });
      report[outcome] += 1;
    } catch (e) {
      report.errors += 1;
      if (report.errors <= MAX_LOGGED_ERRORS) log(`Erreur sur LRCLIB #${c.lrclibId} : ${String(e)}`);
    }
  }
  return report;
}
