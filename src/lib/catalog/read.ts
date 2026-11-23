import "server-only";
import type { ArtistPage } from "@/lib/artist/types";
import { readablePositions } from "@/lib/playlist/rows";
import type { Playlist, Song } from "@/types/catalog";
import { getArtistPage as getDbArtistPage, getSongById, publishedSongIds, songIdExists } from "./queries";

/**
 * Passerelle de lecture du catalogue pour les écrans. Tout vient de la base : une chanson ou un artiste se
 * désigne par son UUID, et un autre identifiant (ceux de la maquette, `s-sidi-mansour`, `a-saber`) ne désigne
 * rien. Les playlists, les propositions et les signalements ne contiennent que des chansons de la base.
 */

/** Chanson publiée, ou `undefined` si elle est inconnue ou retirée. */
export async function getSong(id: string): Promise<Song | undefined> {
  return (await getSongById(id)) ?? undefined;
}

/** Page d'un artiste, ou `null` s'il est inconnu ou n'a aucune chanson publiée. */
export function getArtistPage(id: string, page: number): Promise<ArtistPage | null> {
  return getDbArtistPage(id, page);
}

/** Chanson connue, publiée ou retirée (pour annuler un retrait sans accepter n'importe quel identifiant). */
export function songExists(id: string): Promise<boolean> {
  return songIdExists(id);
}

/** Numéros du lecteur pour les chansons lisibles de la playlist (les chansons retirées n'en ont pas). */
export async function readerPositionsOf(playlist: Pick<Playlist, "items">): Promise<Map<string, number>> {
  const published = await publishedSongIds(playlist.items.map((item) => item.songId));
  return readablePositions(playlist.items, (id) => published.has(id));
}
