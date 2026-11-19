import { LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoSymbol } from "@/components/brand/Logo";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { SearchBar } from "@/components/search/SearchBar";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState, ZelligeMotif } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/session";
import { clubPlaylistsFor, personalPlaylistsFor } from "@/mocks/session";

const MAX_SESSIONS = 5;
const MAX_PERSONAL = 3;

function SectionHeader({ id, title, seeAll }: { id: string; title: string; seeAll?: { href: string; label: string } }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-lg font-medium">
        {title}
      </h2>
      {seeAll ? (
        <Link href={seeAll.href} className="text-sm font-medium text-link underline-offset-4 hover:underline">
          {seeAll.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Accueil (IA, hiérarchie du contenu) : recherche, puis « Vos séances », puis « Vos playlists ». */
export default async function HomePage() {
  const t = await getTranslations("home");
  const user = await getCurrentUser();

  if (!user) return <VisitorHome />;

  const sessions = clubPlaylistsFor(user);
  const personal = personalPlaylistsFor(user);

  return (
    <>
      <PageHeader variant="root" withLocaleSwitcher />
      <PageMain>
        <h1 className="sr-only">{t("title")}</h1>
        <SearchBar />

        {sessions.length === 0 ? (
          <div className="mt-8">
            {/* Règle des clubs : seul un animateur peut créer un club ; un membre attend un lien d'invitation. */}
            {user.isAnimator ? (
              <EmptyState
                title={t("noClubTitle")}
                body={t("noClubBodyAnimator")}
                action={{ label: t("createClub"), href: "/clubs/nouveau", icon: <Plus aria-hidden="true" className="size-4" /> }}
                secondary={{ label: t("joinClub"), href: "/clubs" }}
              />
            ) : (
              <EmptyState title={t("noClubTitle")} body={t("noClubBody")} action={{ label: t("joinClub"), href: "/clubs" }} />
            )}
          </div>
        ) : (
          <section aria-labelledby="home-sessions" className="mt-8">
            <SectionHeader
              id="home-sessions"
              title={t("sessions")}
              seeAll={sessions.length > MAX_SESSIONS ? { href: "/clubs", label: t("seeAll") } : undefined}
            />
            <ul className="flex flex-col gap-3">
              {sessions.slice(0, MAX_SESSIONS).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ul>
          </section>
        )}

        {personal.length > 0 ? (
          <section aria-labelledby="home-playlists" className="mt-8">
            <SectionHeader
              id="home-playlists"
              title={t("playlists")}
              seeAll={personal.length > MAX_PERSONAL ? { href: "/playlists", label: t("seeAll") } : undefined}
            />
            <ul className="flex flex-col gap-3">
              {personal.slice(0, MAX_PERSONAL).map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ul>
          </section>
        ) : null}
      </PageMain>
    </>
  );
}

/** Accueil visiteur : logo et phrase d'accroche, recherche, invitation à se connecter. */
async function VisitorHome() {
  const t = await getTranslations();

  return (
    <>
      <PageHeader variant="root" withLocaleSwitcher />
      <PageMain>
        <section className="flex flex-col items-center gap-4 pt-6 text-center">
          <LogoSymbol size={80} />
          <h1 className="font-display text-3xl font-semibold text-balance">{t("app.tagline")}</h1>
          <p className="text-ink-2">{t("home.meaning")}</p>
        </section>
        <div className="mt-8">
          <SearchBar />
        </div>
        <aside className="mt-8 flex flex-col items-start gap-2 rounded-lg border border-line-subtle bg-card p-5">
          <ZelligeMotif className="h-10 w-20" />
          <p className="font-medium">{t("home.visitorInviteTitle")}</p>
          <p className="text-ink-2">{t("home.visitorInviteBody")}</p>
          <Link
            href="/connexion?retour=/"
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink hover:bg-accent-hover"
          >
            <LogIn aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            {t("home.signIn")}
          </Link>
        </aside>
      </PageMain>
    </>
  );
}
