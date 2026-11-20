import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NewPlaylistForm } from "@/components/club/NewPlaylistForm";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { clubPlaylists } from "@/mocks/clubStore";
import { waitDemoLatency } from "@/mocks/demoPreviewsServer";
import { loadClub } from "./loadClub";

/** Au-delà de 10 playlists, les plus anciennes sont regroupées dans une section repliée (IA, croissance). */
const VISIBLE = 10;

export async function generateMetadata({ params }: PageProps<"/clubs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { club } = await loadClub(slug);
  return { title: club.name, robots: { index: false } };
}

/** Sous-onglet Playlists : de la plus récemment modifiée à la plus ancienne, chacune avec « Lire ». */
export default async function ClubPlaylistsPage({ params, searchParams }: PageProps<"/clubs/[slug]">) {
  await waitDemoLatency(); // MAQUETTE : délai d'aperçu (/apercu/etats), nul en production.
  const { slug } = await params;
  const { statut } = await searchParams;
  const { club, role } = await loadClub(slug);
  const t = await getTranslations("clubs");
  const playlists = clubPlaylists(club.slug);
  const bdi = (chunks: React.ReactNode) => <bdi>{chunks}</bdi>;

  return (
    <div className="flex flex-col gap-4">
      {statut === "rejoint" ? <StatusNotice>{t.rich("status.joined", { name: club.name, club: bdi })}</StatusNotice> : null}
      {statut === "cree" ? <StatusNotice>{t.rich("status.created", { name: club.name, club: bdi })}</StatusNotice> : null}
      {role === "animator" ? <NewPlaylistForm slug={club.slug} /> : null}

      {playlists.length === 0 ? (
        <EmptyState
          title={t("playlists.emptyTitle")}
          body={role === "animator" ? t("playlists.emptyBodyAnimator") : t("playlists.emptyBodyMember")}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {playlists.slice(0, VISIBLE).map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </ul>
          {playlists.length > VISIBLE ? (
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer items-center font-medium text-link">
                {t("playlists.older", { n: String(playlists.length - VISIBLE) })}
              </summary>
              <ul className="mt-3 flex flex-col gap-3">
                {playlists.slice(VISIBLE).map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
