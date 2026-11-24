// Plan 4, tâche 3 : une génération sous délai, avec un second essai si l'alignement est mauvais (spec §7).
import { checkAlignment } from "./align";
import type { TranslitGenerator, TranslitInput } from "./generator";

/** Le délai couvre toute la génération, second essai compris (écart 5). */
export const TRANSLIT_TIMEOUT_MS = 30_000;

/** `detail` : le message de l'erreur du générateur, pour le journal. */
export type Generation =
  | { ok: true; text: string }
  | { ok: false; reason: "misaligned" | "timeout" }
  | { ok: false; reason: "error"; detail: string };

/** Rejette dès l'annulation, même si le générateur ignore le signal. */
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/** Ne lève jamais d'erreur : l'échec est une valeur, que le service traduit en « failed ». */
export async function generateAligned(
  generator: TranslitGenerator,
  input: TranslitInput,
  timeoutMs: number = TRANSLIT_TIMEOUT_MS,
): Promise<Generation> {
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const aligned = checkAlignment(input.lyrics, await untilAborted(generator(input, signal), signal));
      if (aligned.ok) return { ok: true, text: aligned.text };
    }
    return { ok: false, reason: "misaligned" };
  } catch (error) {
    // Une erreur levée après le délai est rapportée comme dépassement : c'est presque toujours l'annulation.
    if (signal.aborted) return { ok: false, reason: "timeout" };
    return { ok: false, reason: "error", detail: error instanceof Error ? error.message : String(error) };
  }
}
