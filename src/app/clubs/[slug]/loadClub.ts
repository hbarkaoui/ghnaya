import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { clubHref, signInHref } from "@/lib/clubs/href";
import { getCurrentUser } from "@/lib/session";
import { getClub, roleIn } from "@/mocks/clubStore";

/** Le slug tel qu'il est stocké, même si le paramètre de l'URL arrive encore encodé (lettres arabes). */
const decodeSlug = (param: string) => {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
};

/**
 * Le club de la page, l'utilisateur et son rôle dans ce club (mise en page et pages du club).
 *  - visiteur : renvoyé vers la connexion (la tâche 16 remplacera ce renvoi par AuthGate) ;
 *  - club inconnu, ou dont l'utilisateur ne fait pas partie (un club est privé) : 404.
 */
export const loadClub = cache(async (slugParam: string) => {
  const slug = decodeSlug(slugParam);
  const user = await getCurrentUser();
  if (!user) redirect(signInHref(clubHref(slug)));

  const club = getClub(slug);
  const role = club ? roleIn(slug, user.id) : null;
  if (!club || !role) notFound();
  return { user, club, role };
});
