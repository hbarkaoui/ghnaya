import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rightsPage");
  return { title: t("title"), description: t("metaDescription") };
}

/** Nom d'une source ou d'une action, isolé : « LRCLIB » garde son sens d'écriture dans une phrase arabe. */
const strong = (chunks: ReactNode) => (
  <strong dir="auto" className="font-medium text-ink">
    {chunks}
  </strong>
);

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-lg font-medium text-ink">
        {title}
      </h2>
      <div className="mt-2 flex flex-col gap-3 text-ink leading-relaxed">{children}</div>
    </section>
  );
}

/**
 * Vos droits et le retrait de contenus (spec §9 : « décrit la procédure de retrait ») : page de texte
 * sobre, ouverte à tous. Ce que Ghnaya publie, comment demander un retrait, ce qui se passe ensuite
 * (retrait doux, réversible par un modérateur) et les autres signalements.
 * Le grand titre est porté par la page : il est trop long pour l'en-tête à 375 px.
 */
export default async function RightsPage() {
  const t = await getTranslations("rightsPage");

  return (
    <>
      <PageHeader variant="sub" backHref="/moi" backToHistory />
      <PageMain>
        <h1 className="font-display text-2xl leading-snug font-semibold text-balance">{t("title")}</h1>
        <p className="mt-3 text-md text-ink-2 leading-relaxed">{t("lead")}</p>

        <Section id="droits-publication" title={t("publish.title")}>
          <p>{t("publish.body")}</p>
          <ul className="flex list-disc flex-col gap-2 ps-6 marker:text-ink-3">
            <li>{t.rich("publish.lrclib", { source: strong })}</li>
            <li>{t.rich("publish.publicDomain", { source: strong })}</li>
            <li>{t.rich("publish.contribution", { source: strong })}</li>
          </ul>
        </Section>

        <Section id="droits-demande" title={t("request.title")}>
          <ol className="flex list-decimal flex-col gap-2 ps-6 marker:text-ink-2">
            <li>{t.rich("request.open", { strong })}</li>
            <li>{t.rich("request.reason", { strong })}</li>
            <li>{t("request.details")}</li>
            <li>{t("request.email")}</li>
          </ol>
        </Section>

        <Section id="droits-ensuite" title={t("after.title")}>
          <p>{t("after.body")}</p>
          <ul className="flex list-disc flex-col gap-2 ps-6 marker:text-ink-3">
            <li>{t("after.remove")}</li>
            <li>{t("after.correct")}</li>
            <li>{t("after.dismiss")}</li>
          </ul>
          <p>{t("after.contact")}</p>
        </Section>

        <Section id="droits-reversible" title={t("reversible.title")}>
          <p>{t("reversible.hidden")}</p>
          <p>{t("reversible.restore")}</p>
        </Section>

        <Section id="droits-autres" title={t("other.title")}>
          <p>{t("other.body")}</p>
        </Section>

        <Link
          href="/recherche"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-line px-5 font-medium text-ink transition-colors duration-(--duration-fast) hover:bg-well"
        >
          <Search aria-hidden="true" className="size-5" />
          {t("searchAction")}
        </Link>
      </PageMain>
    </>
  );
}
