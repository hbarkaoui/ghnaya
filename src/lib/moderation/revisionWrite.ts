import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/errors";
import { songRevisions } from "@/lib/db/schema";
import type { ProposalPayload } from "@/types/proposal";

/**
 * Écritures des propositions (spec §8). L'appelant (Server Action) a vérifié la session, le droit
 * (`canContribute`, `canApproveRevision`), la limite du jour et le formulaire (`validateProposal`).
 */

export type CreateRevisionResult = { ok: true; id: string } | { ok: false; error: "pendingExists" };

/**
 * Enregistre une proposition en attente (spec §8.3). Une seconde correction en attente de la même chanson
 * par le même auteur est refusée par l'index unique `song_revisions_pending_uq`, même si deux envois se croisent.
 */
export async function createRevision(
  db: Db,
  input: { authorId: string; songId: string | null; payload: ProposalPayload },
): Promise<CreateRevisionResult> {
  try {
    const [row] = await db
      .insert(songRevisions)
      .values({ authorId: input.authorId, songId: input.songId, payload: input.payload, rightsDeclared: true })
      .returning({ id: songRevisions.id });
    return { ok: true, id: row.id };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "pendingExists" };
    throw error;
  }
}

/** Raisons d'une décision refusée : proposition inconnue, déjà relue, ou chanson retirée entre-temps. */
export type DecisionError = "notFound" | "notPending" | "songGone";

/** Rejette une proposition en attente, avec la note que l'auteur lira dans Mes contributions (spec §8.4). */
export async function rejectRevision(
  db: Db,
  input: { revisionId: string; reviewerId: string; note: string },
): Promise<{ ok: true } | { ok: false; error: Exclude<DecisionError, "songGone"> }> {
  const res = await db.execute(sql`
    UPDATE song_revisions
    SET status = 'rejected', reviewer_id = ${input.reviewerId}, review_note = ${input.note},
      reviewed_at = now(), updated_at = now()
    WHERE id = ${input.revisionId} AND status = 'pending'
    RETURNING id`);
  if (res.rows.length > 0) return { ok: true };
  const found = await db.execute(sql`SELECT 1 FROM song_revisions WHERE id = ${input.revisionId}`);
  return { ok: false, error: found.rows.length > 0 ? "notPending" : "notFound" };
}
