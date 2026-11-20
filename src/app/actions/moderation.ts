"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { songFromProposal } from "@/lib/moderation/apply";
import { requireModerator } from "@/lib/moderation/gate";
import { compareProposals, compareReports, nextInQueue } from "@/lib/moderation/queue";
import {
  NOTE_MAX,
  checkReportAction,
  checkReview,
  parseDecision,
  parseReportAction,
  statusAfter,
} from "@/lib/moderation/review";
import { getSong } from "@/mocks/catalog";
import { openReports, pendingProposals } from "@/mocks/moderation";
import { proposalStore } from "@/mocks/proposals";
import { getReport, resolveReport } from "@/mocks/reports";
import { songStore } from "@/mocks/songStore";

/** Réponse à une décision refusée : le message, déjà traduit, et le numéro de l'essai (focus). */
export interface ModerationFormState {
  error: string | null;
  attempt: number;
}

/** Confirmation affichée en toast sur l'élément suivant (`?statut=`). */
export type DoneStatus = "approved" | "rejected" | "removed" | "dismissed";

const withStatus = (path: string, status: DoneStatus) => `${path}?statut=${status}`;

/**
 * Approuver ou rejeter une proposition (spec §8.4, §8.5), puis ouvrir la suivante de la file, ou la
 * file vide « Plus rien à relire ». Les règles sont rejouées ici : une action serveur peut être
 * appelée directement.
 * MAQUETTE : écrit dans les données en mémoire ; le plan 3 le fera en une transaction (`lib/moderation`).
 */
export async function reviewProposal(
  proposalId: string,
  previous: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const user = await requireModerator(`/moderation/${proposalId}`);
  const proposal = proposalStore.get(proposalId);
  if (!proposal) notFound();

  const t = await getTranslations("moderation.review.errors");
  const fail = (error: string): ModerationFormState => ({ error, attempt: previous.attempt + 1 });

  const decision = parseDecision(formData.get("decision"));
  if (!decision) return fail(t("notPending"));
  const checked = checkReview({ proposal, reviewerId: user.id, decision, note: formData.get("note") });
  if (!checked.ok) return fail(t(checked.error, { max: String(NOTE_MAX) }));

  if (decision === "approve") {
    const song = proposal.songId ? getSong(proposal.songId) : undefined;
    if (proposal.songId && !song) return fail(t("songGone"));
    songStore.publish(
      songFromProposal(proposal.payload, song, {
        songId: `s-${crypto.randomUUID()}`,
        artistId: () => `a-${crypto.randomUUID()}`,
      }),
    );
  }
  proposalStore.review(proposal.id, { status: decision === "approve" ? "approved" : "rejected", note: checked.note });
  revalidatePath("/", "layout");

  const next = nextInQueue(pendingProposals(), proposal, compareProposals);
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
  const report = getReport(reportId);
  if (!report) notFound();

  const t = await getTranslations("moderation.report.errors");
  const fail = (error: string): ModerationFormState => ({ error, attempt: previous.attempt + 1 });

  const action = parseReportAction(formData.get("action"));
  if (!action) return fail(t("notOpen"));
  const checked = checkReportAction({
    report,
    action,
    note: formData.get("note"),
    songPublished: getSong(report.songId) !== undefined,
  });
  if (!checked.ok) return fail(t(checked.error, { max: String(NOTE_MAX) }));

  if (action === "remove") songStore.remove(report.songId);
  resolveReport(report.id, { status: statusAfter(action), note: checked.note, by: user.id });
  revalidatePath("/", "layout");

  if (action === "correct") redirect(`/contribuer/${report.songId}`);
  const next = nextInQueue(openReports(), report, compareReports);
  redirect(
    withStatus(
      next ? `/moderation/signalements/${next.id}` : "/moderation/signalements",
      action === "remove" ? "removed" : "dismissed",
    ),
  );
}
