import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DoneToast } from "@/components/moderation/DoneToast";
import { ModerationItem } from "@/components/moderation/ModerationItem";
import { Age, ModerationTabs, ReasonBadge, SongTitles, doneMessage, reporterLabel } from "@/components/moderation/parts";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { Badge } from "@/components/ui/Badge";
import { Bidi } from "@/components/ui/Bidi";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireModerator } from "@/lib/moderation/gate";
import { moderationCounts, openReports, treatedReports } from "@/lib/moderation/queries";
import type { Report } from "@/types/report";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("moderation");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Modération, sous-onglet Signalements (spec §9, IA) : les signalements ouverts, droits d'auteur en
 * tête puis par ancienneté. Les signalements déjà traités restent consultables, repliés en bas.
 */
export default async function ReportsPage({ searchParams }: PageProps<"/moderation/signalements">) {
  await requireModerator("/moderation/signalements");
  const [t, done] = await Promise.all([getTranslations("moderation"), doneMessage((await searchParams).statut)]);
  const [queue, treated, counts] = await Promise.all([openReports(), treatedReports(), moderationCounts()]);

  return (
    <>
      <PageHeader variant="sub" title={t("title")} backHref="/moi" />
      <PageMain>
        <DoneToast message={done} />
        <ModerationTabs />
        <div className="mt-6">
          {queue.length === 0 ? (
            <EmptyState
              title={t("empty.title")}
              body={t("empty.reportsBody")}
              action={counts.proposals > 0 ? { label: t("empty.toProposals"), href: "/moderation" } : undefined}
            />
          ) : (
            <>
              <p className="text-ink-2">{t("queue.reportsIntro", { count: queue.length, n: String(queue.length) })}</p>
              <ol className="mt-4 flex flex-col gap-3">
                {await Promise.all(queue.map((report) => <ReportItem key={report.id} report={report} />))}
              </ol>
            </>
          )}

          {treated.length > 0 ? (
            <details className="group mt-8">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
                <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
                {t("queue.treated", { count: treated.length, n: String(treated.length) })}
              </summary>
              <ul className="mt-3 flex flex-col gap-3">
                {await Promise.all(treated.map((report) => <ReportItem key={report.id} report={report} />))}
              </ul>
            </details>
          ) : null}
        </div>
      </PageMain>
    </>
  );
}

async function ReportItem({ report }: { report: Report }) {
  const t = await getTranslations("moderation");
  const song = report.song;
  const reporter = await reporterLabel(report);

  return (
    <ModerationItem
      href={`/moderation/signalements/${report.id}`}
      badges={
        <>
          <ReasonBadge reason={report.reason} />
          {report.status !== "open" ? (
            <Badge tone={report.status === "resolved" ? "success" : "neutral"}>
              <span className="sr-only">{t("report.statusLabel")} </span>
              {t(`report.status.${report.status}`)}
            </Badge>
          ) : null}
        </>
      }
      title={<SongTitles titleAr={song.titleAr} titleLatin={song.titleLatin} />}
      meta={
        <>
          {reporter}
          <span aria-hidden="true"> · </span>
          <Age iso={report.createdAt} />
        </>
      }
      excerpt={report.details ? <Bidi>{report.details}</Bidi> : undefined}
    />
  );
}
