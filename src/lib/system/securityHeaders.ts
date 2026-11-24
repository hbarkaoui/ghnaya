// Plan 5, tâche 4 : en-têtes de sécurité de toutes les réponses, lus par next.config.ts au build.
// Imports relatifs seulement : next.config.ts ne résout pas l'alias « @/ ».
import { isIndexable } from "./robots";

export interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

export function securityHeaders(env: NodeJS.ProcessEnv): HeaderRule[] {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    // Pas de règle de scripts (nonces) : écart 6. Ces trois-là ne gênent ni Next ni Google.
    { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
    // screen-wake-lock reste permis : le lecteur garde l'écran allumé (spec §10).
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ];
  if (env.VERCEL_ENV === "production") {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  }
  if (!isIndexable(env)) headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
  return [{ source: "/:path*", headers }];
}
