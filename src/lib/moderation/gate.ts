import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/gate";
import type { DemoUser } from "@/mocks/session";

/**
 * Accès à la modération (spec §4.3) : un visiteur passe par la connexion (AuthGate, `retour`), un
 * membre qui n'est pas modérateur voit une page introuvable (on ne dit pas que la page existe).
 * À appeler dans chaque page et chaque action serveur de la modération, jamais dans une mise en page.
 */
export async function requireModerator(retour: string): Promise<DemoUser> {
  const user = await requireUser(retour);
  if (!user.isModerator) notFound();
  return user;
}
