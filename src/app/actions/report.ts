"use server";

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { getSongById } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { allowReport } from "@/lib/moderation/limits";
import { createReport } from "@/lib/moderation/reportWrite";
import { clientIp } from "@/lib/ratelimit/clientIp";
import {
  reportInputFromFormData,
  validateReport,
  type ReportErrors,
  type ReportField,
} from "@/lib/report/validate";
import { getCurrentUser } from "@/lib/session";
import { isolate } from "@/lib/text/isolate";

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
    // Messages en texte brut (récapitulatif, champ) : l'adresse d'exemple <ltr> est isolée par des
    // caractères Unicode, l'équivalent d'un fragment dir="ltr" dans la phrase arabe.
    out[field] = t.markup(error.code, { ...values, ltr: (chunks) => isolate(chunks) });
  }
  return out;
}

/**
 * Envoie un signalement (spec §9) : ouvert à tous. Un visiteur laisse une adresse e-mail ; pour un membre, le
 * compte suffit (l'auteur vient de la session, jamais du formulaire). Le serveur rejoue la validation, puis
 * applique la limite de 10 signalements par jour et par adresse IP, comptés pour un envoi valide seulement.
 */
export async function submitReport(songId: string, previous: ReportState, formData: FormData): Promise<ReportState> {
  const attempt = previous.status === "editing" ? previous.attempt + 1 : 1;
  const fail = async (errors: ReportErrors): Promise<ReportState> => ({
    status: "editing",
    errors: await translate(errors),
    attempt,
  });

  const song = await getSongById(songId);
  if (!song) return fail({ form: { code: "songMissing" } });

  const user = await getCurrentUser();
  const result = validateReport(reportInputFromFormData(formData), { emailRequired: !user });
  if (!result.ok) return fail(result.errors);
  if (!(await allowReport(clientIp(await headers())))) return fail({ form: { code: "tooMany" } });

  await createReport(db, { songId: song.id, reporterId: user?.id ?? null, ...result.report });
  return { status: "sent", sentTo: result.report.contactEmail };
}
