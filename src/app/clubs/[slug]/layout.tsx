import { getTranslations } from "next-intl/server";
import { ClubCover } from "@/components/club/ClubCover";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { Badge } from "@/components/ui/Badge";
import { SubTabs } from "@/components/ui/SubTabs";
import { clubHref } from "@/lib/clubs/href";
import { memberships } from "@/mocks/clubStore";
import { loadClub } from "./loadClub";

/**
 * Club (IA, « Club ») : la grande couverture zellige, le nom, le nombre de membres et votre rôle,
 * puis les sous-onglets Playlists, Membres et Réglages (ce dernier pour l'animateur du club).
 * Pour un membre, c'est la page de l'onglet « Mon club » : pas de bouton retour vers une liste de clubs.
 */
export default async function ClubLayout({ children, params }: LayoutProps<"/clubs/[slug]">) {
  const { slug } = await params;
  const { user, club, role } = await loadClub(slug);
  const t = await getTranslations("clubs");
  const count = memberships().filter((m) => m.clubSlug === club.slug).length;

  const tabs = [
    { href: clubHref(club.slug), label: t("tabs.playlists") },
    { href: clubHref(club.slug, "membres"), label: t("tabs.members") },
    ...(role === "animator" ? [{ href: clubHref(club.slug, "reglages"), label: t("tabs.settings") }] : []),
  ];

  return (
    <>
      {user.isAnimator ? <PageHeader variant="sub" backHref="/clubs" /> : <PageHeader variant="root" />}
      <PageMain>
        <header>
          <ClubCover name={club.name} size="lg" />
          {/* bdi : le nom (latin ou arabe) garde son sens d'écriture, le titre suit l'alignement de l'interface. */}
          <h1 className="mt-4 font-display text-2xl leading-snug font-semibold">
            <bdi>{club.name}</bdi>
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-ink-2">
            {t("memberCount", { count, n: String(count) })}
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="sr-only">{t("yourRole")} </span>
              <Badge tone={role === "animator" ? "info" : "neutral"}>{t(`roles.${role}`)}</Badge>
            </span>
          </p>
        </header>
        <div className="mt-5">
          <SubTabs label={t("tabs.label")} items={tabs} />
        </div>
        <div className="mt-6">{children}</div>
      </PageMain>
    </>
  );
}
