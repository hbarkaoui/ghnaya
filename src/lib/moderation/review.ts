import { normalizeMultiline } from "@/lib/contribution/validate";
import type { ReportStatus } from "@/mocks/reports";
import type { ProposalStatus } from "@/types/proposal";

/**
 * Règles des décisions de modération (spec §4.3, §8.4, §9), rejouées par les actions serveur quoi
 * que le formulaire ait vérifié.
 */

/** Longueur maximale d'une note de modérateur. */
export const NOTE_MAX = 1000;

export const DECISIONS = ["approve", "reject"] as const;
export type Decision = (typeof DECISIONS)[number];
export const parseDecision = (value: unknown): Decision | null =>
  DECISIONS.includes(value as Decision) ? (value as Decision) : null;

export const REPORT_ACTIONS = ["remove", "correct", "dismiss"] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];
export const parseReportAction = (value: unknown): ReportAction | null =>
  REPORT_ACTIONS.includes(value as ReportAction) ? (value as ReportAction) : null;

type NoteError = "noteRequired" | "noteTooLong";
export type ReviewError = "notPending" | "ownProposal" | NoteError;
export type ReportActionError = "notOpen" | "songGone" | NoteError;
type Checked<E> = { ok: true; note: string | null } | { ok: false; error: E };

/** Note nettoyée (fins de ligne, espaces, lignes vides en trop) ; `null` si elle est vide. */
const cleanNote = (note: unknown): string | null => {
  const text = typeof note === "string" ? normalizeMultiline(note).trim() : "";
  return text === "" ? null : text;
};

function checkNote(note: unknown, required: boolean): Checked<NoteError> {
  const text = cleanNote(note);
  if (text === null) return required ? { ok: false, error: "noteRequired" } : { ok: true, note: null };
  if (text.length > NOTE_MAX) return { ok: false, error: "noteTooLong" };
  return { ok: true, note: text };
}

/**
 * Approuver ou rejeter une proposition en attente. Le rejet exige une note, que l'auteur verra dans
 * Mes contributions ; un modérateur ne peut pas approuver sa propre proposition.
 */
export function checkReview(input: {
  proposal: { authorId: string; status: ProposalStatus };
  reviewerId: string;
  decision: Decision;
  note: unknown;
}): Checked<ReviewError> {
  const { proposal, reviewerId, decision, note } = input;
  if (proposal.status !== "pending") return { ok: false, error: "notPending" };
  if (decision === "approve" && proposal.authorId === reviewerId) return { ok: false, error: "ownProposal" };
  return checkNote(note, decision === "reject");
}

/**
 * Traiter un signalement ouvert : retirer la chanson, la corriger ou classer sans suite, toujours
 * avec une note. Une chanson déjà retirée ne peut plus être retirée ni corrigée ; on classe alors.
 */
export function checkReportAction(input: {
  report: { status: ReportStatus };
  action: ReportAction;
  note: unknown;
  songPublished: boolean;
}): Checked<ReportActionError> & ({ ok: false } | { ok: true; note: string }) {
  const { report, action, note, songPublished } = input;
  if (report.status !== "open") return { ok: false, error: "notOpen" };
  if (action !== "dismiss" && !songPublished) return { ok: false, error: "songGone" };
  const checked = checkNote(note, true);
  return checked.ok ? { ok: true, note: checked.note ?? "" } : checked;
}

/** Statut du signalement après l'action : « classé sans suite » ou « traité ». */
export const statusAfter = (action: ReportAction): Exclude<ReportStatus, "open"> =>
  action === "dismiss" ? "dismissed" : "resolved";
