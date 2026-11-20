import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BackLink } from "./BackLink";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { RootHeaderBar, SUB_HEADER_CLASS } from "./RootHeaderBar";

type Props =
  | { variant: "root"; withLocaleSwitcher?: boolean }
  | {
      variant: "sub";
      /** Titre de la page (son h1). Absent quand la page porte elle-même un grand titre (fiche chanson). */
      title?: string;
      backHref: string;
      /** Revenir à la page précédente quand il y en a une, `backHref` sinon (fiche ouverte depuis une recherche). */
      backToHistory?: boolean;
    };

const BACK_CLASS =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink hover:bg-well";

/**
 * En-tête de page.
 *  - root : pages de premier niveau (onglets) — logo, et bascule de langue sur l'Accueil.
 *  - sub  : pages de second niveau — bouton retour et titre (le h1 de la page).
 */
export async function PageHeader(props: Props) {
  const t = await getTranslations();

  if (props.variant === "root") {
    return (
      <RootHeaderBar homeLabel={t("app.name")}>{props.withLocaleSwitcher ? <LocaleSwitcher /> : null}</RootHeaderBar>
    );
  }

  return (
    <header className={SUB_HEADER_CLASS}>
      {/* Hauteur minimale et titre sur plusieurs lignes plutôt que tronqué : il reste entier quand le texte
          est agrandi à 200 % (WCAG 1.4.4), et les signes sous les lettres ne sont plus rognés. */}
      <div className="mx-auto flex min-h-14 max-w-content items-center gap-1 px-2">
        {props.backToHistory ? (
          <BackLink fallbackHref={props.backHref} label={t("nav.back")} className={BACK_CLASS} />
        ) : (
          <Link href={props.backHref} aria-label={t("nav.back")} className={BACK_CLASS}>
            <ChevronLeft aria-hidden="true" className="size-6 rtl:-scale-x-100" />
          </Link>
        )}
        {props.title ? <h1 className="min-w-0 py-2 text-lg font-medium break-words">{props.title}</h1> : null}
      </div>
    </header>
  );
}
