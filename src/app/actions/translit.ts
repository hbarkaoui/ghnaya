"use server";

import type { TranslitResult } from "@/lib/translit/state";
import {
  DAILY_LIMIT_REACHED,
  FAIL_FIRST_ATTEMPT,
  SIMULATED_DELAY_MS,
  TRANSLIT_TEXTS,
} from "@/mocks/translit";

const attempts = new Map<string, number>();

/**
 * Génère la translittération d'une chanson à la demande (spec §7).
 * MAQUETTE : simule le délai, l'échec du premier essai et la limite quotidienne avec des textes
 * préparés. Le plan 4 remplacera ce corps par l'appel au modèle de langage, avec verrou en base,
 * validation de l'alignement des lignes et plafond quotidien.
 */
export async function requestTranslit(songId: string): Promise<TranslitResult> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  if (DAILY_LIMIT_REACHED.has(songId)) return { ok: false, reason: "limit" };

  const attempt = (attempts.get(songId) ?? 0) + 1;
  attempts.set(songId, attempt);
  if (FAIL_FIRST_ATTEMPT.has(songId) && attempt === 1) return { ok: false, reason: "failed" };

  const text = TRANSLIT_TEXTS[songId];
  return text ? { ok: true, text, status: "auto" } : { ok: false, reason: "failed" };
}
