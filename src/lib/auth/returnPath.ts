/**
 * Paramètre `retour` de la connexion (IA, stratégie d'URL) : la page où revenir après la connexion.
 * Il n'accepte qu'un chemin interne commençant par `/`, pour qu'un lien piégé
 * (`/connexion?retour=https://site-pirate.example`) ne renvoie jamais vers un site externe.
 */

export const SIGN_IN_PATH = "/connexion";

/** Origine fictive qui sert seulement à résoudre le chemin comme le ferait un navigateur. */
const BASE = "http://ghnaya.invalid";
const MAX_LENGTH = 2048;
/** Caractères de contrôle C0 et DEL : les navigateurs suppriment tabulations et sauts de ligne (`/\t/hôte` devient `//hôte`). */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

const isSignInPath = (pathname: string) => pathname === SIGN_IN_PATH || pathname.startsWith(`${SIGN_IN_PATH}/`);

/**
 * Chemin interne sûr, ou `fallback` (l'accueil par défaut).
 * Refuse : les URL absolues et les schémas (`https:`, `javascript:`…), `//hôte` et `/\hôte`
 * (que les navigateurs lisent comme une autre origine), les caractères de contrôle, les chemins relatifs,
 * et la connexion elle-même (boucle). Le chemin accepté est rendu normalisé (segments `..` résolus,
 * caractères non ASCII encodés), donc sans retour à la ligne possible dans l'en-tête `Location`.
 */
export function safeReturnPath(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string" || raw.length > MAX_LENGTH) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (CONTROL_CHARS.test(raw)) return fallback;

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return fallback;
  }
  // Garde-fou final : le navigateur doit résoudre ce chemin sur notre propre origine.
  if (url.origin !== BASE || isSignInPath(url.pathname)) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

const STEPS = { start: SIGN_IN_PATH, verify: `${SIGN_IN_PATH}/verifier` } as const;

/**
 * Lien vers la connexion (`start`) ou vers « Vérifiez vos e-mails » (`verify`), qui revient ensuite à
 * `retour` (validé, l'accueil sinon). Les `/` restent lisibles (`/connexion?retour=/chanson/12`) ;
 * `?`, `&` et `#` sont encodés.
 */
export function signInHref(retour: string, step: keyof typeof STEPS = "start"): string {
  const encoded = encodeURIComponent(safeReturnPath(retour)).replace(/%2F/g, "/");
  return `${STEPS[step]}?retour=${encoded}`;
}
