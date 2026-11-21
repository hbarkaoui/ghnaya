"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEMO_LATENCY_COOKIE,
  ROOT_ERROR_COOKIE,
  ROOT_ERROR_SECONDS,
  parseDemoLatency,
} from "@/mocks/demoPreviews";

/** MAQUETTE (tâche 17) : ralentit les listes (playlists, clubs) pour voir leurs squelettes ; 0 l'arrête. */
export async function setDemoLatency(formData: FormData): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  const ms = parseDemoLatency(String(formData.get("latence") ?? ""), false);
  const jar = await cookies();
  if (ms > 0) jar.set(DEMO_LATENCY_COOKIE, String(ms), { path: "/", sameSite: "lax" });
  else jar.delete(DEMO_LATENCY_COOKIE);
  revalidatePath("/apercu/etats");
}

/**
 * MAQUETTE (tâche 17) : fait échouer la mise en page racine pendant ROOT_ERROR_SECONDS secondes, puis
 * ouvre l'accueil : on voit `global-error`, et « Réessayer » réussit une fois le cookie expiré.
 */
export async function triggerRootError(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  (await cookies()).set(ROOT_ERROR_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: ROOT_ERROR_SECONDS });
  redirect("/");
}
