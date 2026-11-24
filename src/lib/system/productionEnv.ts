// Plan 5, tâche 1 : la configuration de production, vérifiée au démarrage (src/instrumentation.ts) et par
// `pnpm env:check`. Une variable manquante ou dangereuse doit empêcher le démarrage, au lieu de se découvrir
// à la première connexion. Les messages nomment les variables, jamais leurs valeurs : ils vont au journal.
// Pas de `server-only` : `pnpm env:check` lit ce module.
import { isLocalUrl, mailTransport } from "@/lib/mail/transport";
import { trustedProxyHops } from "@/lib/ratelimit/clientIp";
import { translitDailyLimit, translitProvider } from "@/lib/translit/config";

/** Valeur d'exemple de `.env.example` : une configuration recopiée sans être changée. */
export const EXAMPLE_AUTH_SECRET = "remplacer-par-un-secret-de-32-caracteres-au-moins";

const reason = (e: unknown) => (e instanceof Error ? e.message : String(e));
const filled = (value: string | undefined) => Boolean(value?.trim());

/** Problèmes de la configuration, en français, un par ligne ; vide hors production ou si tout va bien. */
export function productionEnvProblems(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV !== "production") return [];
  const problems: string[] = [];

  if (!filled(env.DATABASE_URL)) problems.push("DATABASE_URL manque : l'URL poolée de la base.");

  const secret = env.BETTER_AUTH_SECRET?.trim() ?? "";
  if (secret.length < 32 || secret === EXAMPLE_AUTH_SECRET) {
    problems.push("BETTER_AUTH_SECRET manque, fait moins de 32 caractères ou reprend l'exemple : openssl rand -base64 32.");
  }

  const authUrl = env.BETTER_AUTH_URL?.trim();
  const local = isLocalUrl(authUrl);
  if (!authUrl) {
    problems.push("BETTER_AUTH_URL manque : l'adresse publique du site (https://…).");
  } else {
    let protocol: string | null = null;
    try {
      protocol = new URL(authUrl).protocol;
    } catch {
      problems.push("BETTER_AUTH_URL invalide : une adresse complète est attendue (https://…).");
    }
    if (protocol !== null && protocol !== "https:" && !local) {
      problems.push("BETTER_AUTH_URL doit être en https hors de localhost : les cookies de session sont « secure ».");
    }
  }

  try {
    if (mailTransport(env) === "smtp" && (!filled(env.SMTP_URL) || !filled(env.MAIL_FROM))) {
      problems.push("SMTP_URL et MAIL_FROM sont nécessaires pour envoyer les liens de connexion.");
    }
  } catch (e) {
    problems.push(reason(e));
  }

  try {
    const provider = translitProvider(env);
    if (provider === "fake" && !local) {
      problems.push("TRANSLIT_PROVIDER=fake est refusé en production hors de localhost : le texte factice serait servi aux lecteurs.");
    }
    if (provider === "anthropic" && !filled(env.ANTHROPIC_API_KEY)) {
      problems.push("TRANSLIT_PROVIDER=anthropic demande ANTHROPIC_API_KEY.");
    }
  } catch (e) {
    problems.push(reason(e));
  }

  for (const check of [() => translitDailyLimit(env), () => trustedProxyHops(env)]) {
    try {
      check();
    } catch (e) {
      problems.push(reason(e));
    }
  }

  if (filled(env.GOOGLE_CLIENT_ID) !== filled(env.GOOGLE_CLIENT_SECRET)) {
    problems.push("GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET vont ensemble : définir les deux, ou aucun.");
  }

  return problems;
}

/** Lève une erreur qui liste tous les problèmes, s'il y en a. */
export function assertProductionEnv(env: NodeJS.ProcessEnv): void {
  const problems = productionEnvProblems(env);
  if (problems.length > 0) throw new Error(`Configuration de production invalide :\n- ${problems.join("\n- ")}`);
}
