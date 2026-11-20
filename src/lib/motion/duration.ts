/**
 * Durées de mouvement lues dans les tokens (`--duration-*` de design-tokens.css), pour que les minuteries
 * JavaScript (démontage après une sortie animée) restent alignées sur le CSS. Quand l'utilisateur
 * réduit les animations, les tokens valent 0ms : les minuteries tombent alors à 0 d'elles-mêmes.
 */

export type MotionDuration = "--duration-instant" | "--duration-fast" | "--duration-normal" | "--duration-slow" | "--duration-slower";

/** « 250ms » → 250, « 0.25s » → 250, « 0 » → 0 ; null pour une valeur absente, négative ou sans unité. */
export function parseCssDuration(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "0") return 0;
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(trimmed);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] === "s" ? Math.round(amount * 1000) : amount;
}

/** Valeur d'un token de durée en millisecondes, lue sur la racine du document (côté client seulement). */
export function readMotionDuration(token: MotionDuration): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token);
  return parseCssDuration(value) ?? 0;
}
