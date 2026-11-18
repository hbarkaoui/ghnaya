import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReaderShell } from "@/components/reader/ReaderShell";
import { getPlaylist, getSong } from "@/mocks/catalog";
import type { ReaderEntry } from "@/types/catalog";

type Props = { params: Promise<{ playlistId: string; position: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playlistId } = await params;
  const playlist = getPlaylist(playlistId);
  return { title: playlist?.name, robots: { index: false } };
}

/** Lecteur de séance : /lecture/[playlistId]/[position], position numérotée à partir de 1. */
export default async function ReaderPage({ params }: Props) {
  const { playlistId, position } = await params;
  const playlist = getPlaylist(playlistId);
  const start = Number(position);
  if (!playlist || !Number.isInteger(start) || start < 1 || start > playlist.items.length) notFound();

  const entries: ReaderEntry[] = playlist.items.flatMap((item) => {
    const song = getSong(item.songId);
    if (!song) return [];
    const { id, titleAr, titleLatin, lyrics, artists } = song;
    return [{ position: item.position, note: item.note, song: { id, titleAr, titleLatin, lyrics, artists } }];
  });

  return (
    <ReaderShell
      playlistId={playlist.id}
      playlistName={playlist.name}
      entries={entries}
      initialPosition={start}
      fallbackHref="/"
    />
  );
}
