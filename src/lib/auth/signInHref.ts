/**
 * Lien vers la connexion, avec la page où revenir ensuite (`/connexion?retour=`).
 * Seul un chemin interne est accepté, pour éviter les redirections vers un autre site (IA, stratégie
 * d'URL). La page de connexion et l'`AuthGate` (tâche 16) relisent `retour` avec la même règle.
 */
export const SIGN_IN_PATH = "/connexion";

/** Un chemin du site : il commence par « / », mais ni par « // » ni par « /\ » (adresses externes). */
export const isInternalPath = (path: string): boolean => /^\/(?![/\\])/.test(path);

export function signInHref(returnTo: string): string {
  const retour = isInternalPath(returnTo) ? returnTo : "/";
  return `${SIGN_IN_PATH}?${new URLSearchParams({ retour }).toString()}`;
}
