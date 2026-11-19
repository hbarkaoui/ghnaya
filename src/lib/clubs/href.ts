export type ClubSection = "membres" | "reglages";

/** Chemin d'un club (sous-onglet Playlists) ou de l'une de ses sections. Le slug peut contenir des lettres arabes. */
export const clubHref = (slug: string, section?: ClubSection): string =>
  `/clubs/${encodeURIComponent(slug)}${section ? `/${section}` : ""}`;

/**
 * Renvoi vers la connexion, qui ramène ensuite à `retour` (chemin interne).
 * La tâche 16 remplacera ces renvois par `AuthGate`.
 */
export const signInHref = (retour: string): string => `/connexion?retour=${encodeURIComponent(retour)}`;
