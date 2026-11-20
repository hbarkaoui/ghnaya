/**
 * Aperçus de développement des états système (/apercu/etats), jamais actifs en production :
 *  - lenteur simulée des listes (playlists, clubs), pour voir leurs squelettes de chargement ;
 *  - erreur dans la mise en page racine, pour voir `global-error`.
 * Les cookies sont posés par les actions de app/actions/demo.ts ; la lecture est dans demoPreviewsServer.ts.
 */
export const DEMO_LATENCY_COOKIE = "ghnaya-apercu-lenteur";
export const DEMO_LATENCIES_MS = [0, 1500, 4000] as const;
export const DEMO_LATENCY_MAX_MS = 5000;

/** Erreur de la mise en page racine : le cookie expire seul, pour que « Réessayer » finisse par réussir. */
export const ROOT_ERROR_COOKIE = "ghnaya-apercu-erreur-racine";
export const ROOT_ERROR_SECONDS = 20;

export function parseDemoLatency(value: string | undefined, production: boolean): number {
  if (production || !value) return 0;
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(Math.round(ms), DEMO_LATENCY_MAX_MS);
}
