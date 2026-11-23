import { ChevronRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ProposalStatusBadge } from "@/components/contribute/ProposalStatusBadge";
import { DiffView, LyricsBlock } from "@/components/moderation/DiffView";
import { DoneToast } from "@/components/moderation/DoneToast";
import {
  Age,
  NextLink,
  OwnBadge,
  ProposalTypeBadge,
  SongTitles,
  doneMessage,
  person,
  personLabel,
} from "@/components/moderation/parts";
import { ReviewForm } from "@/components/moderation/ReviewForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { ArtistNames } from "@/components/song/ArtistNames";
import { canApproveRevision } from "@/lib/auth/permissions";
import { songLabelsOf } from "@/lib/catalog/queries";
import { changedFields, type ComparedField } from "@/lib/moderation/apply";
import { formatProposalDate } from "@/lib/moderation/age";
import { requireModerator } from "@/lib/moderation/gate";
import { getRevision, pendingRevisions } from "@/lib/moderation/queries";
import { compareProposals, nextInQueue } from "@/lib/moderation/queue";
import { scriptAttrs } from "@/lib/text/scriptAttrs";
import { getSong } from "@/lib/catalog/read";
import type { ArtistRef, Song } from "@/types/catalog";
import type { Revision } from "@/types/proposal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("moderation.proposal");
  return { title: t("title"), robots: { index: false } };
}

/** Artistes proposés, affichables par ArtistNames (un nouvel artiste n'a pas encore d'identifiant). */
const displayArtists = (proposal: Revision): ArtistRef[] =>
  proposal.payload.artists.map((a, i) => ({ ...a, id: a.id ?? `nouveau-${i}`, role: "main" }));

/**
 * Une proposition, côté modération (IA) : le type, l'auteur et l'ancienneté ; la vue des différences
 * (paroles ligne par ligne, plus les champs modifiés pour une correction) ; Approuver, ou Rejeter avec
 * une note ; « Suivante » pour enchaîner sans décider. Après une décision, l'action ouvre la suivante.
 */
