import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { LoadingStatus, SkeletonBar, SkeletonRows } from "@/components/ui/Skeleton";

/**
 * Chargement de l'onglet Clubs : un titre et des lignes de club en squelette, sans texte réel, car le
 * titre dépend du rôle (« Clubs » pour un animateur ; un membre est ensuite renvoyé vers son club).
 */
export default async function ClubsLoading() {
  const t = await getTranslations("system.loading");
  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <LoadingStatus label={t("clubs")}>
          <SkeletonBar className="h-8 w-1/3" />
          <div className="mt-6">
            <SkeletonRows rows={3} leading="cover" />
          </div>
        </LoadingStatus>
      </PageMain>
    </>
  );
}
