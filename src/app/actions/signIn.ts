"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { checkEmail, type MagicLinkState } from "@/lib/auth/email";
import { SIGN_IN_PATH, safeReturnPath, signInHref } from "@/lib/auth/returnPath";
import { DEMO_SESSION_COOKIE } from "@/mocks/session";
import {
  DEMO_MAGIC_LINK_COOKIE,
  DEMO_MAGIC_LINK_MAX_AGE,
  GOOGLE_DELAY_MS,
  MAGIC_LINK_DELAY_MS,
  simulateDelay,
} from "@/mocks/signIn";

const isProduction = process.env.NODE_ENV === "production";

/** MAQUETTE : « connecte » la session de démonstration en membre (Leïla). */
async function signInAsDemoMember() {
  (await cookies()).set(DEMO_SESSION_COOKIE, "member", { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}

/**
 * Demande d'un lien magique. Adresse refusée : l'erreur revient en ligne, sans délai.
 * Adresse acceptée : envoi simulé, puis « Vérifiez vos e-mails » (la page remplace le formulaire dans
 * l'historique : « retour » ramène à la page d'origine, « Modifier l'adresse » au formulaire).
 *
 * Plan 2 : `await signIn("resend", { email, redirectTo: retour, redirect: false })` remplace le délai.
 */
export async function requestMagicLink(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const raw = formData.get("email");
  const typed = typeof raw === "string" ? raw : "";
  const check = checkEmail(typed);
  if (!check.ok) return { email: typed, error: check.reason };

  const retour = safeReturnPath(formData.get("retour"));
  await simulateDelay(MAGIC_LINK_DELAY_MS);
  (await cookies()).set(DEMO_MAGIC_LINK_COOKIE, check.email, {
    path: SIGN_IN_PATH,
    httpOnly: true,
    sameSite: "lax",
    maxAge: DEMO_MAGIC_LINK_MAX_AGE,
  });
  redirect(signInHref(retour, "verify"), RedirectType.replace);
}

/**
 * Bouton Google. MAQUETTE : en développement, simule l'aller-retour chez Google puis revient à `retour`
 * connecté en membre ; en production, sans Auth.js, rien ne se passe.
 *
 * Plan 2 : `await signIn("google", { redirectTo: retour })`.
 */
export async function continueWithGoogle(formData: FormData): Promise<void> {
  const retour = safeReturnPath(formData.get("retour"));
  if (isProduction) redirect(signInHref(retour), RedirectType.replace);
  await simulateDelay(GOOGLE_DELAY_MS);
  await signInAsDemoMember();
  redirect(retour, RedirectType.replace);
}

/**
 * MAQUETTE, développement uniquement : « clique » le lien reçu par e-mail. La session de démonstration
 * passe à `member`, puis on revient au chemin `retour` validé.
 */
export async function openDemoMagicLink(formData: FormData): Promise<void> {
  if (isProduction) return;
  const retour = safeReturnPath(formData.get("retour"));
  (await cookies()).delete({ name: DEMO_MAGIC_LINK_COOKIE, path: SIGN_IN_PATH });
  await signInAsDemoMember();
  redirect(retour, RedirectType.replace);
}
