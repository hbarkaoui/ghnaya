import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { isUuid } from "@/lib/db/uuid";
import { SONG_SOURCES, type SongSource } from "@/types/catalog";

/**
 * Retrait en masse (spec §9), lancé par un admin en ligne de commande : toutes les chansons d'une source,
 * au besoin celles d'un artiste. C'est un retrait doux, comme celui d'un signalement : la chanson est
 * gardée, avec son motif, et protégée des imports (`import_locked`). `--restore` annule un retrait en masse
 * fait avec le même motif (`removed_by_bulk`), et laisse les chansons retirées pour un autre motif ou depuis un
 * signalement, même si sa note reprend ce motif. Le verrou d'import reste posé
 * après un rétablissement : un modérateur a décidé de cette chanson.
 */

export const BULK_REASON_MAX = 1000;

const USAGE =
  'Usage : pnpm songs:remove --source lrclib|public_domain|contribution --reason "<motif>" [--artist <uuid>] [--dry-run] [--restore]';

export interface BulkArgs {
  source: SongSource;
  reason: string;
  artistId: string | null;
  /** Compte les chansons concernées sans rien écrire. */
  dryRun: boolean;
  /** Rétablit au lieu de retirer. */
  restore: boolean;
}

export type BulkArgsResult = { ok: true; args: BulkArgs } | { ok: false; error: string };

export function parseBulkArgs(argv: string[]): BulkArgsResult {
  let source: SongSource | null = null;
  let reason: string | null = null;
  let artistId: string | null = null;
  let dryRun = false;
  let restore = false;
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--dry-run") dryRun = true;
    else if (flag === "--restore") restore = true;
    else if (flag === "--source" && SONG_SOURCES.includes(value as SongSource)) {
      source = value as SongSource;
      i += 1;
    } else if (flag === "--reason" && value !== undefined) {
      reason = value.trim();
      i += 1;
    } else if (flag === "--artist" && value !== undefined && isUuid(value)) {
      artistId = value;
      i += 1;
    } else return { ok: false, error: USAGE };
  }
  if (!source || !reason || reason.length > BULK_REASON_MAX) return { ok: false, error: USAGE };
  return { ok: true, args: { source, reason, artistId, dryRun, restore } };
}

const byArtist = (artistId: string | null): SQL =>
  artistId
    ? sql`AND EXISTS (SELECT 1 FROM song_artists sa WHERE sa.song_id = songs.id AND sa.artist_id = ${artistId})`
    : sql``;

/** Applique la commande, et renvoie le nombre de chansons retirées ou rétablies (ou qui le seraient, avec `--dry-run`). */
export async function runBulk(db: Db, args: BulkArgs): Promise<number> {
  const { source, reason, artistId, dryRun, restore } = args;
  const filter = byArtist(artistId);
  if (restore) {
    const where = sql`source = ${source} AND status = 'removed' AND removed_by_bulk AND removed_reason = ${reason} ${filter}`;
    if (dryRun) return count(db, where);
    const res = await db.execute(sql`
      UPDATE songs SET status = 'published', removed_reason = NULL, removed_by_bulk = false, updated_at = now()
      WHERE ${where} RETURNING id`);
    return res.rows.length;
  }
  const where = sql`source = ${source} AND status = 'published' ${filter}`;
  if (dryRun) return count(db, where);
  const res = await db.execute(sql`
    UPDATE songs SET status = 'removed', removed_reason = ${reason}, removed_by_bulk = true, import_locked = true,
      updated_at = now()
    WHERE ${where} RETURNING id`);
  return res.rows.length;
}

async function count(db: Db, where: SQL): Promise<number> {
  const res = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs WHERE ${where}`);
  return Number(res.rows[0].n);
}
