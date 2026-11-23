import { checkEmail } from "@/lib/auth/email";
import { normalizeMultiline } from "@/lib/contribution/validate";
import { REPORT_REASONS, type ReportReason } from "@/types/report";

/**
 * Validation du formulaire « Signaler » (spec §9), en fonctions pures : l'action serveur la rejoue à
 * chaque envoi, et le plan 3 la reprendra dans son schéma zod. Les erreurs sont des codes, traduits
 * par l'appelant dans la langue de l'interface (messages `reportForm.errors.*`).
 *
 * Un visiteur doit laisser une adresse e-mail pour qu'on puisse lui répondre ; un membre connecté
 * n'en donne pas, son compte suffit (une adresse envoyée quand même est ignorée).
 */

/** Assez pour dire ce qui ne va pas (« Publicité. »), pas assez pour un simple « x ». */
export const DETAILS_MIN_LENGTH = 10;
export const DETAILS_MAX_LENGTH = 2000;

/** Ce que le formulaire envoie, tel quel. */
export interface ReportInput {
  reason: string;
  details: string;
  email: string;
}

/** `form` porte les erreurs qui ne visent aucun champ (chanson disparue entre-temps). */
export type ReportField = "reason" | "details" | "email" | "form";

export type ReportErrorCode =
  | "reasonMissing"
  | "detailsMissing"
  | "detailsTooShort"
  | "detailsTooLong"
  | "emailMissing"
  | "emailInvalid"
  | "songMissing"
  | "tooMany";

export interface ReportError {
  code: ReportErrorCode;
  values?: Record<string, string>;
}

export type ReportErrors = Partial<Record<ReportField, ReportError>>;

/** Signalement validé et normalisé ; l'action y ajoute la chanson et l'auteur. */
export interface ReportDraft {
  reason: ReportReason;
  details: string;
  contactEmail: string | null;
}

export type ReportValidation = { ok: true; report: ReportDraft } | { ok: false; errors: ReportErrors };

export const isReportReason = (value: string): value is ReportReason =>
  (REPORT_REASONS as readonly string[]).includes(value);

function checkDetails(details: string): ReportError | null {
  if (details === "") return { code: "detailsMissing" };
  if (details.length < DETAILS_MIN_LENGTH) return { code: "detailsTooShort", values: { min: String(DETAILS_MIN_LENGTH) } };
  if (details.length > DETAILS_MAX_LENGTH) return { code: "detailsTooLong", values: { max: String(DETAILS_MAX_LENGTH) } };
  return null;
}

export function validateReport(input: ReportInput, { emailRequired }: { emailRequired: boolean }): ReportValidation {
  const errors: ReportErrors = {};
  const details = normalizeMultiline(input.details).trim();

  if (!isReportReason(input.reason)) errors.reason = { code: "reasonMissing" };

  const detailsError = checkDetails(details);
  if (detailsError) errors.details = detailsError;

  let contactEmail: string | null = null;
  if (emailRequired) {
    const email = checkEmail(input.email);
    if (email.ok) contactEmail = email.email;
    else errors.email = { code: email.reason === "missing" ? "emailMissing" : "emailInvalid" };
  }

  if (Object.keys(errors).length > 0 || !isReportReason(input.reason)) return { ok: false, errors };
  return { ok: true, report: { reason: input.reason, details, contactEmail } };
}

const text = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

/** Lit le formulaire de /signaler/[songId] (pas de champ `email` pour un membre connecté). */
export function reportInputFromFormData(data: FormData): ReportInput {
  return { reason: text(data, "reason"), details: text(data, "details"), email: text(data, "email") };
}
