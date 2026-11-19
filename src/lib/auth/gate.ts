import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import type { DemoUser } from "@/mocks/session";
import { signInHref } from "./returnPath";

/**
 * Cœur d'`AuthGate` : renvoie l'utilisateur connecté, ou redirige un visiteur vers
 * `/connexion?retour=<retour>` (retour validé par `safeReturnPath`, l'accueil sinon).
 *
 * À appeler dans une page, une Server Action ou un Route Handler réservés aux membres, jamais dans
 * une mise en page (elle n'est pas rejouée à chaque navigation). Une Server Action vérifie toujours
 * elle-même, même si le bouton qui l'appelle n'est affiché qu'aux membres.
 *
 * MAQUETTE : l'utilisateur vient du cookie de démonstration ; le plan 2 lira la session Auth.js.
 */
export async function requireUser(retour: string): Promise<DemoUser> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref(retour));
  return user;
}
