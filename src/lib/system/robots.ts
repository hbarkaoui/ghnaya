// Plan 5, tâche 4 : indexation fermée tant que l'avis juridique n'est pas rendu (spec §14, écart 2).
// Lu au build (robots.txt statique, en-têtes de next.config.ts) : changer SITE_INDEXABLE demande un redéploiement.
// Imports relatifs ou de types seulement : next.config.ts lit securityHeaders.ts, qui importe ce module.
import type { MetadataRoute } from "next";

export function isIndexable(env: NodeJS.ProcessEnv): boolean {
  return env.SITE_INDEXABLE?.trim() === "true";
}

/** Espaces privés ou techniques, jamais indexés : comptes, clubs, playlists, modération, lecteur, aperçus. */
const PRIVATE_PATHS = [
  "/api/",
  "/apercu/",
  "/clubs",
  "/connexion",
  "/contribuer",
  "/lecture/",
  "/mes-contributions",
  "/moderation",
  "/moi",
  "/playlists",
  "/rejoindre/",
  "/signaler/",
];

export function robotsRules(env: NodeJS.ProcessEnv): MetadataRoute.Robots {
  if (!isIndexable(env)) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS } };
}
