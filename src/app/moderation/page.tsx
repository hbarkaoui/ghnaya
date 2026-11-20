import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DoneToast } from "@/components/moderation/DoneToast";
import { ModerationItem } from "@/components/moderation/ModerationItem";
import {
  Age,
  ModerationTabs,
  OwnBadge,
  ProposalTypeBadge,
  SongTitles,
  doneMessage,
  personLabel,
} from "@/components/moderation/parts";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireModerator } from "@/lib/moderation/gate";
import { openReports, pendingProposals } from "@/mocks/moderation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("moderation");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Modération, sous-onglet Propositions (IA, parcours 6) : la file des propositions en attente, de la
 * plus ancienne à la plus récente, chacune avec son type, son auteur et son ancienneté. File vide :
 * « Plus rien à relire ». Réservé aux modérateurs.
 */
export default async function ModerationPage({ searchParams }: PageProps<"/moderation">) {
  const user = await requireModerator("/moderation");
  const [t, done] = await Promise.all([getTranslations("moderation"), doneMessage((await searchParams).statut)]);
  const queue = pendingProposals();
  const reportsWaiting = openReports().length;

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
              body={t("empty.proposalsBody")}
              action={reportsWaiting > 0 ? { label: t("empty.toReports"), href: "/moderation/signalements" } : undefined}
            />
          ) : (
            <>
              <p className="text-ink-2">{t("queue.proposalsIntro", { count: queue.length, n: String(queue.length) })}</p>
              <ol className="mt-4 flex flex-col gap-3">
                {await Promise.all(
                  queue.map(async (proposal) => (
                    <ModerationItem
                      key={proposal.id}
                      href={`/moderation/${proposal.id}`}
                      badges={
                        <>
                          <ProposalTypeBadge correction={proposal.songId !== null} />
                          {proposal.authorId === user.id ? <OwnBadge /> : null}
                        </>
                      }
                      title={<SongTitles titleAr={proposal.payload.titleAr} titleLatin={proposal.payload.titleLatin} />}
                      meta={
                        <>
                          {t("by", { name: await personLabel(proposal.authorId) })}
                          <span aria-hidden="true"> · </span>
                          <Age iso={proposal.createdAt} />
                        </>
                      }
                    />
                  )),
                )}
              </ol>
            </>
          )}
        </div>
      </PageMain>
    </>
  );
}
