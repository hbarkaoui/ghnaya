"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { artistCandidates } from "@/lib/catalog/artistSuggestions";
import { resolveArtists } from "@/lib/contribution/artists";
import { isSameAsSong } from "@/lib/contribution/correction";
import { contributionsHref, loginHref } from "@/lib/contribution/routes";
import {
  proposalInputFromFormData,
  validateProposal,
  type ProposalErrors,
  type ProposalField,
} from "@/lib/contribution/validate";
import { getCurrentUser } from "@/lib/session";
import { getSong } from "@/lib/catalog/read";
import { proposalStore } from "@/mocks/proposals";

/** Réponse à un envoi refusé : les messages d'erreur, déjà traduits, champ par champ. */
export interface ContributeState {
  errors: Partial<Record<ProposalField, string>>;
  /** Numéro de l'envoi : le formulaire replace le focus sur le récapitulatif à chaque nouvel échec. */
  attempt: number;
}

/** Nombres dans les messages : « 20 000 » en français, chiffres occidentaux en arabe. */
const numberFormat = (locale: string) => new Intl.NumberFormat(locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR");

async function translate(errors: ProposalErrors): Promise<ContributeState["errors"]> {
  const [t, locale] = await Promise.all([getTranslations("contribute.errors"), getLocale()]);
  const format = numberFormat(locale);
  const out: ContributeState["errors"] = {};
  for (const [field, error] of Object.entries(errors) as [ProposalField, NonNullable<ProposalErrors[ProposalField]>][]) {
    const values = Object.fromEntries(Object.entries(error.values ?? {}).map(([k, v]) => [k, format.format(Number(v))]));
    out[field] = t(error.code, values);
  }
  return out;
}

/**
 * Envoie une proposition (spec §8.3) : un ajout (`songId` nul) ou une correction. La validation est
 * rejouée ici, quoi que le formulaire ait vérifié. Une proposition acceptée mène à Mes contributions,
 * où elle apparaît « En attente » sous la confirmation.
 * MAQUETTE : enregistre en mémoire ; le plan 3 écrira une ligne `song_revisions` en `pending`
 * (avec la limite de 10 propositions par jour et l'e-mail vérifié).
 */
export async function submitProposal(
  songId: string | null,
  previous: ContributeState,
  formData: FormData,
): Promise<ContributeState> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(songId ? `/contribuer/${songId}` : "/contribuer"));

  const fail = async (errors: ProposalErrors): Promise<ContributeState> => ({
    errors: await translate(errors),
    attempt: previous.attempt + 1,
  });

  const song = songId ? await getSong(songId) : undefined;
  if (songId && !song) return fail({ form: { code: "songMissing" } });
  if (song && proposalStore.hasPending(user.id, song.id)) return fail({ form: { code: "pendingExists" } });

  const result = validateProposal(proposalInputFromFormData(formData));
  if (!result.ok) return fail(result.errors);

  const payload = { ...result.draft, artists: resolveArtists(result.draft.artists, await artistCandidates(result.draft.artists)) };
  if (song && isSameAsSong(payload, song)) return fail({ form: { code: "unchanged" } });

  const proposal = proposalStore.add({ authorId: user.id, songId: song?.id ?? null, payload });
  revalidatePath("/mes-contributions");
  redirect(contributionsHref({ sent: proposal.id }));
}
