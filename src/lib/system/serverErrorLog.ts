// Plan 5, tâche 2 : une erreur serveur = une ligne JSON dans le journal (spec §12, identifiant de corrélation).
// La référence est le `digest` que Next envoie à la page d'erreur, qui l'affiche (ErrorView) : une personne qui
// la donne au support permet de retrouver la ligne (filtre Vercel : "event":"server_error").
// Ni chemin réel (codes d'invitation, identifiants), ni en-têtes, ni cookies : seulement le motif de la route.
import { errorDigest } from "./actionFailure";
import { summarizeError } from "./errorSummary";

export interface ErrorRequest {
  method: string;
}

export interface ErrorContext {
  /** Motif de la route, par exemple `/chanson/[id]`. */
  routePath: string;
  /** `render`, `route`, `action` ou `proxy`. */
  routeType: string;
}

export function serverErrorLogLine(err: unknown, request: ErrorRequest, context: ErrorContext, now = new Date()): string {
  const summary = summarizeError(err);
  return JSON.stringify({
    level: "error",
    event: "server_error",
    time: now.toISOString(),
    digest: errorDigest(err),
    route: context.routePath,
    routeType: context.routeType,
    method: request.method,
    name: summary.name,
    message: summary.message,
    code: summary.code,
    causeName: summary.causeName,
    stack: summary.stack,
  });
}

/**
 * Échec rattrapé dans une action (le formulaire affiche son propre message, Next ne journalise rien).
 * Sans message : celui d'une requête porte ses paramètres, celui d'un envoi d'e-mail peut citer le destinataire.
 */
export function actionErrorLogLine(action: string, err: unknown, now = new Date()): string {
  const summary = summarizeError(err);
  return JSON.stringify({
    level: "error",
    event: "action_error",
    time: now.toISOString(),
    action,
    name: summary.name,
    code: summary.code,
    causeName: summary.causeName,
  });
}
