import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/gate";

/**
 * Garde des pages réservées aux membres (IA, composants partagés) : un visiteur est redirigé vers
 * `/connexion?retour=<retour>`, puis ramené à `retour` une fois connecté.
 *
 * `retour` est le chemin de la page, requête comprise (`/recherche?q=sidi`) ; seul un chemin interne
 * est accepté, sinon le retour se fait à l'accueil. Quand la page a besoin de l'utilisateur, appeler
 * plutôt `requireUser(retour)` (`@/lib/auth/gate`), qui le renvoie.
 *
 * @example
 * <AuthGate retour={`/clubs/${slug}/reglages`}>
 *   <ClubSettings slug={slug} />
 * </AuthGate>
 */
export async function AuthGate({ retour, children }: { retour: string; children: ReactNode }) {
  await requireUser(retour);
  return children;
}
