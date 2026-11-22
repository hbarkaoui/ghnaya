"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { updateUserName, deleteUserAccount } from "@/lib/account/write";
import { getAuth } from "@/lib/auth/auth";
import { normalizeUserName } from "@/lib/auth/name";
import { signInHref } from "@/lib/auth/returnPath";
import { db } from "@/lib/db/client";
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
 * Supprimer son compte (spec §12). La règle du dernier animateur est revérifiée ici, puis dans la
 * transaction de suppression. La déconnexion vient d'abord, car elle a besoin de la session ; si la
 * suppression échoue ensuite (un club a perdu son autre animateur entre-temps), on est seulement déconnecté.
 */
export async function deleteAccount(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/moi/compte"));
  if ((await soleAnimatorClubs(user.id)).length > 0) redirect("/moi/compte", RedirectType.replace);

  await endSession();
  const result = await deleteUserAccount(db, user.id);
  revalidatePath("/", "layout");
  redirect(result.ok ? "/moi?compte=supprime" : "/moi/compte", RedirectType.replace);
}

export type NameState = { error?: "required" | "tooLong"; done?: string } | null;

/** Changer son nom, affiché aux autres membres de ses clubs. */
export async function renameUserAction(_prev: NameState, formData: FormData): Promise<NameState> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/moi/compte"));
  const check = normalizeUserName(formData.get("name"));
  if (!check.ok) return { error: check.error };
  await updateUserName(db, user.id, check.name);
  revalidatePath("/", "layout");
  return { done: check.name };
}
