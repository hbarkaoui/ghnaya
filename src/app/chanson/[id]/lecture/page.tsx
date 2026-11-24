import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ReaderShell } from "@/components/reader/ReaderShell";
import { artistsLine } from "@/components/song/artistName";
import { songDisplayTitle } from "@/components/song/songTitle";
import { toReaderEntry } from "@/lib/reader/entry";
import { getSong } from "@/lib/catalog/read";

// Plan 5, tâche 3 : l'action de translittération appelée depuis cette page peut durer 30 s (génération) ou
// 35 s (attente d'une génération en cours). Valable pour toutes les actions serveur de la page.
export const maxDuration = 60;

export async function generateMetadata({ params }: PageProps<"/chanson/[id]/lecture">): Promise<Metadata> {
  const { id } = await params;
  const song = await getSong(id);
  const locale = await getLocale();
  return { title: song ? songDisplayTitle(song, locale) : undefined, robots: { index: false } };
}

/**
 * Mode séance d'une chanson seule (IA, parcours 4) : le lecteur en 1 / 1, sans précédent / suivant
 * ni écran de fin, accessible sans connexion. Fermer revient à la fiche.
 */
export default async function SongReaderPage({ params }: PageProps<"/chanson/[id]/lecture">) {
  const { id } = await params;
  const song = await getSong(id);
  if (!song) notFound();
  const locale = await getLocale();

  return (
    <ReaderShell
      entries={[toReaderEntry(song)]}
      initialPosition={1}
      subtitle={artistsLine(song.artists, locale)}
      fallbackHref={`/chanson/${song.id}`}
    />
  );
}
