"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clubHref, signInHref } from "@/lib/clubs/href";
import { parseInviteCode } from "@/lib/clubs/invite";
import { decideJoin } from "@/lib/clubs/membership";
import { confirmsClubName, validateClubName } from "@/lib/clubs/name";
import { getCurrentUser } from "@/lib/session";
import * as store from "@/mocks/clubStore";

/**
 * Actions des clubs (tâche 11). MAQUETTE : elles modifient les clubs fictifs en mémoire (mocks/clubStore).
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

/** L'utilisateur courant s'il anime ce club ; sinon l'action est refusée. */
async function requireClubAnimator(slug: string) {
  const user = await getCurrentUser();
  if (!user || store.roleIn(slug, user.id) !== "animator") throw new Error("Réservé aux animateurs du club.");
  return user;
}

export async function createClubAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/clubs/nouveau"));
  if (!user.isAnimator) throw new Error("Réservé aux animateurs.");

  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };

  const club = store.createClub(check.name, user.id);
  revalidateAll();
  redirect(`${clubHref(club.slug)}?statut=cree`);
}

export async function renameClubAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireClubAnimator(slug);
  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };

  store.renameClub(slug, check.name);
  revalidateAll();
  return { done: check.name };
}

export async function regenerateInviteAction(slug: string): Promise<FormState> {
  await requireClubAnimator(slug);
  store.regenerateInvite(slug);
  revalidateAll();
  return { done: "regenerated" };
}

export async function deleteClubAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireClubAnimator(slug);
  const club = store.getClub(slug);
  if (!club) redirect("/clubs");
  if (!confirmsClubName(text(formData, "confirmName"), club.name)) return { error: "mismatch" };

  store.deleteClub(slug);
  revalidateAll();
  redirect("/clubs?statut=supprime");
}

export async function promoteMemberAction(slug: string, userId: string): Promise<FormState> {
  await requireClubAnimator(slug);
  if (store.roleIn(slug, userId) !== "member") return null;
  store.promote(slug, userId);
  revalidateAll();
  return { done: userId };
}

export async function createClubPlaylistAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireClubAnimator(slug);
  // Mêmes règles qu'un nom de club : obligatoire, 60 caractères au plus.
  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };

  const playlist = store.createClubPlaylist(slug, check.name);
  revalidateAll();
  return playlist ? { done: playlist.name } : null;
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

  const club = store.getClubByInvite(code);
  if (!club) return { error: "invalid" };

  // La situation a pu changer depuis l'affichage de la page (autre club rejoint, rôle changé) :
  // on réaffiche alors la page, qui montre le bon cas (confirmation, refus, déjà membre).
  const decision = decideJoin(store.memberships(), user, club.slug);
  if (decision.kind === "switch" && text(formData, "confirm") !== "1") {
    refresh();
    return { error: "needs-confirm" };
  }

  const result = store.joinClub(user, club.slug);
  if (!result.ok) {
    refresh();
    return { error: result.reason };
  }

  revalidateAll();
  redirect(`${clubHref(club.slug)}?statut=rejoint`);
}

/** MAQUETTE : remet les clubs, les adhésions et les playlists dans leur état de départ. */
export async function resetDemoClubsAction(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  store.resetClubStore();
  revalidateAll();
}
