// Plan 4, tâche 3 : translittération par Claude (spec §7), avec le SDK officiel.
import Anthropic from "@anthropic-ai/sdk";
import type { TranslitGenerator } from "./generator";
import { TRANSLIT_SYSTEM, translitUserMessage } from "./prompt";

/** Choisi le 23/11/2026 ; `TRANSLIT_MODEL` en met un autre sans toucher au code. */
export const DEFAULT_TRANSLIT_MODEL = "claude-opus-5-5";

/**
 * - Effort bas : la tâche est mécanique, et le délai de 30 s doit tenir (thinking adaptatif par défaut).
 * - `fallbacks: "default"` : si un classifieur de sécurité refuse à tort des paroles, l'API rejoue la demande
 *   sur un autre modèle dans le même appel.
 * - Pas de nouvelle tentative du SDK : `generateAligned` décide (un essai de plus sur un mauvais alignement).
 */
export function anthropicGenerator(options: { client?: Anthropic; model?: string } = {}): TranslitGenerator {
  // Client créé au premier appel : choisir le générateur (config.ts) ne lit ni clé ni profil.
  let client = options.client;
  const model = options.model ?? DEFAULT_TRANSLIT_MODEL;
  return async ({ lyrics, dialect }, signal) => {
    client ??= new Anthropic({ maxRetries: 0 });
    const response = await client.beta.messages.create(
      {
        model,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: TRANSLIT_SYSTEM,
        messages: [{ role: "user", content: translitUserMessage(lyrics, dialect) }],
      },
      { signal },
    );
    if (response.stop_reason !== "end_turn") throw new Error(`Translittération interrompue : ${response.stop_reason}`);
    return response.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  };
}
