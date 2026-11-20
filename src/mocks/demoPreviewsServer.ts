import "server-only";
import { cookies } from "next/headers";
import { DEMO_LATENCY_COOKIE, ROOT_ERROR_COOKIE, parseDemoLatency } from "./demoPreviews";

const production = process.env.NODE_ENV === "production";

/**
 * MAQUETTE : attend le délai choisi sur /apercu/etats avant de rendre une liste, pour que son
 * squelette (loading.tsx) reste visible. Sans cookie, et toujours en production : aucune attente.
 */
export async function waitDemoLatency(): Promise<void> {
  if (production) return;
  const ms = parseDemoLatency((await cookies()).get(DEMO_LATENCY_COOKIE)?.value, production);
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

/** MAQUETTE : fait échouer la mise en page racine tant que le cookie d'aperçu vit (global-error). */
export async function throwIfRootErrorPreview(): Promise<void> {
  if (production) return;
  if ((await cookies()).has(ROOT_ERROR_COOKIE)) {
    throw new Error("Aperçu : erreur provoquée dans la mise en page racine (/apercu/etats).");
  }
}
