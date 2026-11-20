import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { NotFoundView } from "@/components/system/NotFoundView";

/** Club inconnu, supprimé, ou dont on ne fait pas partie : un club est privé, on ne dit pas lequel des trois. */
export default async function ClubNotFound() {
  const t = await getTranslations("clubs.notFound");
  return (
    <NotFoundView
      title={t("title")}
      body={t("body")}
      primary="home"
      header={<PageHeader variant="sub" backHref="/clubs" />}
    />
  );
}
