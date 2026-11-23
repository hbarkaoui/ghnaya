import { Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ContributionForm } from "@/components/contribute/ContributionForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { ArtistNames } from "@/components/song/ArtistNames";
import { formValuesFromSong } from "@/lib/contribution/correction";
import { contributionsHref, loginHref } from "@/lib/contribution/routes";
import { getCurrentUser } from "@/lib/session";
import { getSong } from "@/lib/catalog/read";
import { proposalStore } from "@/mocks/proposals";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contribute");
  return { title: t("correctionTitle") };
}

/**
 * Proposer une correction (spec §8.3) : le formulaire pré-rempli avec la chanson. Une seule correction
 * en attente par personne et par chanson : sinon, un message remplace le formulaire.
 * Chanson inconnue ou retirée : la 404 du segment.
 */
export default async function CorrectionPage({ params }: PageProps<"/contribuer/[songId]">) {
  const { songId } = await params;
  const song = await getSong(songId);
  if (!song) notFound();
  const user = await getCurrentUser();
  // Tâche 16 : AuthGate remplacera ce renvoi.
  if (!user) redirect(loginHref(`/contribuer/${song.id}`));

  const [t, locale] = await Promise.all([getTranslations("contribute"), getLocale()]);
  const pending = proposalStore.hasPending(user.id, song.id);

  return (
    <>
      <PageHeader variant="sub" title={t("correctionTitle")} backHref={`/chanson/${song.id}`} backToHistory />
      <PageMain>
        <section aria-labelledby="chanson-corrigee" className="rounded-lg border border-line-subtle bg-card p-4">
          <h2 id="chanson-corrigee" className="text-sm text-ink-2">
            {t("correcting")}
          </h2>
          <Link href={`/chanson/${song.id}`} className="mt-1 block font-medium text-link underline-offset-4 hover:underline">
            {song.titleAr ? (
              <span className="block text-md">
                <span lang="ar" dir="rtl">
                  {song.titleAr}
                </span>
              </span>
            ) : null}
            {song.titleLatin ? (
              <span className="block">
                <span dir="ltr">{song.titleLatin}</span>
              </span>
            ) : null}
          </Link>
          <ArtistNames artists={song.artists} className="mt-0.5 block text-sm text-ink-2" />
        </section>

        {pending ? (
          <div role="status" className="mt-6 flex items-start gap-3 rounded-lg bg-warning-soft p-4">
            <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-warning">{t("pendingTitle")}</p>
              <p className="mt-1 text-ink">{t("pendingBody")}</p>
              <Link
                href={contributionsHref({ status: "pending" })}
                className="mt-2 inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4"
              >
                {t("pendingAction")}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-6 mb-6 text-ink-2">{t("correctionIntro")}</p>
            <ContributionForm songId={song.id} initial={formValuesFromSong(song, locale)} />
          </>
        )}
      </PageMain>
    </>
  );
}
