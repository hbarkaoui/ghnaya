// Plan 4, tâche 4 : la génération à la demande (spec §7). Droits, verrou, attente d'une génération en
// cours, plafond global, génération alignée sous délai, écriture sous le verrou.
import { canGenerateTranslit } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/auth/types";
import { hitRateLimit } from "@/lib/ratelimit/fixedWindow";
import { generateAligned } from "./generate";
import type { TranslitGenerator } from "./generator";
import type { TranslitResult } from "./state";
import { claimTranslit, finishTranslit, readTranslit, releaseTranslit, type TranslitRow } from "./store";

/** Plafond global (écart 4) : une seule clé pour toute la plateforme, fenêtre du jour UTC. */
export const TRANSLIT_LIMIT_KEY = "translit:global";
const DAY_SECONDS = 24 * 60 * 60;
const WAIT_MS = 35_000;
const POLL_MS = 1_000;

export interface TranslitServiceOptions {
  /** `null` : service indisponible (production sans clé), la réponse est « failed ». */
  generator: TranslitGenerator | null;
  dailyLimit: number;
  timeoutMs?: number;
  /** Attente d'une génération lancée par une autre demande (écart 2). */
  waitMs?: number;
  pollMs?: number;
}

const FAILED: TranslitResult = { ok: false, reason: "failed" };

function readyResult(row: TranslitRow | null): TranslitResult | null {
  if (!row?.lyricsTranslit || (row.translitStatus !== "auto" && row.translitStatus !== "reviewed")) return null;
  return { ok: true, text: row.lyricsTranslit, status: row.translitStatus };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Relit la chanson jusqu'au résultat d'une autre demande ; « failed » si elle échoue ou tarde trop. */
async function waitForTranslit(songId: string, waitMs: number, pollMs: number): Promise<TranslitResult> {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    await sleep(pollMs);
    const row = await readTranslit(songId);
    const ready = readyResult(row);
    if (ready) return ready;
    if (row?.translitStatus !== "generating") return FAILED;
  }
  return FAILED;
}

/**
 * `options` peut être une fonction : elle n'est appelée qu'une fois les droits vérifiés. L'action y lit la
 * configuration, si bien qu'une configuration invalide n'empêche ni un visiteur de voir la translittération
 * existante ou l'invitation à se connecter, ni personne de lire une translittération prête.
 */
export async function requestSongTranslit(
  songId: string,
  user: CurrentUser | null,
  optionsOrLoader: TranslitServiceOptions | (() => TranslitServiceOptions),
): Promise<TranslitResult> {
  const row = await readTranslit(songId);
  if (!row) return FAILED;
  const existing = readyResult(row);
  if (existing) return existing;
  if (!canGenerateTranslit(user)) return { ok: false, reason: "signin" };
  const options = typeof optionsOrLoader === "function" ? optionsOrLoader() : optionsOrLoader;
  if (!options.generator) return FAILED;

  const claim = await claimTranslit(songId);
  if (!claim) {
    // Une autre demande génère, ou vient de finir (la chanson est déjà prête).
    return readyResult(await readTranslit(songId)) ?? waitForTranslit(songId, options.waitMs ?? WAIT_MS, options.pollMs ?? POLL_MS);
  }

  // Toute erreur après la prise (base, plafond) doit lever le verrou, sinon la chanson reste « generating »
  // jusqu'à la reprise des 2 minutes. `releaseTranslit` est sans effet si une écriture a déjà levé le verrou.
  try {
    const { allowed } = await hitRateLimit(TRANSLIT_LIMIT_KEY, options.dailyLimit, DAY_SECONDS);
    if (!allowed) return { ok: false, reason: "limit" };

    const generation = await generateAligned(options.generator, { lyrics: claim.lyrics, dialect: claim.dialect }, options.timeoutMs);
    if (generation.ok && (await finishTranslit(songId, claim.startedAt, generation.text))) {
      return { ok: true, text: generation.text, status: "auto" };
    }
    if (generation.ok) {
      // Résultat jeté (écart 8) : la chanson a changé pendant la génération (révision approuvée, import).
      console.warn(`[translit] chanson ${songId} : résultat jeté, la chanson a changé pendant la génération`);
    } else {
      const detail = generation.reason === "error" ? ` : ${generation.detail}` : "";
      console.error(`[translit] chanson ${songId} : échec de la génération (${generation.reason}${detail})`);
    }
    await releaseTranslit(songId, claim.startedAt);
    return readyResult(await readTranslit(songId)) ?? FAILED;
  } finally {
    // Sans effet quand le verrou est déjà levé ; une erreur du relâchement ne masque pas l'erreur d'origine.
    await releaseTranslit(songId, claim.startedAt).catch(() => undefined);
  }
}
