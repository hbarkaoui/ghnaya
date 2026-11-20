import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Modération inaccessible (membre qui n'est pas modérateur), proposition ou signalement inconnus :
 * une page introuvable, sans dire laquelle des raisons s'applique.
 */
export default async function ModerationNotFound() {
  const t = await getTranslations("moderation.notFound");
  return (
    <>
      <PageHeader variant="sub" backHref="/moi" />
      <PageMain>
        <EmptyState titleAs="h1" title={t("title")} body={t("body")} action={{ label: t("action"), href: "/" }} />
      </PageMain>
    </>
  );
}
