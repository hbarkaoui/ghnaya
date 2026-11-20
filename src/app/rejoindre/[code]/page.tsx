import { LogIn, TriangleAlert, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ClubCover } from "@/components/club/ClubCover";
import { JoinClubForm } from "@/components/club/JoinClubForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { Bidi } from "@/components/ui/Bidi";
import { EmptyState } from "@/components/ui/EmptyState";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/ui/styles";
import { clubHref, signInHref } from "@/lib/clubs/href";
import { decideJoin } from "@/lib/clubs/membership";
import { getCurrentUser } from "@/lib/session";
import { getClub, getClubByInvite, memberships } from "@/mocks/clubStore";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("clubs.join");
  return { title: t("title"), robots: { index: false } };
}

const bdi = (chunks: ReactNode) => <Bidi className="font-medium">{chunks}</Bidi>;

/** Encadré d'avertissement (changement de club, refus) : une icône et un texte, jamais la couleur seule. */
function Warning({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-warning-soft p-4 text-ink">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

/**
 * Rejoindre un club par son lien d'invitation (IA, parcours 2 ; spec §10). La page est ouverte à tous :
 *  - lien inconnu ou régénéré : « Ce lien n'est plus valide » ;
 *  - visiteur : le club, puis la connexion, qui ramène ici (la tâche 16 la construit) ;
 *  - membre sans club, ou animateur : Rejoindre (l'animateur garde ses autres clubs) ;
 *  - membre d'un autre club : « Rejoindre B vous fera quitter A », à confirmer ;
 *  - dernier animateur de son club : il doit d'abord donner le rôle à un autre membre.
 */
export default async function JoinPage({ params }: PageProps<"/rejoindre/[code]">) {
  const { code: raw } = await params;
  const code = raw.toLowerCase();
  const [t, user] = await Promise.all([getTranslations("clubs"), getCurrentUser()]);
  const club = getClubByInvite(code);

  if (!club) {
    return (
      <>
        <PageHeader variant="root" withLocaleSwitcher />
        <PageMain>
          <EmptyState
            titleAs="h1"
            title={t("join.invalidTitle")}
            body={t("join.invalidBody")}
            action={{ label: t("join.home"), href: "/" }}
          />
        </PageMain>
      </>
    );
  }

  const count = memberships().filter((m) => m.clubSlug === club.slug).length;
  const decision = user ? decideJoin(memberships(), user, club.slug) : null;
  const nameOf = (slug: string) => getClub(slug)?.name ?? slug;

  return (
    <>
      <PageHeader variant="root" withLocaleSwitcher />
      <PageMain>
        <section className="flex flex-col gap-5">
          <ClubCover name={club.name} size="lg" />
          <div>
            <p className="text-sm font-medium text-ink-2">{t("join.invitedTo")}</p>
            <h1 className="mt-1 font-display text-2xl leading-snug font-semibold">
              <Bidi>{club.name}</Bidi>
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-ink-2">
              <Users aria-hidden="true" className="size-4" />
              {t("memberCount", { count, n: String(count) })}
            </p>
          </div>

          {!user ? (
            <div className="flex flex-col gap-3">
              <Link href={signInHref(`/rejoindre/${code}`)} className={`${BUTTON_PRIMARY} w-full`}>
                <LogIn aria-hidden="true" className="size-4 rtl:-scale-x-100" />
                {t("join.signIn")}
              </Link>
              <p className="text-sm text-ink-2">{t("join.signInHint")}</p>
            </div>
          ) : decision?.kind === "already-member" ? (
            <div className="flex flex-col gap-3">
              <p className="font-medium">{t.rich("join.alreadyTitle", { name: club.name, club: bdi })}</p>
              <Link href={clubHref(club.slug)} className={`${BUTTON_PRIMARY} w-full`}>
                {t("join.openClub")}
              </Link>
            </div>
          ) : decision?.kind === "join" ? (
            <div className="flex flex-col gap-3">
              {user.isAnimator && user.clubSlugs.length > 0 ? (
                <p className="text-ink-2">{t.rich("join.animatorNote", { name: club.name, club: bdi })}</p>
              ) : null}
              <JoinClubForm code={code} label={t("join.submit")} />
            </div>
          ) : decision?.kind === "switch" ? (
            <div className="flex flex-col gap-4">
              <Warning>
                <p>
                  {t.rich("join.switchBody", {
                    current: decision.leaving.map(nameOf).join(", "),
                    target: club.name,
                    club: bdi,
                  })}
                </p>
                <p className="text-sm text-ink-2">{t("join.switchKeep")}</p>
              </Warning>
              <JoinClubForm code={code} label={t("join.switchSubmit")} confirm />
              <Link href="/clubs" className={`${BUTTON_SECONDARY} w-full`}>
                {t("join.stay")}
              </Link>
            </div>
          ) : decision?.kind === "blocked" ? (
            <div className="flex flex-col gap-4">
              <Warning>
                <p>{t.rich("join.blockedBody", { current: nameOf(decision.club), target: club.name, club: bdi })}</p>
              </Warning>
              <Link href={clubHref(decision.club, "membres")} className={`${BUTTON_PRIMARY} w-full`}>
                {t("join.blockedAction")}
              </Link>
            </div>
          ) : null}
        </section>
      </PageMain>
    </>
  );
}
