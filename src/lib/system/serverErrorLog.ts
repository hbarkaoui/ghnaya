// Plan 5, tâche 2 : une erreur serveur = une ligne JSON dans le journal (spec §12, identifiant de corrélation).
// La référence est le `digest` que Next envoie à la page d'erreur, qui l'affiche (ErrorView) : une personne qui
// la donne au support permet de retrouver la ligne (filtre Vercel : "event":"server_error").
// Ni chemin réel (codes d'invitation, identifiants), ni en-têtes, ni cookies : seulement le motif de la route.
import { errorDigest } from "./actionFailure";

export interface ErrorRequest {
  method: string;
}

export interface ErrorContext {
  /** Motif de la route, par exemple `/chanson/[id]`. */
  routePath: string;
  /** `render`, `route`, `action` ou `proxy`. */
  routeType: string;
}

const STACK_LINES = 5;

export function serverErrorLogLine(err: unknown, request: ErrorRequest, context: ErrorContext, now = new Date()): string {
  const error = err instanceof Error ? err : null;
  return JSON.stringify({
    level: "error",
    event: "server_error",
    time: now.toISOString(),
    digest: errorDigest(err),
    route: context.routePath,
    routeType: context.routeType,
    method: request.method,
    name: error?.name ?? null,
    message: error ? error.message : String(err),
    stack: error?.stack?.split("\n").slice(0, STACK_LINES) ?? [],
  });
}
