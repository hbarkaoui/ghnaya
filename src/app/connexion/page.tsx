import { CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { SignInLayout } from "@/components/auth/SignInLayout";
import { LogoSymbol } from "@/components/brand/Logo";
import { isGoogleEnabled } from "@/lib/auth/auth";
import { signInErrorKey } from "@/lib/auth/signInError";
import { safeReturnPath } from "@/lib/auth/returnPath";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signIn");
  return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * Connexion (IA) : Google, puis le lien magique par e-mail. Pas de « Créer un compte » séparé : le compte
 * est créé à la première connexion (spec, §4.1). `retour` n'est suivi que s'il est un chemin interne.
 * Déjà connecté : on revient directement à `retour`.
 */
export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const { retour: rawRetour, error } = await searchParams;
  const retour = safeReturnPath(rawRetour);
  const errorKey = signInErrorKey(error);
  if (await getCurrentUser()) redirect(retour);
  const t = await getTranslations("signIn");

  return (
    <SignInLayout backHref="/" backToHistory>
      <div className="flex flex-col items-center gap-3 text-center">
        <LogoSymbol size={64} />
        <h1 className="font-display text-3xl font-semibold text-balance">{t("title")}</h1>
        <p className="text-ink-2 text-pretty">{t("intro")}</p>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {errorKey ? (
          <p role="alert" className="flex items-start gap-1.5 text-sm text-error">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{t(`errors.${errorKey}`)}</span>
          </p>
        ) : null}
        {isGoogleEnabled() ? (
          <>
            <GoogleSignInButton retour={retour} />
            <div className="flex items-center gap-3 text-sm text-ink-2">
              <span aria-hidden="true" className="h-px flex-1 bg-line-subtle" />
              {t("or")}
              <span aria-hidden="true" className="h-px flex-1 bg-line-subtle" />
            </div>
          </>
        ) : null}
        <MagicLinkForm retour={retour} />
      </div>

      <p className="mt-8 text-center text-sm text-ink-2 text-pretty">{t("noAccount")}</p>
    </SignInLayout>
  );
}
