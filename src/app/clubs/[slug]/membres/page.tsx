import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { InviteLink } from "@/components/club/InviteLink";
import { MemberActions } from "@/components/club/MemberActions";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Bidi } from "@/components/ui/Bidi";
import { membersOf } from "@/lib/clubs/queries";
import { loadClub } from "../loadClub";

export async function generateMetadata({ params }: PageProps<"/clubs/[slug]/membres">): Promise<Metadata> {
  const { slug } = await params;
  const [{ club }, t] = await Promise.all([loadClub(slug), getTranslations("clubs.members")]);
  return { title: `${t("title")} · ${club.name}`, robots: { index: false } };
}

/** Adresse absolue de la page d'invitation, pour la copier ou la partager. */
async function inviteUrl(code: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https");
  return `${proto}://${host}/rejoindre/${code}`;
}

/**
 * Sous-onglet Membres : pour l'animateur du club, « Inviter des membres » (copier ou partager le lien),
 * puis la liste des membres (avatar à initiales, rôle), où il peut donner le rôle d'animateur.
 */
export default async function ClubMembersPage({ params }: PageProps<"/clubs/[slug]/membres">) {
  const { slug } = await params;
  const { user, club, role } = await loadClub(slug);
  const [t, locale] = await Promise.all([getTranslations("clubs"), getLocale()]);
  const members = await membersOf(club.id, locale);
  const animator = role === "animator";
  const bdi = (chunks: React.ReactNode) => <Bidi>{chunks}</Bidi>;

  return (
    <div className="flex flex-col gap-8">
      {animator ? (
        <section aria-labelledby="invite-title" className="rounded-lg border border-line-subtle bg-card p-4">
          <h2 id="invite-title" className="text-lg font-medium">
            {t("members.inviteTitle")}
          </h2>
          <p className="mt-1 mb-4 text-ink-2">{t.rich("members.inviteBody", { name: club.name, club: bdi })}</p>
          <InviteLink url={await inviteUrl(club.inviteCode)} clubName={club.name} />
        </section>
      ) : null}

      <section aria-labelledby="members-title">
        <h2 id="members-title" className="text-lg font-medium">
          {t("members.count", { count: members.length, n: String(members.length) })}
        </h2>
        <ul className="mt-3 divide-y divide-line-subtle overflow-hidden rounded-lg border border-line-subtle bg-card">
          {members.map((member) => {
            const isMe = member.id === user.id;
            return (
              <li key={member.id} className="flex flex-col gap-1 p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} marked={member.role === "animator"} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words">
                      <Bidi>{member.name}</Bidi>
                      {isMe ? <span className="font-normal text-ink-2"> ({t("you")})</span> : null}
                    </p>
                    <Badge tone={member.role === "animator" ? "info" : "neutral"} className="mt-1">
                      {t(`roles.${member.role}`)}
                    </Badge>
                  </div>
                </div>
                {animator && !isMe ? (
                  <div className="ps-14 empty:hidden">
                    <MemberActions slug={club.slug} clubName={club.name} member={member} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
