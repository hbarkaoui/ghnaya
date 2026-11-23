// Plan 4, tâche 3 : générateur et plafond, lus dans l'environnement (écart 7). Une valeur invalide lève une
// erreur qui nomme la variable, plutôt que d'être ignorée en silence.
import { anthropicGenerator } from "./anthropic";
import { fakeGenerator } from "./fake";
import type { TranslitGenerator } from "./generator";

export const DEFAULT_TRANSLIT_DAILY_LIMIT = 300;

/**
 * `TRANSLIT_PROVIDER` : `anthropic`, `fake` ou `none`. Sans valeur : Claude si `ANTHROPIC_API_KEY` est là,
 * sinon le générateur factice hors production et aucun générateur en production (réponse « failed »).
 */
export function translitGenerator(env: NodeJS.ProcessEnv = process.env): TranslitGenerator | null {
  const provider =
    env.TRANSLIT_PROVIDER?.trim() || (env.ANTHROPIC_API_KEY ? "anthropic" : env.NODE_ENV === "production" ? "none" : "fake");
  if (provider === "fake") return fakeGenerator;
  if (provider === "none") return null;
  if (provider === "anthropic") return anthropicGenerator({ model: env.TRANSLIT_MODEL?.trim() || undefined });
  throw new Error(`TRANSLIT_PROVIDER invalide : « ${provider} ». Valeurs possibles : anthropic, fake, none.`);
}

/** `TRANSLIT_DAILY_LIMIT` : générations par jour (UTC), pour toute la plateforme. Vide : 300. */
export function translitDailyLimit(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.TRANSLIT_DAILY_LIMIT?.trim();
  if (!raw) return DEFAULT_TRANSLIT_DAILY_LIMIT;
  if (!/^\d+$/.test(raw)) throw new Error(`TRANSLIT_DAILY_LIMIT invalide : « ${raw} ». Attendu : un entier positif ou nul.`);
  return Number(raw);
}
