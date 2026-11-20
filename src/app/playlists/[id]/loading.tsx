import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { LoadingStatus, SkeletonBar, SkeletonRows } from "@/components/ui/Skeleton";

/**
 * Chargement d'une playlist : couverture, nom et club, « Lire depuis le début », puis la liste
 * numérotée. Le retour suit l'historique : on ne sait pas encore si la playlist est d'un club.
 */
export default async function PlaylistLoading() {
  const t = await getTranslations("system.loading");
  return (
    <>
      <PageHeader variant="sub" backHref="/playlists" backToHistory />
      <PageMain>
        <LoadingStatus label={t("playlist")}>
          <div className="flex items-center gap-4">
            <SkeletonBar className="size-16 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <SkeletonBar className="h-7 w-2/3" />
              <SkeletonBar className="h-4 w-2/5" />
            </div>
          </div>
          <SkeletonBar className="mt-5 h-12 w-full rounded-md" />
          <div className="mt-6">
            <SkeletonRows rows={5} leading="number" />
          </div>
        </LoadingStatus>
      </PageMain>
    </>
  );
}
