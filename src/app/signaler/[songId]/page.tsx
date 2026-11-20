import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ReportForm } from "@/components/report/ReportForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { ArtistNames } from "@/components/song/ArtistNames";
import { getCurrentUser } from "@/lib/session";
import { getSong } from "@/mocks/catalog";

export async function generateMetadata({ params }: PageProps<"/signaler/[songId]">): Promise<Metadata> {
  const { songId } = await params;
  const t = await getTranslations();
  return {
    title: getSong(songId) ? t("reportForm.metaTitle") : t("song.notFoundMeta"),
    robots: { index: false },
  };
}

/**
 * Signaler une chanson (IA, parcours 7 ; spec §9) : ouvert à tous. Un visiteur laisse une adresse
 * e-mail, un membre connecté signale avec son compte. Chanson inconnue ou retirée : la 404 du segment.
 */
export default async function ReportPage({ params }: PageProps<"/signaler/[songId]">) {
  const { songId } = await params;
  const song = getSong(songId);
  if (!song) notFound();
  const [t, user] = await Promise.all([getTranslations("reportForm"), getCurrentUser()]);

  return (
    <>
      <PageHeader variant="sub" title={t("title")} backHref={`/chanson/${song.id}`} backToHistory />
      <PageMain>
        <section aria-labelledby="chanson-signalee" className="rounded-lg border border-line-subtle bg-card p-4">
          <h2 id="chanson-signalee" className="text-sm text-ink-2">
            {t("songLabel")}
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
        <ReportForm songId={song.id} memberName={user?.name ?? null} />
      </PageMain>
    </>
  );
}
