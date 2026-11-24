import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReaderEmpty } from "@/components/reader/ReaderEmpty";
import { ReaderShell } from "@/components/reader/ReaderShell";
import { canEditPlaylist, canViewPlaylist } from "@/lib/auth/permissions";
import { signInHref } from "@/lib/auth/returnPath";
import { getSong } from "@/lib/catalog/read";
import { getPlaylist } from "@/lib/playlist/queries";
import { toReaderEntry } from "@/lib/reader/entry";
import { getCurrentUser } from "@/lib/session";
import type { ReaderEntry } from "@/types/catalog";

// Plan 5, tâche 3 : l'action de translittération appelée depuis cette page peut durer 30 s (génération) ou
// 35 s (attente d'une génération en cours). Valable pour toutes les actions serveur de la page.
export const maxDuration = 60;

type Props = { params: Promise<{ playlistId: string; position: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playlistId } = await params;
  const [playlist, user] = await Promise.all([getPlaylist(playlistId), getCurrentUser()]);
  const visible = playlist && canViewPlaylist(user, playlist);
  return { title: visible ? playlist.name : undefined, robots: { index: false } };
}

/**
 * Lecteur de séance : /lecture/[playlistId]/[position], position numérotée à partir de 1.
 * Les chansons retirées ne sont pas lisibles : le lecteur les saute, et ses positions sont celles
 * affichées dans la liste de la playlist. Une playlist sans chanson lisible affiche un état vide.
 */
export default async function ReaderPage({ params }: Props) {
  const { playlistId, position } = await params;
  const user = await getCurrentUser();
  // Un visiteur passe d'abord par la connexion, qui le ramène à cette position du lecteur.
  if (!user) redirect(signInHref(`/lecture/${encodeURIComponent(playlistId)}/${encodeURIComponent(position)}`));
  const playlist = await getPlaylist(playlistId);
  // Club privé, playlist personnelle privée : comme la page de la playlist (spec §10).
  if (!playlist || !canViewPlaylist(user, playlist)) notFound();

  const items = [...playlist.items].sort((a, b) => a.position - b.position);
  const songs = await Promise.all(items.map((item) => getSong(item.songId)));
  const entries: ReaderEntry[] = items
    .flatMap((item, i) => {
      const song = songs[i];
      return song ? [{ song, note: item.note }] : [];
    })
    .map(({ song, note }, i) => toReaderEntry(song, i + 1, note));

  if (entries.length === 0) {
    return <ReaderEmpty playlist={{ id: playlist.id, name: playlist.name }} canEdit={canEditPlaylist(user, playlist)} />;
  }

  const start = Number(position);
  if (!Number.isInteger(start) || start < 1 || start > entries.length) notFound();

  return (
    <ReaderShell
      playlist={{ id: playlist.id, name: playlist.name }}
      entries={entries}
      initialPosition={start}
      fallbackHref={`/playlists/${playlist.id}`}
    />
  );
}
