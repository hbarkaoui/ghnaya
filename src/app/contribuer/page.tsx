import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ContributionForm } from "@/components/contribute/ContributionForm";
import { SimilarSongs } from "@/components/contribute/SimilarSongs";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { contributeHref, loginHref, prefillFromParams } from "@/lib/contribution/routes";
import { getCurrentUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contribute");
  return { title: t("title") };
}

/**
 * Proposer une chanson (IA, parcours 5) : titre pré-rempli depuis ?titre= (la recherche sans résultat
 * le transmet), artistes avec autocomplétion, encadré « existe peut-être déjà », paroles, dialecte,
 * translittération facultative et case des droits. Un visiteur passe d'abord par la connexion.
 */
export default async function ContributePage({ searchParams }: PageProps<"/contribuer">) {
  const raw = await searchParams;
  const prefill = prefillFromParams({ titre: raw.titre, artiste: raw.artiste });
  const user = await getCurrentUser();
  // Tâche 16 : AuthGate remplacera ce renvoi.
  if (!user) redirect(loginHref(contributeHref(prefill)));

  const t = await getTranslations("contribute");
  const titles = [prefill.titleAr, prefill.titleLatin].filter(Boolean);
  // L'encadré apparaît dès qu'un titre et un artiste sont saisis (IA, « Proposer une chanson »).
  const similar =
    titles.length > 0 && prefill.artists.length > 0 ? (
      <Suspense fallback={null}>
        <SimilarSongs titles={titles} artists={prefill.artists} />
      </Suspense>
    ) : null;

  return (
    <>
      <PageHeader variant="sub" title={t("title")} backHref="/moi" backToHistory />
      <PageMain>
        <p className="mb-6 text-ink-2">{t("intro")}</p>
        <ContributionForm
          songId={null}
          initial={{ ...prefill, lyrics: "", dialect: "", translit: "" }}
          similar={similar}
        />
      </PageMain>
    </>
  );
}
