// Plan 1, tâche 11 : import des œuvres du domaine public, préparées à la main dans data/public-domain.
// Un fichier invalide ou une clé en double interrompt tout : ces fichiers doivent être corrigés.
import { parse } from "yaml";
import { upsertArtist } from "@/lib/catalog/artists";
import { upsertSong, type SongArtistRef } from "@/lib/catalog/songs";
import type { Db } from "@/lib/db/client";
import { checkSong, PublicDomainFile, type PdIssue, type PublicDomainSong } from "./publicDomainSchema";

export interface PdReport {
  songs: number;
  rejected: PdIssue[];
  inserted: number;
  updated: number;
  locked: number;
}

export async function runPublicDomainImport(opts: {
  db: Db;
  files: Array<{ path: string; content: string }>;
  currentYear: number;
  dryRun: boolean;
}): Promise<PdReport> {
  const all: PublicDomainSong[] = [];
  const seenKeys = new Map<string, string>();
  for (const file of opts.files) {
    const parsed = PublicDomainFile.safeParse(parse(file.content) ?? []);
    if (!parsed.success) throw new Error(`${file.path} invalide : ${parsed.error.message}`);
    for (const song of parsed.data) {
      const previous = seenKeys.get(song.key);
      if (previous) throw new Error(`Clé en double « ${song.key} » dans ${previous} et ${file.path}`);
      seenKeys.set(song.key, file.path);
      all.push(song);
    }
  }

  const report: PdReport = { songs: all.length, rejected: [], inserted: 0, updated: 0, locked: 0 };
  const valid = all.filter((s) => {
    const issue = checkSong(s, opts.currentYear);
    if (issue) report.rejected.push(issue);
    return !issue;
  });
  if (opts.dryRun) return report;

  for (const s of valid) {
    const refs: SongArtistRef[] = [];
    for (const [i, a] of s.artists.entries()) {
      const artist = await upsertArtist(opts.db, { nameAr: a.name_ar, nameLatin: a.name_latin });
      refs.push({ ...artist, role: i === 0 ? "main" : "feat" });
    }
    const { outcome } = await upsertSong(opts.db, {
      titleAr: s.title_ar,
      titleLatin: s.title_latin,
      lyrics: s.lyrics.trim(),
      lyricsTranslit: s.lyrics_translit?.trim(),
      translitStatus: s.lyrics_translit ? "reviewed" : "none",
      dialect: s.dialect,
      source: "public_domain",
      sourceRef: s.key,
      artists: refs,
    });
    report[outcome] += 1;
  }
  return report;
}
