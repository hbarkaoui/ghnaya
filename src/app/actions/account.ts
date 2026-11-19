"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { soleAnimatorClubs } from "@/mocks/account";
import { DEMO_SESSION_COOKIE, type DemoSession } from "@/mocks/session";

/** MAQUETTE : sans comptes (plan 2), se déconnecter ou supprimer son compte fait passer en session visiteur. */
async function becomeVisitor() {
  const visitor: DemoSession = "visitor";
  (await cookies()).set(DEMO_SESSION_COOKIE, visitor, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}

/** Se déconnecter, puis revenir à l'accueil. Plan 2 : `signOut()` d'Auth.js. */
export async function signOut(): Promise<void> {
  await becomeVisitor();
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
  if (soleAnimatorClubs(user).length > 0) redirect("/moi/compte", RedirectType.replace);

  await becomeVisitor();
  redirect("/moi?compte=supprime", RedirectType.replace);
}
