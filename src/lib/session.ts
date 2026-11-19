import "server-only";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, demoUserFor, isDemoSession, type DemoSession, type DemoUser } from "@/mocks/session";

/**
 * Utilisateur courant. MAQUETTE : lu dans le cookie de démonstration (membre par défaut).
 * Le plan 2 remplacera ce corps par la session Auth.js, sans changer la signature.
 */
export async function getDemoSession(): Promise<DemoSession> {
  const value = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
  return isDemoSession(value) ? value : "member";
}

export async function getCurrentUser(): Promise<DemoUser | null> {
  return demoUserFor(await getDemoSession());
}
