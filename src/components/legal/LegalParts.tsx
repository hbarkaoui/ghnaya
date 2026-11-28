import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

/**
 * Pages juridiques (`/a-propos/confidentialite`, `/a-propos/conditions`) : texte sobre, du même gabarit que
 * `/a-propos/droits`. Leur texte est écrit dans un fichier par langue (`fr.tsx`, `ar.tsx`) et non dans
 * `messages/` : un texte juridique se relit d'un seul tenant, et ses phrases portent des liens.
 * La version française fait foi ; la version arabe la suit section par section, avec les mêmes `id`.
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
  return (
    <>
      <PageHeader variant="sub" backHref="/moi" backToHistory />
      <PageMain>
        <article>
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
export async function ToValidate({ children }: { children: ReactNode }) {
  const t = await getTranslations("legal");
  return (
    <aside
      role="note"
      data-a-valider=""
      className="rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm leading-relaxed text-ink"
    >
      <strong className="font-semibold text-warning">{t("toValidate")} </strong>
      {children}
    </aside>
  );
}

/** Texte latin dans une phrase arabe (adresse, raison sociale) : isolé, il garde son ordre. */
export function Ltr({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}

export function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-link underline underline-offset-4">
      {children}
    </Link>
  );
}

/** Adresse isolée de gauche à droite : dans une phrase arabe, ses points et son @ resteraient sinon à l'envers. */
export function SupportEmail() {
  return (
    <a dir="ltr" href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-link underline underline-offset-4">
      {SUPPORT_EMAIL}
    </a>
  );
}
