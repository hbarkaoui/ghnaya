/**
 * Connexion fictive de la maquette, en attendant Auth.js (plan 2) : aucun e-mail n'est envoyé.
 * L'adresse saisie est gardée quelques minutes dans un cookie pour l'afficher sur « Vérifiez vos e-mails »
 * (jamais dans l'URL : une adresse n'a rien à faire dans l'historique ou les journaux).
 */
export const DEMO_MAGIC_LINK_COOKIE = "ghnaya-demo-magic-link";
export const DEMO_MAGIC_LINK_MAX_AGE = 10 * 60;

/** Délais simulés, pour voir les états « envoi en cours » et « connexion à Google ». */
export const MAGIC_LINK_DELAY_MS = 1200;
export const GOOGLE_DELAY_MS = 800;

export const simulateDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
