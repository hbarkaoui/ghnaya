import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NotFoundView } from "@/components/system/NotFoundView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("system.notFound");
  return { title: t("metaTitle") };
}

/**
 * 404 générale : toute adresse inconnue (une adresse mal recopiée) et tout `notFound()` sans
 * not-found.tsx plus proche.
 */
export default async function NotFound() {
  const t = await getTranslations("system.notFound");
  return <NotFoundView title={t("title")} body={t("body")} primary="home" secondary="search" />;
}
