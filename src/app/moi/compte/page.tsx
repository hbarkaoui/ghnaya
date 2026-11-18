import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

/** Page de second niveau : montre la variante « retour + titre » de l'en-tête. */
export default async function AccountPage() {
  const t = await getTranslations("account");

  return (
    <>
      <PageHeader variant="sub" title={t("title")} backHref="/moi" />
      <PageMain>
        <p className="text-ink-2">{t("intro")}</p>
      </PageMain>
    </>
  );
}
