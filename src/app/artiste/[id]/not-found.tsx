import { getTranslations } from "next-intl/server";
import { NotFoundView } from "@/components/system/NotFoundView";

/** Artiste inconnu, ou sans chanson publiée (IA, pages système) : la recherche passe en premier. */
export default async function ArtistNotFound() {
  const t = await getTranslations("artist");
  return <NotFoundView title={t("notFoundTitle")} body={t("notFoundBody")} primary="search" secondary="home" />;
}
