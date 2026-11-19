import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { BackLink } from "@/components/shell/BackLink";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";

const BACK_CLASS = "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink hover:bg-well";

/**
 * Mise en page de la connexion, hors de la coque de l'app (IA : ni en-tête d'onglet ni barre d'onglets).
 * En haut : retour et bascule de langue (on arrive souvent ici par un lien partagé, avant d'avoir vu l'accueil).
 * Le contenu est une colonne étroite, centrée, sans la marge réservée à la barre d'onglets.
 */
export async function SignInLayout({
  backHref,
  backToHistory = false,
  children,
}: {
  backHref: string;
  /** Revenir à la page précédente quand il y en a une, `backHref` sinon. */
  backToHistory?: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations("nav");

  return (
    <>
      <header className="pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between ps-2 pe-4">
          {backToHistory ? (
            <BackLink fallbackHref={backHref} label={t("back")} className={BACK_CLASS} />
          ) : (
            <Link href={backHref} aria-label={t("back")} className={BACK_CLASS}>
              <ChevronLeft aria-hidden="true" className="size-6 rtl:-scale-x-100" />
            </Link>
          )}
          <LocaleSwitcher />
        </div>
      </header>
      <main
        id="contenu"
        className="mx-auto w-full max-w-sm flex-1 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+2.5rem)]"
      >
        {children}
      </main>
    </>
  );
}
