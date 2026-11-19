import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArtistNames } from "@/components/song/ArtistNames";
import { getSong } from "@/mocks/catalog";
import { formatProposalDate } from "@/mocks/proposals";
import type { ArtistRef } from "@/types/catalog";
import type { Proposal } from "@/types/proposal";
import { ProposalStatusBadge } from "./ProposalStatusBadge";

/** Artistes proposés, affichables par ArtistNames (sans lien : un nouvel artiste n'a pas encore de page). */
const displayArtists = (proposal: Proposal): ArtistRef[] =>
  proposal.payload.artists.map((a, i) => ({ ...a, id: a.id ?? `nouveau-${i}`, role: "main" }));

/**
 * Une proposition dans Mes contributions : type et date, statut, titres et artistes proposés ; la note
 * du modérateur pour un refus ; le lien vers la chanson pour une correction.
 */
export async function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [t, locale] = await Promise.all([getTranslations("contributions"), getLocale()]);
  const { titleAr, titleLatin } = proposal.payload;
  const song = proposal.songId ? getSong(proposal.songId) : undefined;

  return (
    <li className="rounded-lg border border-line-subtle bg-card p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ProposalStatusBadge status={proposal.status} />
        <span className="text-sm text-ink-2">{t(`type.${proposal.songId ? "correction" : "addition"}`)}</span>
      </div>
      <h2 className="mt-2">
        {titleAr ? (
          <span className="block text-md font-medium">
            <span lang="ar" dir="rtl">
              {titleAr}
            </span>
          </span>
        ) : null}
        {titleLatin ? (
          <span className={`block ${titleAr ? "text-ink-2" : "text-md font-medium"}`}>
            <span dir="ltr">{titleLatin}</span>
          </span>
        ) : null}
      </h2>
      <ArtistNames artists={displayArtists(proposal)} className="mt-0.5 block text-sm text-ink-2" />
      <p className="mt-2 text-sm text-ink-2">
        {t("proposedOn", { date: formatProposalDate(proposal.createdAt, locale) })}
      </p>

      {proposal.status === "rejected" && proposal.reviewNote ? (
        <div className="mt-3 rounded-md bg-well p-3">
          <p className="text-sm font-medium text-ink-2">{t("reviewNote")}</p>
          <p dir="auto" className="mt-1 text-ink">
            {proposal.reviewNote}
          </p>
        </div>
      ) : null}

      {song ? (
        <Link
          href={`/chanson/${song.id}`}
          className="-mx-2 mt-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-medium text-link hover:bg-well"
        >
          {t("seeSong")}
          <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        </Link>
      ) : null}
    </li>
  );
}
