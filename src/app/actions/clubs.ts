"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clubHref, signInHref } from "@/lib/clubs/href";
import { parseInviteCode } from "@/lib/clubs/invite";
import { confirmsClubName, validateClubName } from "@/lib/clubs/name";
import { getCurrentUser } from "@/lib/session";
import { isUuid } from "@/lib/catalog/queries";
import { canCreateClub, canManageClub } from "@/lib/auth/permissions";
import { getClubBySlug } from "@/lib/clubs/queries";
import { createClub, deleteClub, joinClub, promoteMember, regenerateInvite, renameClub } from "@/lib/clubs/write";
import { db } from "@/lib/db/client";
import { createPlaylist } from "@/lib/playlist/write";

/**
 * Actions des clubs, branchées sur la base (lib/clubs, lib/playlist).
 * Chaque action revérifie la session et les droits : afficher un formulaire n'est pas un contrôle d'accès.
 */

export type NameError = "required" | "tooLong";
export type FormState = { error?: NameError | "mismatch" | "invalid"; done?: string } | null;

export type JoinState = {
  error?: "invalid" | "needs-confirm" | "already-member" | "last-animator";
} | null;

/** Toute l'app dépend des clubs (onglet, accueil, playlists) : on rafraîchit depuis la racine. */
const revalidateAll = () => revalidatePath("/", "layout");

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** L'utilisateur courant et le club, s'il anime ce club ; sinon l'action est refusée. */
async function requireClubAnimator(slug: string) {
  const user = await getCurrentUser();
  const club = typeof slug === "string" ? await getClubBySlug(slug) : null;
  if (!user || !club || !canManageClub(user, club.slug)) throw new Error("Réservé aux animateurs du club.");
  return { user, club };
}

export async function createClubAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/clubs/nouveau"));
  if (!canCreateClub(user)) throw new Error("Réservé aux animateurs.");

  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };

  const club = await createClub(db, check.name, user.id);
  revalidateAll();
  redirect(`${clubHref(club.slug)}?statut=cree`);
}

export async function renameClubAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };
  await renameClub(db, club.id, check.name);
  revalidateAll();
  return { done: check.name };
}

export async function regenerateInviteAction(slug: string): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  await regenerateInvite(db, club.id);
  revalidateAll();
  return { done: "regenerated" };
}

export async function deleteClubAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  if (!confirmsClubName(text(formData, "confirmName"), club.name)) return { error: "mismatch" };
  await deleteClub(db, club.id);
  revalidateAll();
  redirect("/clubs?statut=supprime");
}

export async function promoteMemberAction(slug: string, userId: string): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  if (typeof userId !== "string" || !isUuid(userId)) return null;
  if (!(await promoteMember(db, club.id, userId))) return null;
  revalidateAll();
  return { done: userId };
}

export async function createClubPlaylistAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, club } = await requireClubAnimator(slug);
  // Mêmes règles qu'un nom de club : obligatoire, 60 caractères au plus.
  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };
  await createPlaylist(db, { name: check.name, owner: { clubId: club.id }, createdBy: user.id });
  revalidateAll();
  return { done: check.name };
}

/** « Rejoindre avec un lien » : lit le code dans le lien collé, puis ouvre la page d'invitation. */
export async function openInviteLinkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = parseInviteCode(text(formData, "link"));
  if (!code) return { error: "invalid" };
  redirect(`/rejoindre/${code}`);
}

/**
 * Rejoindre le club d'un lien d'invitation (spec §10). Un membre qui a déjà un club doit avoir confirmé
 * le changement (`confirm=1`) ; le dernier animateur d'un club ne peut pas le quitter.
 */
export async function joinClubAction(code: string, _prev: JoinState, formData: FormData): Promise<JoinState> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref(`/rejoindre/${code}`));

  const result = await joinClub(db, user, code, text(formData, "confirm") === "1");
  if (!result.ok) {
    // La situation a pu changer depuis l'affichage (autre club rejoint, rôle changé, lien régénéré) :
    // on réaffiche la page, qui montre le bon cas.
    refresh();
    return { error: result.reason };
  }
  revalidateAll();
  redirect(`${clubHref(result.club.slug)}?statut=rejoint`);
}
