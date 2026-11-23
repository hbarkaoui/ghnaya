/**
 * Adresse du client, pour les limites par IP (recherche, connexion, signalements).
 *
 * `x-forwarded-for` n'est fiable que pour ce qu'y a écrit un proxy de confiance : le client peut envoyer
 * l'en-tête lui-même. Deux cas, choisis par `TRUSTED_PROXY_HOPS` :
 *  - non défini ou `0` (Vercel) : le proxy de bord réécrit l'en-tête, sa première adresse est celle du client ;
 *  - `N` ≥ 1 (image Docker derrière nginx, Caddy, un répartiteur…) : chacun des N proxies de confiance ajoute
 *    à droite l'adresse qu'il a vue ; la N-ième adresse depuis la droite est celle que le plus externe a vue.
 *    Celles plus à gauche viennent du client et sont ignorées.
 * Une valeur qui n'est pas un entier positif est ignorée (cas Vercel).
 */
export function clientIp(headers: Headers, env: NodeJS.ProcessEnv = process.env): string {
  const forwarded = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (forwarded.length > 0) {
    const hops = trustedProxyHops(env);
    return hops === 0 ? forwarded[0] : forwarded[Math.max(0, forwarded.length - hops)];
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

function trustedProxyHops(env: NodeJS.ProcessEnv): number {
  const value = env.TRUSTED_PROXY_HOPS?.trim();
  return value && /^\d+$/.test(value) ? Number(value) : 0;
}
