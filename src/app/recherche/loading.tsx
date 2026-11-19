import { getTranslations } from "next-intl/server";
import { ResultsSkeleton, SearchBarSkeleton } from "@/components/search/ResultsSkeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

/** Chargement de /recherche, en arrivant d'une autre page : en-tête, barre et résultats en squelette. */
export default async function SearchLoading() {
  const t = await getTranslations("search");

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <h1 className="sr-only">{t("title")}</h1>
        <SearchBarSkeleton />
        <ResultsSkeleton label={t("loading")} />
      </PageMain>
    </>
  );
}
