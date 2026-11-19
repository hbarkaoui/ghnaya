/**
 * Classes partagées des boutons et des champs (tokens uniquement), pour les formulaires des clubs.
 * La tâche 13 (TextField, FormError…) pourra les reprendre dans de vrais composants.
 */
const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 font-medium transition-colors duration-(--duration-fast) disabled:cursor-not-allowed disabled:opacity-60";

export const BUTTON_PRIMARY = `${BUTTON} bg-accent text-accent-ink hover:bg-accent-hover`;
export const BUTTON_SECONDARY = `${BUTTON} border border-line text-ink hover:bg-well`;
export const BUTTON_DANGER = `${BUTTON} bg-error text-page hover:opacity-90`;
export const BUTTON_DANGER_OUTLINE = `${BUTTON} border border-error text-error hover:bg-error-soft`;

export const FIELD =
  "min-h-11 w-full rounded-md border border-line bg-card px-3 text-base text-ink placeholder:text-ink-3 aria-invalid:border-error";
export const LABEL = "block font-medium";
export const FIELD_ERROR = "mt-1.5 text-sm text-error";
export const FIELD_HINT = "mt-1.5 text-sm text-ink-2";
