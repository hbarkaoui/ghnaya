// Plan 4, tâche 3 : un générateur de translittération, réel (Claude) ou factice (tests, développement).
import type { Dialect } from "@/types/catalog";

export interface TranslitInput {
  lyrics: string;
  dialect: Dialect;
}

/** Une génération : le texte brut du service, non vérifié. Lève une erreur en cas d'échec ou d'annulation. */
export type TranslitGenerator = (input: TranslitInput, signal: AbortSignal) => Promise<string>;
