import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";

/** Club inconnu, supprimé, ou dont on ne fait pas partie : un club est privé, on ne dit pas lequel des trois. */
export default async function ClubNotFound() {
  const t = await getTranslations("clubs.notFound");
  return (
    <>
      <PageHeader variant="sub" backHref="/clubs" />
      <PageMain>
        <EmptyState titleAs="h1" title={t("title")} body={t("body")} action={{ label: t("action"), href: "/" }} />
      </PageMain>
    </>
  );
}
