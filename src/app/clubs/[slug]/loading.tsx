import { getTranslations } from "next-intl/server";
import { ListSkeleton } from "@/components/ui/Skeleton";

/**
 * Chargement d'un sous-onglet du club : la mise en page du club (couverture, nom, sous-onglets) est
 * déjà là ; seule la liste en dessous est en squelette (cartes de playlist).
 */
export default async function ClubTabLoading() {
  const t = await getTranslations("system.loading");
  return <ListSkeleton label={t("club")} rows={3} leading="cover" trailing="button" />;
}
