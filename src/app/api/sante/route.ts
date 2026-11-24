// Plan 5, tâche 5 : GET /api/sante, pour la vérification après déploiement (pnpm smoke) et une surveillance
// externe. Ne dit rien d'autre que l'état : ni version, ni nom de base, ni message d'erreur.
import { db } from "@/lib/db/client";
import { checkHealth } from "@/lib/system/health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const health = await checkHealth(db);
  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
