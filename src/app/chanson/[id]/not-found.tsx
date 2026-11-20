import { getTranslations } from "next-intl/server";
import { NotFoundView } from "@/components/system/NotFoundView";

/**
 * Chanson inconnue ou retirée (IA, pages système) : pour la fiche comme pour son mode séance, et pour
 * /contribuer/[songId]. Même page que la 404 générale, mais la recherche passe en premier.
 */
export default async function SongNotFound() {
  const t = await getTranslations("song");
  return <NotFoundView title={t("notFoundTitle")} body={t("notFoundBody")} primary="search" secondary="home" />;
}
