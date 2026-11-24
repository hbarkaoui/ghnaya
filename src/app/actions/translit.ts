"use server";

import { isUuid } from "@/lib/db/uuid";
import { getCurrentUser } from "@/lib/session";
import { translitDailyLimit, translitGenerator } from "@/lib/translit/config";
import { requestSongTranslit } from "@/lib/translit/service";
import type { TranslitResult } from "@/lib/translit/state";

/**
 * Translittération d'une chanson, générée à la demande (spec §7, plan 4). La session vient du serveur,
 * jamais du client : un visiteur reçoit « signin » et ne déclenche rien. Ne lève pas d'erreur pour un
 * identifiant mal formé. La configuration n'est lue qu'après le contrôle des droits : invalide
 * (TRANSLIT_PROVIDER, TRANSLIT_DAILY_LIMIT), elle lève pour un membre une erreur qui la nomme, et l'écran
 * affiche « Réessayer » ; un visiteur reçoit toujours l'invitation à se connecter.
 */
export async function requestTranslit(songId: string): Promise<TranslitResult> {
  if (typeof songId !== "string" || !isUuid(songId)) return { ok: false, reason: "failed" };
  const user = await getCurrentUser();
  return requestSongTranslit(songId, user, () => ({ generator: translitGenerator(), dailyLimit: translitDailyLimit() }));
}
