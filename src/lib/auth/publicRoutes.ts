/**
 * Routes de Better Auth ouvertes au navigateur (`/api/auth/*`). Tout le reste répond 404 : la demande de lien
 * passe par une Server Action limitée en base (écart 4), le profil par `lib/account`. Une liste blanche couvre
 * aussi les routes qu'ajouterait un futur plugin. Les appels `getAuth().api.*` côté serveur n'y passent pas.
 *
 * `pathname` doit venir de `new URL(request.url).pathname`, qui résout `..` : on compare des chemins exacts.
 */
const AUTH_BASE = "/api/auth";

const PUBLIC_ROUTES: { method: "GET" | "POST"; path: RegExp }[] = [
  { method: "GET", path: /^\/magic-link\/verify$/ },
  // Retour du fournisseur (Google) ; POST pour les fournisseurs en `form_post`.
  { method: "GET", path: /^\/callback\/[a-z0-9-]+$/ },
  { method: "POST", path: /^\/callback\/[a-z0-9-]+$/ },
  { method: "GET", path: /^\/get-session$/ },
  { method: "POST", path: /^\/sign-out$/ },
  { method: "GET", path: /^\/error$/ },
  { method: "GET", path: /^\/ok$/ },
];

export function isPublicAuthPath(method: string, pathname: string): boolean {
  if (!pathname.startsWith(`${AUTH_BASE}/`)) return false;
  const rest = pathname.slice(AUTH_BASE.length);
  const verb = method.toUpperCase();
  return PUBLIC_ROUTES.some((route) => route.method === verb && route.path.test(rest));
}
