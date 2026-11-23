import { Check, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProposalCard } from "@/components/contribute/ProposalCard";
import { SentConfirmation } from "@/components/contribute/SentConfirmation";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";
import { contributionsHref, loginHref, parseStatusFilter } from "@/lib/contribution/routes";
import { getCurrentUser } from "@/lib/session";
import { revisionsOf } from "@/lib/moderation/queries";
import { countByStatus } from "@/lib/moderation/queue";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/types/proposal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contributions");
  return { title: t("title") };
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Mes contributions (IA, `?statut=en-attente|acceptee|refusee`) : les propositions de la personne, de
 * la plus récente à la plus ancienne, filtrées par statut. Après un envoi (`?envoyee=`), la
 * confirmation « يعيشك » s'affiche en tête, au-dessus de la proposition en attente.
 */
export default async function MyContributionsPage({ searchParams }: PageProps<"/mes-contributions">) {
  const raw = await searchParams;
  const status = parseStatusFilter(raw.statut);
  const user = await getCurrentUser();
  // Tâche 16 : AuthGate remplacera ce renvoi.
  if (!user) redirect(loginHref(contributionsHref({ status })));

  const t = await getTranslations("contributions");
  const proposals = await revisionsOf(user.id);
  const counts = countByStatus(proposals);
  const shown = status ? proposals.filter((p) => p.status === status) : proposals;
  const sentId = first(raw.envoyee);
  const sent = sentId ? proposals.find((p) => p.id === sentId && p.status === "pending") : undefined;

  return (
    <>
      <PageHeader variant="sub" title={t("title")} backHref="/moi" />
      <PageMain>
        {sent ? <SentConfirmation thanks={t("sent.thanks")} title={t("sent.title")} body={t("sent.body")} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-2">{t("intro")}</p>
          <Link
            href="/contribuer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-medium text-ink hover:bg-well"
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("propose")}
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title={t("emptyTitle")}
              body={t("emptyBody")}
              action={{ label: t("propose"), href: "/contribuer", icon: <Plus aria-hidden="true" className="size-4" /> }}
            />
          </div>
        ) : (
          <>
            <nav aria-label={t("filterLabel")} className="mt-5">
              <ul className="flex flex-wrap gap-2">
                {([undefined, ...PROPOSAL_STATUSES] as const).map((s) => (
                  <StatusFilterLink
                    key={s ?? "all"}
                    status={s}
                    label={t(`filters.${s ?? "all"}`)}
                    count={counts[s ?? "all"]}
                    current={s === status}
                  />
                ))}
              </ul>
            </nav>

            {shown.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3">
                {shown.map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title={t(`emptyFiltered.${status ?? "pending"}`)}
                  body={t("emptyFilteredBody")}
                  action={{ label: t("seeAll"), href: contributionsHref() }}
                />
              </div>
            )}
          </>
        )}
      </PageMain>
    </>
  );
}

function StatusFilterLink({
  status,
  label,
  count,
  current,
}: {
  status?: ProposalStatus;
  label: string;
  count: number;
  current: boolean;
}) {
  // Le filtre actif porte une coche, en plus du bord et du fond : il ne se lit pas à la couleur seule (WCAG 1.4.1).
  return (
    <li>
      <Link
        href={contributionsHref({ status })}
        aria-current={current ? "page" : undefined}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink hover:bg-well aria-[current=page]:border-focus aria-[current=page]:bg-selected"
      >
        {current ? <Check aria-hidden="true" className="-ms-1 size-4 shrink-0" /> : null}
        {label}
        <span className="rounded-full bg-well px-2 py-0.5 text-xs text-ink-2">{count}</span>
      </Link>
    </li>
  );
}
