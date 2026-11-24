// Plan 5 (revue finale) : résumé d'une erreur sûr pour le journal. Pur, sans `server-only`.
// drizzle-orm enveloppe une requête échouée dans DrizzleQueryError, dont le message est
// « Failed query: <sql>\nparams: <valeurs> » : les valeurs (e-mails, codes d'invitation) ne doivent pas être journalisées.
const STACK_LINES = 5;

export interface ErrorSummary {
  name: string | null;
  /** Message sans les paramètres de requête ; `null` si l'on ne journalise pas de message. */
  message: string | null;
  /** SQLSTATE ou code réseau, lu sur l'erreur ou sa cause. */
  code: string | null;
  causeName: string | null;
  stack: string[];
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const asString = (value: unknown): string | null => (typeof value === "string" ? value : null);

function isQueryError(error: Error): boolean {
  const e = asRecord(error);
  return error.name === "DrizzleQueryError" || (e !== null && ("params" in e || "query" in e));
}

export function summarizeError(err: unknown): ErrorSummary {
  if (!(err instanceof Error)) return { name: null, message: String(err), code: null, causeName: null, stack: [] };
  const cause = asRecord(err.cause);
  const query = isQueryError(err);
  return {
    name: err.name,
    message: query ? err.message.split("\n")[0] : err.message,
    code: asString(cause?.code) ?? asString(asRecord(err)?.code),
    causeName: asString(cause?.name),
    // Seules les lignes de pile : la première ligne de `stack` reprend le message, params compris.
    stack: (err.stack ?? "")
      .split("\n")
      .filter((line) => line.startsWith("    at "))
      .slice(0, STACK_LINES),
  };
}
