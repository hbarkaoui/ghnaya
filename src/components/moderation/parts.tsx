import { ChevronRight, Copyright, FilePlus2, Flag, PencilLine, UserRound } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Bidi } from "@/components/ui/Bidi";
import { SubTabs } from "@/components/ui/SubTabs";
import { Badge } from "@/components/ui/Badge";
import { formatAge, formatProposalDate } from "@/lib/moderation/age";
import { moderationCounts } from "@/lib/moderation/queries";
import type { ReportReason } from "@/mocks/reports";
import type { Song } from "@/types/catalog";

/** Sous-onglets Propositions · Signalements, avec le nombre d'éléments en file de chacun. */
export async function ModerationTabs() {
  const [t, counts] = await Promise.all([getTranslations("moderation.tabs"), moderationCounts()]);
  return (
    <SubTabs
      label={t("label")}
      items={[
        { href: "/moderation", label: t("proposals", { n: String(counts.proposals) }) },
        { href: "/moderation/signalements", label: t("reports", { n: String(counts.reports) }) },
      ]}
    />
  );
}

/** Ancienneté (« il y a 3 jours »), avec la date complète en info-bulle et pour les lecteurs d'écran. */
export async function Age({ iso }: { iso: string }) {
  const locale = await getLocale();
  return (
    <time dateTime={iso} title={formatProposalDate(iso, locale)}>
      {formatAge(iso, new Date(), locale)}
    </time>
  );
}

/** Nom d'une personne ; « un compte supprimé » si son compte n'existe plus (spec §12, écart 1). */
export async function personLabel(name: string | null): Promise<string> {
  const t = await getTranslations("moderation");
  return name ?? t("unknownAuthor");
}

/** Balise `<person>` des messages (« Proposée par <person>{name}</person> ») : nom isolé et balisé selon son écriture. */
export const person = (chunks: ReactNode) => <Bidi>{chunks}</Bidi>;

/** Toast de confirmation après une décision (`?statut=`), ou rien. */
export async function doneMessage(raw: string | string[] | undefined): Promise<string | null> {
  const t = await getTranslations("moderation.done");
  const status = Array.isArray(raw) ? raw[0] : raw;
  return status === "approved" || status === "rejected" || status === "removed" || status === "dismissed"
    ? t(status)
    : null;
}

/** Type d'une proposition : ajout ou correction, avec une icône et un libellé. */
export async function ProposalTypeBadge({ correction }: { correction: boolean }) {
  const t = await getTranslations("moderation");
  const Icon = correction ? PencilLine : FilePlus2;
  return (
    <Badge tone={correction ? "info" : "neutral"} icon={<Icon aria-hidden="true" className="size-3.5" />}>
      <span className="sr-only">{t("typeLabel")} </span>
      {t(`type.${correction ? "correction" : "addition"}`)}
    </Badge>
  );
}

/** Motif d'un signalement : les droits d'auteur ressortent (ils passent en tête de file). */
export async function ReasonBadge({ reason }: { reason: ReportReason }) {
  const t = await getTranslations("moderation.report");
  const copyright = reason === "copyright";
  const Icon = copyright ? Copyright : Flag;
  return (
    <Badge tone={copyright ? "error" : "warning"} icon={<Icon aria-hidden="true" className="size-3.5" />}>
      <span className="sr-only">{t("reasonLabel")} </span>
      {t(`reasons.${reason}`)}
    </Badge>
  );
}

/** Pastille « Votre proposition » : un modérateur ne peut pas l'approuver lui-même. */
export async function OwnBadge() {
  const t = await getTranslations("moderation");
  return (
    <Badge tone="warning" icon={<UserRound aria-hidden="true" className="size-3.5" />}>
      {t("own")}
    </Badge>
  );
}

/** Titres arabe et latin d'une chanson ou d'une proposition, chacun dans son sens d'écriture. */
export function SongTitles({
  titleAr,
  titleLatin,
  as: Tag = "p",
  size = "md",
}: Pick<Song, "titleAr" | "titleLatin"> & { as?: "p" | "h1" | "h2"; size?: "md" | "lg" }) {
  const main = size === "lg" ? "font-display text-2xl leading-snug font-semibold" : "text-md font-medium";
  return (
    <Tag>
      {titleAr ? (
        <span className={`block ${main}`}>
          <span lang="ar" dir="rtl">
            {titleAr}
          </span>
        </span>
      ) : null}
      {titleLatin ? (
        <span className={`block ${titleAr ? (size === "lg" ? "mt-1 text-lg text-ink-2" : "text-ink-2") : main}`}>
          <span dir="ltr">{titleLatin}</span>
        </span>
      ) : null}
    </Tag>
  );
}

/** Lien « Suivante » (passer à l'élément suivant de la file sans décider). */
export async function NextLink({ href }: { href: string }) {
  const t = await getTranslations("moderation");
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-4 font-medium text-ink hover:bg-well"
    >
      {t("next")}
      <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
    </Link>
  );
}
