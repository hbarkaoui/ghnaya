import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { cache } from "react";
import { getAuth } from "@/lib/auth/auth";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { membershipsOf } from "@/lib/clubs/queries";

/**
 * Utilisateur courant (plan 2) : la session Better Auth, et ses clubs lus en base. Une fois par requête
 * (`cache`), même si la mise en page, la page et ses composants l'appellent chacun.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const requestHeaders = await headers();
  // Sans cookie de session, inutile de démarrer Better Auth ni d'interroger la base : un visiteur coûte
  // zéro requête, et les pages publiques restent servies sans secret (job docker de la CI).
  if (!getSessionCookie(requestHeaders)) return null;
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  return toCurrentUser(session.user, await membershipsOf(session.user.id));
});
