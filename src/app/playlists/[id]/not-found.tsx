import { getTranslations } from "next-intl/server";
import { NotFoundView } from "@/components/system/NotFoundView";

/**
 * Playlist introuvable : identifiant inconnu, playlist d'un club dont on n'est pas membre, ou playlist
 * personnelle d'un autre. On ne dit pas laquelle, pour ne rien révéler d'un club privé.
 */
export default async function PlaylistNotFound() {
  const t = await getTranslations("playlistPage");
  return <NotFoundView title={t("notFoundTitle")} body={t("notFoundBody")} primary="home" />;
}
