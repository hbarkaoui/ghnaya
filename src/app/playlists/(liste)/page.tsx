import { Search } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInInvite } from "@/components/me/SignInInvite";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { EmptyState } from "@/components/ui/EmptyState";
import { personalPlaylistsOf } from "@/lib/playlist/queries";
import { getCurrentUser } from "@/lib/session";
import { waitDemoLatency } from "@/mocks/demoPreviewsServer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("myPlaylists");
  return { title: t("title") };
}

/** Mes playlists : les playlists personnelles, de la plus récemment modifiée à la plus ancienne. */
export default async function MyPlaylistsPage() {
  await waitDemoLatency(); // MAQUETTE : délai d'aperçu (/apercu/etats), nul en production.
  const t = await getTranslations("myPlaylists");
  const tMe = await getTranslations("me");
  const user = await getCurrentUser();
  const playlists = user ? await personalPlaylistsOf(user.id) : [];

  return (
    <>
      <PageHeader variant="sub" title={t("title")} backHref="/moi" />
      <PageMain>
        {!user ? (
          <SignInInvite title={tMe("visitorTitle")} body={t("visitorBody")} retour="/playlists" />
        ) : playlists.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={{ label: t("emptyAction"), href: "/recherche", icon: <Search aria-hidden="true" className="size-4" /> }}
          />
        ) : (
          <>
            <p className="mb-4 text-ink-2">{t("intro")}</p>
            <ul className="flex flex-col gap-3">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ul>
          </>
        )}
      </PageMain>
    </>
  );
}
