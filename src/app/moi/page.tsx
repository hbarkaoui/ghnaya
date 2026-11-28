import { CirclePlus, FileClock, FileText, Languages, ListMusic, Lock, LogOut, Scale, ShieldCheck, UserCog } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/account";
import { ClubCover } from "@/components/club/ClubCover";
import { MenuAction, MenuControl, MenuLink, MenuList } from "@/components/me/MenuList";
import { SignInInvite } from "@/components/me/SignInInvite";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { Badge } from "@/components/ui/Badge";
import { Bidi } from "@/components/ui/Bidi";
import type { CurrentUser } from "@/lib/auth/types";
import type { ClubRef } from "@/lib/clubs/types";
import { getCurrentUser } from "@/lib/session";
import { pendingRevisionCountOf } from "@/lib/moderation/queries";
import { moderationQueueSize } from "@/lib/moderation/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("me");
  return { title: t("title") };
}

/**
 * Moi (IA, hiérarchie du contenu) : le nom et les pastilles de club ; Mes playlists, Mes contributions,
 * Proposer une chanson ; Modération (modérateurs) ; Langue, Compte, pages juridiques ; Se déconnecter.
 */
export default async function MePage({ searchParams }: PageProps<"/moi">) {
  const t = await getTranslations("me");
  const user = await getCurrentUser();

  if (!user) return <VisitorMe accountDeleted={(await searchParams).compte === "supprime"} />;

  const pendingContributions = await pendingRevisionCountOf(user.id);
  const moderationQueue = user.isModerator ? await moderationQueueSize() : 0;

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <section aria-labelledby="me-name">
          {/* Le sens du nom est isolé dans le texte ; le titre garde l'alignement de l'interface. */}
          <h1 id="me-name" className="text-2xl font-medium">
            <Bidi>{user.name}</Bidi>
          </h1>
          <ClubPills user={user} clubs={user.clubs} />
        </section>

        <div className="mt-8 flex flex-col gap-6">
          <MenuList>
            <MenuLink href="/playlists" Icon={ListMusic} label={t("myPlaylists")} flipIcon />
            <MenuLink
              href="/mes-contributions"
              Icon={FileClock}
              label={t("myContributions")}
              badge={
                pendingContributions > 0 ? (
                  <Badge tone="warning">{t("pending", { n: String(pendingContributions) })}</Badge>
                ) : undefined
              }
            />
            <MenuLink href="/contribuer" Icon={CirclePlus} label={t("propose")} />
          </MenuList>

          {user.isModerator ? (
            <MenuList>
              <MenuLink
                href="/moderation"
                Icon={ShieldCheck}
                label={t("moderation")}
                badge={
                  moderationQueue > 0 ? (
                    <Badge tone="info">{t("moderationQueue", { n: String(moderationQueue) })}</Badge>
                  ) : undefined
                }
              />
            </MenuList>
          ) : null}

          <SettingsList withAccount />

          <MenuAction action={signOut} Icon={LogOut} label={t("signOut")} flipIcon />
        </div>
      </PageMain>
    </>
  );
}

/**
 * Pastilles de club : le club d'un membre, les clubs d'un animateur (règle des clubs).
 * Sans club : un membre rejoint par un lien d'invitation ; seul un animateur peut créer un club.
 */
async function ClubPills({ user, clubs }: { user: CurrentUser; clubs: ClubRef[] }) {
  const t = await getTranslations("me");

  if (clubs.length === 0) {
    return (
      <p className="mt-2 text-ink-2">
        {t("noClub")}{" "}
        <Link
          href={user.isAnimator ? "/clubs/nouveau" : "/clubs"}
          className="font-medium text-link underline underline-offset-4"
        >
          {user.isAnimator ? t("createClub") : t("joinClub")}
        </Link>
      </p>
    );
  }

  return (
    <>
      <h2 className="mt-3 text-sm text-ink-2">{t("clubsLabel", { count: clubs.length })}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {clubs.map((club) => (
          <li key={club.slug}>
            <Link
              href={`/clubs/${club.slug}`}
              className="inline-flex min-h-11 items-center gap-2.5 rounded-lg border border-line-subtle bg-card p-0.5 pe-4 transition-colors duration-(--duration-fast) hover:bg-well"
            >
              <ClubCover name={club.name} size="sm" />
              <Bidi className="text-sm font-medium">{club.name}</Bidi>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Langue, Compte (membres), Droits d'auteur et retrait de contenus, la politique de confidentialité et les
 * conditions d'utilisation (pour tous, visiteurs compris).
 */
async function SettingsList({ withAccount = false }: { withAccount?: boolean }) {
  const t = await getTranslations("me");

  return (
    <MenuList>
      <MenuControl Icon={Languages} label={t("language")}>
        <LocaleSwitcher />
      </MenuControl>
      {withAccount ? <MenuLink href="/moi/compte" Icon={UserCog} label={t("account")} /> : null}
      <MenuLink href="/a-propos/droits" Icon={Scale} label={t("rights")} />
      <MenuLink href="/a-propos/confidentialite" Icon={Lock} label={t("privacy")} />
      <MenuLink href="/a-propos/conditions" Icon={FileText} label={t("terms")} />
    </MenuList>
  );
}

/** Un visiteur voit une invitation à se connecter, puis la langue et ses droits. */
async function VisitorMe({ accountDeleted }: { accountDeleted: boolean }) {
  const t = await getTranslations("me");

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <h1 className="sr-only">{t("title")}</h1>
        {accountDeleted ? (
          <p role="status" className="mb-6 rounded-lg bg-success-soft px-4 py-3 text-success">
            {t("accountDeleted")}
          </p>
        ) : null}
        <SignInInvite title={t("visitorTitle")} body={t("visitorBody")} retour="/moi" />
        <div className="mt-6">
          <SettingsList />
        </div>
      </PageMain>
    </>
  );
}
