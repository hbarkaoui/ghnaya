import { House } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Playlist introuvable : identifiant inconnu, playlist d'un club dont on n'est pas membre, ou playlist
 * personnelle d'un autre. On ne dit pas laquelle, pour ne rien révéler d'un club privé.
 * Next.js répond en 404 et ajoute `noindex`.
 */
export default async function PlaylistNotFound() {
  const t = await getTranslations("playlistPage");

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <EmptyState
          titleAs="h1"
          title={t("notFoundTitle")}
          body={t("notFoundBody")}
          action={{ label: t("notFoundAction"), href: "/", icon: <House aria-hidden="true" className="size-4" /> }}
        />
      </PageMain>
    </>
  );
}
