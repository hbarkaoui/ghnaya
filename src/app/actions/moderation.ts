"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { canApproveRevision } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import { requireModerator } from "@/lib/moderation/gate";
import { getReport, getRevision, openReports, pendingRevisions } from "@/lib/moderation/queries";
import { resolveReport, restoreSong } from "@/lib/moderation/reportWrite";
import { approveRevision, rejectRevision } from "@/lib/moderation/revisionWrite";
import { compareProposals, compareReports, nextInQueue } from "@/lib/moderation/queue";
import {
  NOTE_MAX,
  checkReportAction,
  checkReview,
  parseDecision,
  parseReportAction,
} from "@/lib/moderation/review";

/** Réponse à une décision refusée : le message, déjà traduit, et le numéro de l'essai (focus). */
export interface ModerationFormState {
  error: string | null;
  attempt: number;
}

/** Confirmation affichée en toast sur l'élément suivant (`?statut=`). */
export type DoneStatus = "approved" | "rejected" | "removed" | "dismissed" | "restored";

const withStatus = (path: string, status: DoneStatus) => `${path}?statut=${status}`;

/**
 * Approuver ou rejeter une proposition (spec §8.4, §8.5), puis ouvrir la suivante de la file, ou la
 * file vide « Plus rien à relire ». Les règles sont rejouées ici : une action serveur peut être appelée
 * directement. L'approbation écrit la chanson en une transaction (`lib/moderation/revisionWrite`).
 */
export async function reviewProposal(
  proposalId: string,
  previous: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const user = await requireModerator(`/moderation/${proposalId}`);
  const proposal = await getRevision(proposalId);
  if (!proposal) notFound();

  const t = await getTranslations("moderation.review.errors");
  const fail = (error: string): ModerationFormState => ({ error, attempt: previous.attempt + 1 });

  const decision = parseDecision(formData.get("decision"));
  if (!decision) return fail(t("notPending"));
  const checked = checkReview({
    proposal,
    mayApprove: canApproveRevision(user, proposal),
    decision,
    note: formData.get("note"),
  });
  if (!checked.ok) return fail(t(checked.error, { max: String(NOTE_MAX) }));

  const result =
    decision === "approve"
      ? await approveRevision(db, { revisionId: proposal.id, reviewerId: user.id, note: checked.note })
      : await rejectRevision(db, { revisionId: proposal.id, reviewerId: user.id, note: checked.note ?? "" });
  if (!result.ok) return fail(t(result.error === "notFound" ? "notPending" : result.error));
  revalidatePath("/", "layout");

  const next = nextInQueue(await pendingRevisions(), proposal, compareProposals);
  redirect(withStatus(next ? `/moderation/${next.id}` : "/moderation", decision === "approve" ? "approved" : "rejected"));
}

/**
 * Traiter un signalement (spec §9) : retirer la chanson (retrait doux), la corriger (le formulaire de
 * correction s'ouvre) ou classer sans suite, toujours avec une note ; puis ouvrir le suivant.
 */
export async function handleReport(
  reportId: string,
  previous: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const user = await requireModerator(`/moderation/signalements/${reportId}`);
  const report = await getReport(reportId);
  if (!report) notFound();

  const t = await getTranslations("moderation.report.errors");
  const fail = (error: string): ModerationFormState => ({ error, attempt: previous.attempt + 1 });

  const action = parseReportAction(formData.get("action"));
  if (!action) return fail(t("notOpen"));
  const checked = checkReportAction({ report, action, note: formData.get("note"), songPublished: report.song.published });
  if (!checked.ok) return fail(t(checked.error, { max: String(NOTE_MAX) }));

  const result = await resolveReport(db, { reportId: report.id, resolverId: user.id, action, note: checked.note });
  if (!result.ok) return fail(t(result.error === "notFound" ? "notOpen" : result.error, { max: String(NOTE_MAX) }));
  revalidatePath("/", "layout");

  if (action === "correct") redirect(`/contribuer/${report.song.id}`);
  const next = nextInQueue(await openReports(), report, compareReports);
  redirect(
    withStatus(
      next ? `/moderation/signalements/${next.id}` : "/moderation/signalements",
      action === "remove" ? "removed" : "dismissed",
    ),
  );
}

/** Rétablir une chanson retirée (spec §9). Passe par un signalement : c'est le seul écran qui mène à une chanson retirée. */
export async function restoreSongAction(reportId: string): Promise<void> {
  await requireModerator(`/moderation/signalements/${reportId}`);
  const report = await getReport(reportId);
  if (!report) notFound();
  await restoreSong(db, report.song.id);
  revalidatePath("/", "layout");
  redirect(withStatus(`/moderation/signalements/${report.id}`, "restored"));
}
