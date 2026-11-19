/**
 * Contrôle de l'adresse saisie pour le lien magique : volontairement simple (une partie locale sans espace,
 * un domaine à points avec une extension d'au moins deux lettres). Le vrai juge reste l'envoi de l'e-mail.
 */
export type EmailCheck = { ok: true; email: string } | { ok: false; reason: "missing" | "invalid" };

/** État du formulaire du lien magique : l'adresse saisie est rendue pour rester dans le champ après une erreur. */
export type MagicLinkState = { email: string; error: null | "missing" | "invalid" };

const MAX_LENGTH = 254;
/** Partie locale : pas d'espace, ni de séparateur de liste (`,` `;`), ni de caractère réservé. */
const LOCAL = /^[^\s@,;:<>()[\]"\\]+$/;
/** Étiquette de domaine : lettres, chiffres et tirets, sans tiret au bord. */
const LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const TLD = /^[a-z][a-z0-9-]*[a-z0-9]$/;

/** Adresse normalisée (sans espaces autour, en minuscules, comme Auth.js) ou raison du refus. */
export function checkEmail(raw: unknown): EmailCheck {
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (email === "") return { ok: false, reason: "missing" };
  if (email.length > MAX_LENGTH) return { ok: false, reason: "invalid" };

  const parts = email.split("@");
  if (parts.length !== 2) return { ok: false, reason: "invalid" };
  const [local, domain] = parts;
  const labels = domain.split(".");
  const valid =
    LOCAL.test(local) && labels.length >= 2 && labels.every((label) => LABEL.test(label)) && TLD.test(labels.at(-1)!);

  return valid ? { ok: true, email } : { ok: false, reason: "invalid" };
}
