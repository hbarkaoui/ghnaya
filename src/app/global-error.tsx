"use client"; // Les limites d'erreur sont des composants client.

import { RotateCw } from "lucide-react";
import { LogoSymbol } from "@/components/brand/Logo";
import { errorDigest } from "@/lib/system/actionFailure";
import { fontVariables } from "./fonts";
import "./globals.css";

/**
 * Textes de la page, dans les deux langues. Exception à la règle des fichiers messages/*.json :
 * cette page remplace la mise en page racine, donc il n'y a ni langue choisie (cookie lu par la mise
 * en page), ni NextIntlClientProvider ; et importer les fichiers de messages ici les chargerait sur
 * toutes les pages. Les deux langues sont donc affichées, chacune avec sa langue et son sens.
 */
const COPY = {
  fr: {
    title: "Ghnaya n'a pas pu s'afficher",
    body: "Un problème est survenu de notre côté. Réessayez dans un instant.",
    retry: "Réessayer",
    reference: "Référence pour le support",
  },
  ar: {
    title: "تعذّر عرض غناية",
    body: "حدث خلل من جهتنا. أعيدوا المحاولة بعد قليل.",
    retry: "أعيدوا المحاولة",
    reference: "مرجع الخطأ للدعم",
  },
};

/**
 * Erreur dans la mise en page racine (lecture de la session ou de la langue) : cette page remplace
 * tout le document, avec ses propres <html> et <body>, les styles et les polices. Pas d'en-tête ni de
 * barre d'onglets : ils dépendent de la mise en page qui a échoué. « Réessayer » relance la mise en
 * page racine ; « Accueil » recharge complètement le site.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = errorDigest(error);

  return (
    <html lang="fr" dir="ltr" className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-ink antialiased">
        <title>{`Erreur · خطأ · Ghnaya`}</title>
        <main className="mx-auto flex w-full max-w-content flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
          <LogoSymbol size={56} />
          <section lang="fr" dir="ltr" className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-balance">{COPY.fr.title}</h1>
            <p className="max-w-sm text-ink-2 text-pretty">{COPY.fr.body}</p>
          </section>
          <section lang="ar" dir="rtl" className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-medium text-balance">{COPY.ar.title}</h2>
            <p className="max-w-sm text-ink-2 text-pretty">{COPY.ar.body}</p>
          </section>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink hover:bg-accent-hover"
            >
              <RotateCw aria-hidden="true" className="size-4" />
              <span lang="fr">{COPY.fr.retry}</span>
              <span aria-hidden="true">·</span>
              <span lang="ar" dir="rtl">
                {COPY.ar.retry}
              </span>
            </button>
            {/* Lien <a> et non <Link>, exprès : un rechargement complet repart d'une mise en page saine. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line px-5 font-medium text-ink hover:bg-well"
            >
              <span lang="fr">Accueil</span>
              <span aria-hidden="true">·</span>
              <span lang="ar" dir="rtl">
                الرئيسية
              </span>
            </a>
          </div>
          {digest ? (
            <div className="flex flex-col items-center gap-1.5 text-sm text-ink-2">
              <p>
                <span lang="fr">{COPY.fr.reference}</span>
                <span aria-hidden="true"> · </span>
                <span lang="ar" dir="rtl">
                  {COPY.ar.reference}
                </span>
              </p>
              <code dir="ltr" className="rounded-sm bg-well px-1.5 py-0.5 font-mono text-ink select-all">
                {digest}
              </code>
            </div>
          ) : null}
        </main>
      </body>
    </html>
  );
}
