import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { reports } from "@/lib/db/schema";
import { statusAfter } from "@/lib/moderation/review";
import type { ReportReason, ReportStatus } from "@/types/report";

/**
 * Écritures des signalements et des retraits (spec §9). L'appelant (Server Action) a vérifié la session, le
 * droit (`canModerate`), la limite du jour et les entrées (`validateReport`, `checkReportAction`).
 */

export async function createReport(
  db: Db,
  input: { songId: string; reporterId: string | null; contactEmail: string | null; reason: ReportReason; details: string },
): Promise<string> {
  const [row] = await db
    .insert(reports)
    .values({
      songId: input.songId,
      reporterId: input.reporterId,
      contactEmail: input.contactEmail,
      reason: input.reason,
      details: input.details,
    })
    .returning({ id: reports.id });
  return row.id;
}

export type ResolveAction = "remove" | "correct" | "dismiss";
export type ResolveResult = { ok: true } | { ok: false; error: "notFound" | "notOpen" | "songGone" };

/**
 * Traite un signalement ouvert, en une transaction. Verrous : le signalement, puis la chanson.
 *  - `remove` : retrait doux (`status = removed`), la note en est le motif ; `import_locked` empêche un nouvel
 *    import de réécrire une chanson retirée pour ses droits ;
 *  - `correct` : le signalement est traité, la chanson reste publiée (le modérateur propose ensuite sa correction) ;
 *  - `dismiss` : classé sans suite, y compris pour une chanson déjà retirée.
 * `remove` et `correct` refusent une chanson déjà retirée (`songGone`) : rien n'est écrit.
 */
export function resolveReport(
  db: Db,
  input: { reportId: string; resolverId: string; action: ResolveAction; note: string },
): Promise<ResolveResult> {
  return db.transaction(async (tx): Promise<ResolveResult> => {
    const found = await tx.execute<{ song_id: string; status: ReportStatus }>(sql`
      SELECT song_id, status FROM reports WHERE id = ${input.reportId} FOR UPDATE`);
    const report = found.rows[0];
    if (!report) return { ok: false, error: "notFound" };
    if (report.status !== "open") return { ok: false, error: "notOpen" };

    if (input.action !== "dismiss") {
      const song = await tx.execute<{ status: "published" | "removed" }>(sql`
        SELECT status FROM songs WHERE id = ${report.song_id} FOR UPDATE`);
      if (song.rows[0]?.status !== "published") return { ok: false, error: "songGone" };
      if (input.action === "remove") {
        await tx.execute(sql`
          UPDATE songs SET status = 'removed', removed_reason = ${input.note}, import_locked = true, updated_at = now()
          WHERE id = ${report.song_id}`);
      }
    }
    await tx.execute(sql`
      UPDATE reports
      SET status = ${statusAfter(input.action)}, resolution_note = ${input.note}, resolved_by = ${input.resolverId},
        updated_at = now()
      WHERE id = ${input.reportId}`);
    return { ok: true };
  });
}

/** Annule un retrait doux (spec §9, « Réversibilité ») : la chanson est de nouveau publiée, son motif effacé. */
export async function restoreSong(db: Db, songId: string): Promise<"restored" | "notRemoved"> {
  const res = await db.execute(sql`
    UPDATE songs SET status = 'published', removed_reason = NULL, updated_at = now()
    WHERE id = ${songId} AND status = 'removed'
    RETURNING id`);
  return res.rows.length > 0 ? "restored" : "notRemoved";
}
