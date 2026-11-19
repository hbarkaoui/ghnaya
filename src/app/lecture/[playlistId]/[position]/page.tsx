import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReaderShell } from "@/components/reader/ReaderShell";
import { toReaderEntry } from "@/lib/reader/entry";
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
    return song ? [toReaderEntry(song, item.position, item.note)] : [];
  });

  return (
    <ReaderShell
      playlist={{ id: playlist.id, name: playlist.name }}
      entries={entries}
      initialPosition={start}
      fallbackHref="/"
    />
  );
}
