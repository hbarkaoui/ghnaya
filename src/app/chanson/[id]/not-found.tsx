import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Chanson inconnue ou retirée (IA, pages système) : pour la fiche comme pour son mode séance.
 * Next.js répond en 404 et ajoute `noindex`.
 */
export default async function SongNotFound() {
  const t = await getTranslations("song");

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <EmptyState
          titleAs="h1"
          title={t("notFoundTitle")}
          body={t("notFoundBody")}
          action={{ label: t("notFoundAction"), href: "/recherche", icon: <Search aria-hidden="true" className="size-4" /> }}
        />
      </PageMain>
    </>
  );
}
