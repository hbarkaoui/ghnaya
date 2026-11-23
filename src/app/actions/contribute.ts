"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { canContribute } from "@/lib/auth/permissions";
import { artistCandidates } from "@/lib/catalog/artistSuggestions";
import { getSongById } from "@/lib/catalog/queries";
import { resolveArtists } from "@/lib/contribution/artists";
import { isSameAsSong } from "@/lib/contribution/correction";
import { contributionsHref, loginHref } from "@/lib/contribution/routes";
import {
  proposalInputFromFormData,
  validateProposal,
  type ProposalErrors,
  type ProposalField,
} from "@/lib/contribution/validate";
import { db } from "@/lib/db/client";
import { allowRevision, REVISION_LIMIT } from "@/lib/moderation/limits";
import { hasPendingRevision } from "@/lib/moderation/queries";
import { createRevision } from "@/lib/moderation/revisionWrite";
import { getCurrentUser } from "@/lib/session";

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
 * Envoie une proposition (spec §8.3) : un ajout (`songId` nul) ou une correction. Le serveur refuse ce que
 * le formulaire aurait dû empêcher, dans cet ordre : pas de session (la connexion), adresse non vérifiée,
 * chanson retirée ou inconnue, correction déjà en attente, formulaire invalide, correction sans changement,
 * limite du jour (10 propositions, comptées seulement pour un envoi valide). Une proposition acceptée mène à
 * Mes contributions, où elle apparaît « En attente » sous la confirmation.
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

  if (!canContribute(user)) return fail({ form: { code: "emailNotVerified" } });

  // Une chanson se corrige par son UUID : un autre identifiant ne désigne aucune chanson.
  const song = songId ? await getSongById(songId) : null;
  if (songId && !song) return fail({ form: { code: "songMissing" } });
  if (song && (await hasPendingRevision(user.id, song.id))) return fail({ form: { code: "pendingExists" } });

  const result = validateProposal(proposalInputFromFormData(formData));
  if (!result.ok) return fail(result.errors);

  const artists = resolveArtists(result.draft.artists, await artistCandidates(result.draft.artists));
  const payload = { ...result.draft, artists };
  if (song && isSameAsSong(payload, song)) return fail({ form: { code: "unchanged" } });

  if (!(await allowRevision(user.id))) {
    return fail({ form: { code: "tooMany", values: { max: String(REVISION_LIMIT.limit) } } });
  }

  const created = await createRevision(db, { authorId: user.id, songId: song?.id ?? null, payload });
  if (!created.ok) return fail({ form: { code: created.error } });
  revalidatePath("/mes-contributions");
  redirect(contributionsHref({ sent: created.id }));
}
