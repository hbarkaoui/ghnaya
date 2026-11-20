import { ChevronRight, LogIn, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ClubCover } from "@/components/club/ClubCover";
import { JoinWithLinkForm } from "@/components/club/JoinWithLinkForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ZelligeMotif } from "@/components/ui/EmptyState";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { BUTTON_PRIMARY } from "@/components/ui/styles";
import { clubHref, signInHref } from "@/lib/clubs/href";
import { getCurrentUser } from "@/lib/session";
import { clubsOf } from "@/mocks/clubStore";
import { waitDemoLatency } from "@/mocks/demoPreviewsServer";

export async function generateMetadata(): Promise<Metadata> {
  const [t, nav, user] = await Promise.all([getTranslations("clubs"), getTranslations("nav"), getCurrentUser()]);
  return { title: !user ? nav("clubs") : user.isAnimator ? t("title") : nav("myClub") };
}

/**
 * Onglet 3 (IA et spec §10, règle des clubs) :
 *  - animateur : la liste de ses clubs, où il choisit celui qu'il gère, puis « Créer un club » ;
 *  - membre : son club directement (il n'en a qu'un), sans liste ;
 *  - membre sans club : comment rejoindre son club avec le lien d'invitation ;
 *  - visiteur : une invitation à se connecter.
 */
export default async function ClubsPage({ searchParams }: PageProps<"/clubs">) {
  await waitDemoLatency(); // MAQUETTE : délai d'aperçu (/apercu/etats), nul en production.
  const user = await getCurrentUser();
  if (!user) return <VisitorClubs />;

  if (!user.isAnimator) {
    const [slug] = user.clubSlugs;
    if (slug) redirect(clubHref(slug));
    return <NoClub />;
  }

  const t = await getTranslations("clubs");
  const { statut } = await searchParams;
  const clubs = clubsOf(user.id);

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        {statut === "supprime" ? (
          <div className="mb-6">
            <StatusNotice>{t("status.deleted")}</StatusNotice>
          </div>
        ) : null}
        <h1 className="text-2xl font-medium">{t("title")}</h1>

        {clubs.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title={t("emptyAnimatorTitle")}
              body={t("emptyAnimatorBody")}
              action={{ label: t("create"), href: "/clubs/nouveau", icon: <Plus aria-hidden="true" className="size-4" /> }}
            />
          </div>
        ) : (
          <>
            <ul className="mt-6 flex flex-col gap-3">
              {clubs.map((club) => (
                <li
                  key={club.slug}
                  className="relative flex items-center gap-3 rounded-lg border border-line-subtle bg-card p-3 transition-colors duration-(--duration-fast) hover:bg-well"
                >
                  <ClubCover name={club.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={clubHref(club.slug)}
                      className="line-clamp-2 font-medium after:absolute after:inset-0 after:rounded-lg"
                    >
                      <bdi>{club.name}</bdi>
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-2">
                      {t("memberCount", { count: club.memberCount, n: String(club.memberCount) })}
                      <Badge tone={club.role === "animator" ? "info" : "neutral"}>{t(`roles.${club.role}`)}</Badge>
                    </p>
                  </div>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-3 rtl:-scale-x-100" />
                </li>
              ))}
            </ul>
            <Link
              href="/clubs/nouveau"
              className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-lg border border-dashed border-line font-medium text-ink transition-colors duration-(--duration-fast) hover:bg-well"
            >
              <Plus aria-hidden="true" className="size-5" />
              {t("create")}
            </Link>
          </>
        )}
      </PageMain>
    </>
  );
}

/** Membre sans club : le lien d'invitation, qu'on ouvre sur le téléphone ou qu'on colle ici. */
async function NoClub() {
  const t = await getTranslations("clubs.noClub");
  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-5 py-8 text-center">
          <ZelligeMotif className="h-14 w-28" />
          <h1 className="text-xl font-medium text-balance">{t("title")}</h1>
          <p className="max-w-sm text-ink-2 text-pretty">{t("body")}</p>
          <div className="mt-3 w-full max-w-sm">
            <JoinWithLinkForm />
          </div>
        </section>
      </PageMain>
    </>
  );
}

/** Visiteur : une invitation à se connecter, qui ramène ensuite ici. */
async function VisitorClubs() {
  const t = await getTranslations("clubs");
  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-8 text-center">
          <ZelligeMotif className="h-14 w-28" />
          <h1 className="text-xl font-medium text-balance">{t("visitorTitle")}</h1>
          <p className="max-w-sm text-ink-2 text-pretty">{t("visitorBody")}</p>
          <Link href={signInHref("/clubs")} className={`mt-2 ${BUTTON_PRIMARY}`}>
            <LogIn aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            {t("signIn")}
          </Link>
        </section>
      </PageMain>
    </>
  );
}
