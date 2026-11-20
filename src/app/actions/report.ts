"use server";

import { getLocale, getTranslations } from "next-intl/server";
import {
  reportInputFromFormData,
  validateReport,
  type ReportErrors,
  type ReportField,
} from "@/lib/report/validate";
import { getCurrentUser } from "@/lib/session";
import { getSong } from "@/mocks/catalog";
import { addReport } from "@/mocks/reports";

/**
 * Réponse au formulaire « Signaler » : les erreurs déjà traduites, champ par champ, ou la confirmation.
 * `sentTo` est l'adresse laissée par un visiteur, rappelée dans la confirmation (`null` pour un membre).
 */
export type ReportState =
  | { status: "editing"; errors: Partial<Record<ReportField, string>>; attempt: number }
  | { status: "sent"; sentTo: string | null };

/** Nombres dans les messages : « 2 000 » en français, chiffres occidentaux en arabe. */
const numberFormat = (locale: string) => new Intl.NumberFormat(locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR");

async function translate(errors: ReportErrors): Promise<Partial<Record<ReportField, string>>> {
  const [t, locale] = await Promise.all([getTranslations("reportForm.errors"), getLocale()]);
  const format = numberFormat(locale);
  const out: Partial<Record<ReportField, string>> = {};
  for (const [field, error] of Object.entries(errors) as [ReportField, NonNullable<ReportErrors[ReportField]>][]) {
    const values = Object.fromEntries(Object.entries(error.values ?? {}).map(([k, v]) => [k, format.format(Number(v))]));
    out[field] = t(error.code, values);
  }
  return out;
}

/**
 * Envoie un signalement (spec §9) : ouvert à tous. Un visiteur laisse une adresse e-mail ; pour un
 * membre, le compte suffit (l'auteur vient de la session, jamais du formulaire). La validation est
 * rejouée ici, quoi que le formulaire ait vérifié.
 * MAQUETTE : enregistre en mémoire (`addReport`), lu par la file de modération (tâche 14) ; le plan 4
 * écrira une ligne `reports` en `open`, avec la limite de 10 signalements par jour et par IP.
 */
export async function submitReport(songId: string, previous: ReportState, formData: FormData): Promise<ReportState> {
  const attempt = previous.status === "editing" ? previous.attempt + 1 : 1;
  const fail = async (errors: ReportErrors): Promise<ReportState> => ({
    status: "editing",
    errors: await translate(errors),
    attempt,
  });

  const song = getSong(songId);
  if (!song) return fail({ form: { code: "songMissing" } });

  const user = await getCurrentUser();
  const result = validateReport(reportInputFromFormData(formData), { emailRequired: !user });
  if (!result.ok) return fail(result.errors);

  addReport({ songId: song.id, reporterId: user?.id ?? null, ...result.report });
  return { status: "sent", sentTo: result.report.contactEmail };
}
