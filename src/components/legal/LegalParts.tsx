import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

/**
 * Pages juridiques (`/a-propos/confidentialite`, `/a-propos/conditions`) : texte sobre, du même gabarit que
 * `/a-propos/droits`. Leur texte est en français seulement, écrit dans la page et non dans `messages/` :
 * une version arabe attend la relecture juridique du texte français. En arabe, un avis le dit, et le
 * contenu garde `lang="fr"` et le sens de gauche à droite.
 */
export const SUPPORT_EMAIL = "ghnaya-support@googlegroups.com";

export async function LegalPage({
  title,
  updated,
  lead,
  children,
}: {
  title: string;
  updated: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations("legal");

  return (
    <>
      <PageHeader variant="sub" backHref="/moi" backToHistory />
      <PageMain>
        {locale === "fr" ? null : (
          <p role="note" className="mb-6 rounded-lg bg-info-soft px-4 py-3 text-info">
            {t("frenchOnly")}
          </p>
        )}
        <article lang="fr" dir="ltr">
          <h1 className="font-display text-2xl leading-snug font-semibold text-balance">{title}</h1>
          <p className="mt-2 text-sm text-ink-2">{updated}</p>
          <div className="mt-3 text-md text-ink-2 leading-relaxed">{lead}</div>
          {children}
        </article>
      </PageMain>
    </>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-lg font-medium text-ink">
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-3 text-ink leading-relaxed">{children}</div>
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 ps-6 marker:text-ink-3">{children}</ul>;
}

/**
 * Point que le code ne permet pas de trancher : visible dans la page tant que la relecture juridique ne
 * l'a pas réglé. `data-a-valider` permet de les compter (test e2e) et de vérifier qu'il n'en reste plus.
 */
export function ToValidate({ children }: { children: ReactNode }) {
  return (
    <aside
      role="note"
      data-a-valider=""
      className="rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm leading-relaxed text-ink"
    >
      <strong className="font-semibold text-warning">À valider : </strong>
      {children}
    </aside>
  );
}

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-link underline underline-offset-4">
      {children}
    </Link>
  );
}

export function SupportEmail() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-link underline underline-offset-4">
      {SUPPORT_EMAIL}
    </a>
  );
}
