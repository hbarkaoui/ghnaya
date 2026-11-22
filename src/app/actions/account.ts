"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { getAuth } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/session";
import { soleAnimatorClubs } from "@/lib/clubs/queries";

async function endSession(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  revalidatePath("/", "layout");
}

/** Se déconnecter, puis revenir à l'accueil. `nextCookies()` efface le cookie de session. */
export async function signOut(): Promise<void> {
  await endSession();
  redirect("/", RedirectType.replace);
}

/**
 * Supprimer son compte (spec §12). La règle du dernier animateur est revérifiée ici, et pas seulement
 * dans la page : tant qu'un club n'a pas d'autre animateur, la suppression est refusée.
 * Plan 2 : suppression des playlists personnelles et des adhésions, révisions rattachées à « compte supprimé ».
 */
export async function deleteAccount(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?retour=/moi/compte");
  if ((await soleAnimatorClubs(user.id)).length > 0) redirect("/moi/compte", RedirectType.replace);

  await endSession();
  redirect("/moi?compte=supprime", RedirectType.replace);
}
