import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoLockup } from "@/components/brand/Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";

type Props =
  | { variant: "root"; withLocaleSwitcher?: boolean }
  | { variant: "sub"; title: string; backHref: string };

const HEADER_CLASS =
  "sticky top-0 z-30 border-b border-line-subtle bg-page pt-[env(safe-area-inset-top)]";

/**
 * En-tête de page.
 *  - root : pages de premier niveau (onglets) — logo, et bascule de langue sur l'Accueil.
 *  - sub  : pages de second niveau — bouton retour et titre (le h1 de la page).
 */
export async function PageHeader(props: Props) {
  const t = await getTranslations();

  if (props.variant === "root") {
    return (
      <header className={HEADER_CLASS}>
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4">
          <Link href="/" aria-label={t("app.name")} className="rounded-md">
            <LogoLockup />
          </Link>
          {props.withLocaleSwitcher ? <LocaleSwitcher /> : null}
        </div>
      </header>
    );
  }

  return (
    <header className={HEADER_CLASS}>
      <div className="mx-auto flex h-14 max-w-content items-center gap-1 px-2">
        <Link
          href={props.backHref}
          aria-label={t("nav.back")}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink hover:bg-well"
        >
          <ChevronLeft aria-hidden="true" className="size-6 rtl:-scale-x-100" />
        </Link>
        <h1 className="truncate text-lg font-medium">{props.title}</h1>
      </div>
    </header>
  );
}
