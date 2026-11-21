import { SIGN_IN_PATH } from "./returnPath";

/**
 * Adresse à laquelle le lien vient de partir, pour « Vérifiez vos e-mails ». Gardée quelques minutes dans
 * un cookie limité à /connexion, jamais dans l'URL (historique, journaux).
 */
export const MAGIC_LINK_SENT_COOKIE = "ghnaya-magic-link-sent";
export const MAGIC_LINK_SENT_MAX_AGE = 15 * 60;
export const MAGIC_LINK_SENT_COOKIE_OPTIONS = {
  path: SIGN_IN_PATH,
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: MAGIC_LINK_SENT_MAX_AGE,
};
