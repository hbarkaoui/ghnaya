import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clubs");
  return { title: t("title") };
}

export default async function ClubsPage() {
  const t = await getTranslations("clubs");

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <h1 className="text-2xl font-medium">{t("title")}</h1>
        <p className="mt-2 text-ink-2">{t("intro")}</p>
      </PageMain>
    </>
  );
}
