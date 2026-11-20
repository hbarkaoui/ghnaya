import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { LoadingStatus, SkeletonBar, SkeletonRows } from "@/components/ui/Skeleton";

/** Chargement de « Mes playlists » : le vrai en-tête (titre connu d'avance), la phrase et les cartes en squelette. */
export default async function MyPlaylistsLoading() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader variant="sub" title={t("myPlaylists.title")} backHref="/moi" />
      <PageMain>
        <LoadingStatus label={t("system.loading.playlists")}>
          <SkeletonBar className="mb-4 h-4 w-3/4" />
          <SkeletonRows rows={3} leading="cover" trailing="button" />
        </LoadingStatus>
      </PageMain>
    </>
  );
}
