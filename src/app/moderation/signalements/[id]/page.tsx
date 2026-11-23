import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DoneToast } from "@/components/moderation/DoneToast";
import { Age, NextLink, ReasonBadge, SongTitles, doneMessage, person, personLabel, reporterLabel } from "@/components/moderation/parts";
import { ReportForm } from "@/components/moderation/ReportForm";
import { RestoreSongForm } from "@/components/moderation/RestoreSongForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { ArtistNames } from "@/components/song/ArtistNames";
import { Badge } from "@/components/ui/Badge";
import { requireModerator } from "@/lib/moderation/gate";
import { compareReports, nextInQueue } from "@/lib/moderation/queue";
import { scriptAttrs } from "@/lib/text/scriptAttrs";
import { getReport, openReports } from "@/lib/moderation/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("moderation.report");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Un signalement (spec §9) : le motif, la chanson, qui l'a signalée et quand, les détails ; puis
 * retirer la chanson (retrait doux), la corriger ou classer sans suite, avec une note. Un signalement
 * déjà traité montre son statut et la note de traitement.
 */
export default async function ReportPage({ params, searchParams }: PageProps<"/moderation/signalements/[id]">) {
  const { id } = await params;
  await requireModerator(`/moderation/signalements/${id}`);
  const report = await getReport(id);
  if (!report) notFound();

  const [t, done] = await Promise.all([getTranslations("moderation"), doneMessage((await searchParams).statut)]);
  const { song } = report;
  const next = nextInQueue(await openReports(), report, compareReports);

  return (
    <>
      <PageHeader variant="sub" title={t("report.title")} backHref="/moderation/signalements" />
      <PageMain>
        <DoneToast message={done} />
        <div className="flex flex-col gap-8">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <ReasonBadge reason={report.reason} />
              <Badge tone={report.status === "open" ? "warning" : report.status === "resolved" ? "success" : "neutral"}>
                <span className="sr-only">{t("report.statusLabel")} </span>
                {t(`report.status.${report.status}`)}
              </Badge>
            </div>
            <div className="mt-3">
              <SongTitles titleAr={song.titleAr} titleLatin={song.titleLatin} as="h2" size="lg" />
            </div>
            <ArtistNames artists={song.artists} className="mt-1 block text-ink-2" />
            {song.published ? (
              <Link
                href={`/chanson/${song.id}`}
                className="-mx-2 mt-1 inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-medium text-link hover:bg-well"
              >
                {t("report.seeSong")}
                <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </Link>
            ) : (
              <p className="mt-3 rounded-md bg-warning-soft px-3 py-2 text-warning">{t("report.songRemoved")}</p>
            )}
          </header>

          <section aria-labelledby="details">
            <h2 id="details" className="text-lg font-medium">
              {t("report.details")}
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              {await reporterLabel(report)}
              <span aria-hidden="true"> · </span>
              <Age iso={report.createdAt} />
            </p>
            {report.contactEmail ? (
              <p className="mt-1 text-sm text-ink-2">
                {t("report.contact")}{" "}
                <a href={`mailto:${report.contactEmail}`} dir="ltr" className="font-medium text-link underline underline-offset-4">
                  {report.contactEmail}
                </a>
              </p>
            ) : null}
            {/* Le filet suit le sens de l'interface (sur la boîte), le texte celui de son écriture. */}
            <blockquote className="mt-3 rounded-lg border-s-4 border-line bg-well px-4 py-3 text-ink">
              <p {...scriptAttrs(report.details || t("report.noDetails"))}>{report.details || t("report.noDetails")}</p>
            </blockquote>
          </section>

          {report.status === "open" ? (
            <ReportForm reportId={report.id} songPublished={song.published} />
          ) : (
            <section className="rounded-lg bg-well p-4">
              <p className="text-sm font-medium text-ink-2">{t("report.resolutionNote")}</p>
              <p {...scriptAttrs(report.resolutionNote ?? "")} className="mt-1 text-ink">
                {report.resolutionNote}
              </p>
              <p className="mt-2 text-sm text-ink-2">
                {t.rich("report.resolvedBy", { name: await personLabel(report.resolvedByName), person })}
              </p>
            </section>
          )}

          {!song.published ? <RestoreSongForm reportId={report.id} /> : null}

          {next ? (
            <div className="flex justify-end">
              <NextLink href={`/moderation/signalements/${next.id}`} />
            </div>
          ) : null}
        </div>
      </PageMain>
    </>
  );
}
