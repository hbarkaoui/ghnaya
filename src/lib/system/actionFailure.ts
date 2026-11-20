/**
 * Échec d'une action serveur appelée depuis le client (pur, sans React ni Next.js) :
 *  - `network` : la requête n'a pas abouti (réseau coupé, serveur injoignable) ou le navigateur se sait
 *    hors ligne ;
 *  - `server` : le serveur a répondu par une erreur, ou par une réponse inattendue.
 * Le hook `useActionGuard` (components/system) en fait un toast d'erreur.
 */
export type ActionFailureKind = "network" | "server";

/** Résultat d'une action gardée qui a échoué : le toast est déjà affiché, l'appelant n'a rien à dire de plus. */
export const ACTION_FAILED: unique symbol = Symbol("ACTION_FAILED");
export type ActionFailed = typeof ACTION_FAILED;

/**
 * Messages des erreurs de fetch quand la requête n'aboutit pas : Chrome (« Failed to fetch »),
 * Safari (« Load failed »), Firefox (« NetworkError when… »), Node (« fetch failed »).
 */
const FETCH_FAILURE = /failed to fetch|load failed|networkerror|network request failed|fetch failed/i;

export function actionFailureKind(error: unknown, online: boolean): ActionFailureKind {
  if (!online) return "network";
  return error instanceof TypeError && FETCH_FAILURE.test(error.message) ? "network" : "server";
}

/** Référence (`digest`) d'une erreur venue du serveur, à donner au support ; null s'il n'y en a pas. */
export function errorDigest(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("digest" in error)) return null;
  const { digest } = error;
  return typeof digest === "string" && digest.trim() !== "" ? digest.trim() : null;
}

/**
 * Attend une action appelée à la main (`await settle(addSong(…), onFailure)`). En cas d'échec,
 * `onFailure` est appelé et le résultat vaut ACTION_FAILED au lieu d'une promesse rejetée. Ce que
 * `onFailure` relance (redirection ou « introuvable » de Next.js) traverse.
 */
export async function settle<T>(promise: Promise<T>, onFailure: (error: unknown) => void): Promise<T | ActionFailed> {
  try {
    return await promise;
  } catch (error) {
    onFailure(error);
    return ACTION_FAILED;
  }
}

/**
 * Action pour `useActionState` : en cas d'échec, `onFailure` est appelé et l'état précédent est gardé,
 * au lieu de lever l'erreur vers la page d'erreur (la saisie et les messages restent à l'écran).
 */
export function keepStateOnFailure<S, P>(
  action: (state: S, payload: P) => Promise<S>,
  onFailure: (error: unknown) => void,
): (state: S, payload: P) => Promise<S> {
  return async (state, payload) => {
    try {
      return await action(state, payload);
    } catch (error) {
      onFailure(error);
      return state;
    }
  };
}
