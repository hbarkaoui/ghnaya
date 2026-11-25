"use server";

import { cookies, headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getAuth, isGoogleEnabled } from "@/lib/auth/auth";
import { checkEmail, type MagicLinkState } from "@/lib/auth/email";
import { allowMagicLinkRequest } from "@/lib/auth/magicLinkLimit";
import { safeReturnPath, signInHref } from "@/lib/auth/returnPath";
import { MAGIC_LINK_SENT_COOKIE, MAGIC_LINK_SENT_COOKIE_OPTIONS } from "@/lib/auth/signInCookie";
import { clientIp } from "@/lib/ratelimit/clientIp";
import { actionErrorLogLine } from "@/lib/system/serverErrorLog";

/**
 * Demande d'un lien magique (spec §4.1). Adresse refusée ou trop de demandes : l'erreur revient en ligne.
 * Lien parti : « Vérifiez vos e-mails », qui remplace le formulaire dans l'historique. Le lien ramène à
 * `retour` ; un lien expiré ou déjà utilisé ramène au formulaire avec `?error=INVALID_TOKEN`.
 */
export async function requestMagicLink(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const raw = formData.get("email");
  const typed = typeof raw === "string" ? raw : "";
  const check = checkEmail(typed);
  if (!check.ok) return { email: typed, error: check.reason };

  const retour = safeReturnPath(formData.get("retour"));
  const requestHeaders = await headers();
  if (!(await allowMagicLinkRequest(check.email, clientIp(requestHeaders)))) return { email: typed, error: "tooMany" };

  try {
    await getAuth().api.signInMagicLink({
      body: {
        email: check.email,
        callbackURL: retour,
        errorCallbackURL: signInHref(retour),
        metadata: { locale: await getLocale() },
      },
      headers: requestHeaders,
    });
  } catch (error) {
    console.error(actionErrorLogLine("requestMagicLink", error));
    return { email: typed, error: "failed" };
  }

  (await cookies()).set(MAGIC_LINK_SENT_COOKIE, check.email, MAGIC_LINK_SENT_COOKIE_OPTIONS);
  redirect(signInHref(retour, "verify"), RedirectType.replace);
}

/** Bouton Google : Better Auth renvoie l'adresse de Google, où l'on part ; le retour ramène à `retour`. */
export async function continueWithGoogle(formData: FormData): Promise<void> {
  const retour = safeReturnPath(formData.get("retour"));
  if (!isGoogleEnabled()) redirect(signInHref(retour), RedirectType.replace);

  const failed = `${signInHref(retour)}&error=google`;
  let url: string | undefined;
  try {
    // Better Auth ajoute son propre `error=…` à `errorCallbackURL` : on ne le préremplit pas.
    ({ url } = await getAuth().api.signInSocial({
      body: { provider: "google", callbackURL: retour, errorCallbackURL: signInHref(retour) },
      headers: await headers(),
    }));
  } catch (error) {
    console.error(actionErrorLogLine("continueWithGoogle", error));
  }
  // `redirect()` lève : hors du try/catch.
  if (!url) redirect(failed, RedirectType.replace);
  redirect(url);
}
