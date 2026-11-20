import { ListMusic, Play } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ClubCover } from "@/components/club/ClubCover";
import { Bidi } from "@/components/ui/Bidi";
import { readerPositionsOf } from "@/mocks/playlistStore";
import type { Playlist } from "@/types/catalog";

/**
 * Carte de playlist : couverture du club (ou tuile « personnelle »), nom, club et nombre de chansons,
 * et le bouton « Lire » qui ouvre directement le lecteur sur la première chanson.
 * Toute la carte mène à la playlist ; le bouton « Lire » reste une cible distincte.
 */
export async function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const t = await getTranslations("playlists");
  // Chansons lisibles seulement : une chanson retirée n'est pas comptée (comme sur la page de la playlist).
  const count = readerPositionsOf(playlist).size;

  return (
    <li className="relative flex items-center gap-3 rounded-lg border border-line-subtle bg-card p-3 transition-colors duration-(--duration-fast) hover:bg-well">
      {playlist.club ? (
        <ClubCover name={playlist.club.name} size="md" />
      ) : (
        <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-lg bg-well text-ink-2" aria-hidden="true">
          <ListMusic className="size-7 rtl:-scale-x-100" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {/* Le sens d'écriture est sur le fragment (Bidi), pas sur le lien bloc : un nom latin reste aligné
            sur le début de l'interface (à droite en arabe). */}
        <Link
          href={`/playlists/${playlist.id}`}
          className="line-clamp-2 font-medium after:absolute after:inset-0 after:rounded-lg"
        >
          <Bidi>{playlist.name}</Bidi>
        </Link>
        <p className="line-clamp-2 text-sm text-ink-2">
          <Bidi>{playlist.club ? playlist.club.name : t("personal")}</Bidi>
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
