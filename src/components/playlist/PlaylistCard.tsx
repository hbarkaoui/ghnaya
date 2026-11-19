import { ListMusic, Play } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ClubCover } from "@/components/club/ClubCover";
import type { Playlist } from "@/types/catalog";

/**
 * Carte de playlist : couverture du club (ou tuile « personnelle »), nom, club et nombre de chansons,
 * et le bouton « Lire » qui ouvre directement le lecteur sur la première chanson.
 * Toute la carte mène à la playlist ; le bouton « Lire » reste une cible distincte.
 */
export async function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const t = await getTranslations("playlists");
  const count = playlist.items.length;

  return (
    <li className="relative flex items-center gap-3 rounded-lg border border-line-subtle bg-card p-3 transition-colors duration-(--duration-fast) hover:bg-well">
      {playlist.club ? (
        <ClubCover name={playlist.club.name} size="md" />
      ) : (
        <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg bg-well text-ink-2" aria-hidden="true">
          <ListMusic className="size-7" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Link
          href={`/playlists/${playlist.id}`}
          dir="auto"
          className="line-clamp-2 font-medium after:absolute after:inset-0 after:rounded-lg"
        >
          {playlist.name}
        </Link>
        <p className="line-clamp-2 text-sm text-ink-2">
          <span dir="auto">{playlist.club ? playlist.club.name : t("personal")}</span>
          <span aria-hidden="true"> · </span>
          {t("songCount", { count, n: String(count) })}
        </p>
      </div>
      <Link
        href={`/lecture/${playlist.id}/1`}
        aria-label={t("readNamed", { name: playlist.name })}
        className="relative z-10 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-accent px-4 font-medium text-accent-ink hover:bg-accent-hover"
      >
        <Play aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        {t("read")}
      </Link>
    </li>
  );
}