export default async function ProposalReviewPage({ params, searchParams }: PageProps<"/moderation/[revisionId]">) {
  const { revisionId } = await params;
  const user = await requireModerator(`/moderation/${revisionId}`);
  const proposal = await getRevision(revisionId);
  if (!proposal) notFound();

  const [t, locale, done] = await Promise.all([
    getTranslations("moderation"),
    getLocale(),
    doneMessage((await searchParams).statut),
  ]);
  const queue = await pendingRevisions();
  const index = queue.findIndex((p) => p.id === proposal.id);
  const next = nextInQueue(queue, proposal, compareProposals);
  const isCorrection = proposal.songId !== null;
  const song = proposal.songId ? await getSong(proposal.songId) : undefined;
  const songRemoved =
    proposal.songId && !song ? (await songLabelsOf([proposal.songId])).get(proposal.songId)?.removed === true : false;
  const own = proposal.authorId === user.id;
  const { payload } = proposal;

  return (
    <>
      <PageHeader variant="sub" title={t("proposal.title")} backHref="/moderation" />
      <PageMain>
        <DoneToast message={done} />
        <div className="flex flex-col gap-8">
          <header>
            {index >= 0 ? (
              <p className="text-sm font-medium text-ink-2">
                {t("position", { i: String(index + 1), n: String(queue.length) })}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ProposalTypeBadge correction={isCorrection} />
              {own ? <OwnBadge /> : null}
              {proposal.status !== "pending" ? <ProposalStatusBadge status={proposal.status} /> : null}
            </div>
            <div className="mt-3">
              <SongTitles titleAr={payload.titleAr} titleLatin={payload.titleLatin} as="h2" size="lg" />
            </div>
            <ArtistNames artists={displayArtists(proposal)} className="mt-1 block text-ink-2" />
            <p className="mt-2 text-sm text-ink-2">
              {t.rich("by", { name: await personLabel(proposal.authorName), person })}
              <span aria-hidden="true"> · </span>
              <Age iso={proposal.createdAt} />
            </p>
            {song ? (
              <Link
                href={`/chanson/${song.id}`}
                className="-mx-2 mt-1 inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-medium text-link hover:bg-well"
              >
                {t("proposal.seeSong")}
                <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </Link>
            ) : null}
            {songRemoved ? <p className="mt-2 rounded-md bg-warning-soft px-3 py-2 text-warning">{t("report.songRemoved")}</p> : null}
            <p className="mt-3 flex items-start gap-2 text-sm text-ink-2">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {t("proposal.rights")}
            </p>
          </header>

          {proposal.status !== "pending" ? (
            <section className="rounded-lg bg-well p-4">
              <p className="text-ink-2">
                {proposal.reviewedAt
                  ? t("proposal.reviewedOn", { date: formatProposalDate(proposal.reviewedAt, locale) })
                  : null}
              </p>
              {proposal.reviewNote ? (
                <>
                  <p className="mt-2 text-sm font-medium text-ink-2">{t("proposal.reviewNote")}</p>
                  <p {...scriptAttrs(proposal.reviewNote ?? "")} className="mt-1 text-ink">
                    {proposal.reviewNote}
                  </p>
                </>
              ) : null}
            </section>
          ) : null}

          {song ? <ChangedFields proposal={proposal} song={song} /> : null}

          <section aria-labelledby="paroles">
            <h2 id="paroles" className="text-lg font-medium">
              {song ? t("proposal.lyricsTitle") : t("proposal.proposedLyrics")}
            </h2>
            <div className="mt-3">
              {song ? (
                <DiffView before={song.lyrics} after={payload.lyrics} unchangedLabel={t("diff.unchanged")} />
              ) : (
                <LyricsBlock text={payload.lyrics} />
              )}
            </div>
          </section>

          {!song && payload.lyricsTranslit ? (
            <section aria-labelledby="translit">
              <h2 id="translit" className="text-lg font-medium">
                {t("proposal.proposedTranslit")}
              </h2>
              <div className="mt-3">
                <LyricsBlock text={payload.lyricsTranslit} script="latin" />
              </div>
            </section>
          ) : null}

          {proposal.status === "pending" ? <ReviewForm proposalId={proposal.id} canApprove={canApproveRevision(user, proposal)} /> : null}

          {next ? (
            <div className="flex justify-end">
              <NextLink href={`/moderation/${next.id}`} />
            </div>
          ) : null}
        </div>
      </PageMain>
    </>
  );
}

/**
 * Champs modifiés par une correction, hors paroles (spec §8.4) : avant / après, chacun avec son
 * libellé. La translittération modifiée a sa propre vue des différences, en latin.
 */
async function ChangedFields({ proposal, song }: { proposal: Revision; song: Song }) {
  const [t, tDialects] = await Promise.all([getTranslations("moderation.proposal"), getTranslations("dialects")]);
  const fields = changedFields(proposal.payload, song);
  const shown = fields.filter((f) => f !== "translit");
  const { payload } = proposal;

  const value = async (field: Exclude<ComparedField, "translit">, side: "before" | "after") => {
    const none = <span className="text-ink-3">{t("none")}</span>;
    if (field === "titleAr") {
      const title = side === "before" ? song.titleAr : payload.titleAr;
      return title ? <span lang="ar" dir="rtl">{title}</span> : none;
    }
    if (field === "titleLatin") {
      const title = side === "before" ? song.titleLatin : payload.titleLatin;
      return title ? <span dir="ltr">{title}</span> : none;
    }
    if (field === "dialect") return tDialects(side === "before" ? song.dialect : payload.dialect);
    const artists = side === "before" ? song.artists : displayArtists(proposal);
    return artists.length > 0 ? <ArtistNames artists={artists} /> : none;
  };

  if (fields.length === 0) return null;

  return (
    <section aria-labelledby="champs" className="flex flex-col gap-6">
      {shown.length > 0 ? (
        <div>
          <h2 id="champs" className="text-lg font-medium">
            {t("fieldsTitle")}
          </h2>
          <dl className="mt-3 flex flex-col gap-3">
            {await Promise.all(
              shown.map(async (field) => (
                <div key={field} className="rounded-lg border border-line-subtle bg-card p-3">
                  <dt className="font-medium">{t(`fields.${field}`)}</dt>
                  <dd className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <span className="text-sm text-error">
                      <span aria-hidden="true">− </span>
                      {t("before")}
                    </span>
                    <span className="min-w-0">{await value(field, "before")}</span>
                    <span className="text-sm text-success">
                      <span aria-hidden="true">+ </span>
                      {t("after")}
                    </span>
                    <span className="min-w-0">{await value(field, "after")}</span>
                  </dd>
                </div>
              )),
            )}
          </dl>
        </div>
      ) : null}
      {fields.includes("translit") ? (
        <div>
          <h2 id={shown.length > 0 ? undefined : "champs"} className="text-lg font-medium">
            {t("translitTitle")}
          </h2>
          <div className="mt-3">
            <DiffView
              before={song.lyricsTranslit ?? ""}
              after={payload.lyricsTranslit ?? ""}
              script="latin"
              unchangedLabel={t("translitTitle")}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
