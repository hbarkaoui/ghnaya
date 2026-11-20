"use client";

import { House, RotateCw } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PageMain } from "@/components/shell/PageMain";
import { RootHeaderBar } from "@/components/shell/RootHeaderBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { errorDigest } from "@/lib/system/actionFailure";

const TITLE_ID = "erreur-titre";

/**
 * Page d'erreur (IA, pages système), rendue par app/error.tsx : la page n'a pas pu s'afficher.
 * « Réessayer » recharge les données et le rendu du segment (`retry`), « Revenir à l'accueil » sort de
 * l'impasse. Une erreur venue du serveur porte une référence (`digest`), affichée pour le support : en
 * production, c'est le seul lien entre ce que voit la personne et les journaux du serveur.
 * Le focus passe sur le titre, pour que l'erreur soit annoncée à la place de la page disparue.
 */
export function ErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations();
  const digest = errorDigest(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    document.getElementById(TITLE_ID)?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <title>{`${t("system.error.metaTitle")} · ${t("app.name")}`}</title>
      <RootHeaderBar homeLabel={t("app.name")} />
      <PageMain>
        <EmptyState titleAs="h1" titleId={TITLE_ID} title={t("system.error.title")} body={t("system.error.body")}>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => retry()} className={BUTTON_PRIMARY}>
              <RotateCw aria-hidden="true" className="size-4" />
              {t("system.error.retry")}
            </button>
            <Link href="/" className={BUTTON_SECONDARY}>
              <House aria-hidden="true" className="size-4" />
              {t("system.error.home")}
            </Link>
          </div>
          {digest ? (
            <p className="mt-3 text-sm text-ink-2">
              {t("system.error.reference")}{" "}
              {/* Fragment latin : isolé en ltr dans l'interface arabe ; un toucher le sélectionne en entier. */}
              <code dir="ltr" className="rounded-sm bg-well px-1.5 py-0.5 font-mono text-ink select-all">
                {digest}
              </code>
            </p>
          ) : null}
        </EmptyState>
      </PageMain>
    </>
  );
}
