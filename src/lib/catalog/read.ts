import "server-only";
import type { ArtistPage } from "@/lib/artist/types";
import { readablePositions } from "@/lib/playlist/rows";
import { getArtistPage as getMockArtistPage } from "@/mocks/artists";
import { getRemovedSong, getSong as getMockSong } from "@/mocks/catalog";
import type { Playlist, Song } from "@/types/catalog";
import {
  getArtistPage as getDbArtistPage,
  getSongById,
  isUuid,
  publishedSongIds,
  songIdExists,
} from "./queries";

/**
 * Passerelle de lecture du catalogue pour les écrans (plan 1, « Adaptation au code existant »).
 *
 * Un UUID est lu en base ; un autre identifiant (`s-sidi-mansour`, `a-saber`), dans le catalogue fictif.
 * Les playlists, les propositions et les signalements restent fictifs jusqu'aux plans 2 et 3, et citent
 * des chansons fictives ; une chanson trouvée par la recherche, elle, vient de la base. Les plans 2 et 3
 * retireront la branche fictive.
 */

/** Chanson publiée, ou `undefined` si elle est inconnue ou retirée. */
export async function getSong(id: string): Promise<Song | undefined> {
  return isUuid(id) ? ((await getSongById(id)) ?? undefined) : getMockSong(id);
}

/** Page d'un artiste, ou `null` s'il est inconnu ou n'a aucune chanson publiée. */
export async function getArtistPage(id: string, page: number): Promise<ArtistPage | null> {
  return isUuid(id) ? getDbArtistPage(id, page) : getMockArtistPage(id, page);
}

/** Chanson connue, publiée ou retirée (pour annuler un retrait sans accepter n'importe quel identifiant). */
export async function songExists(id: string): Promise<boolean> {
  return isUuid(id) ? songIdExists(id) : getMockSong(id) !== undefined || getRemovedSong(id) !== undefined;
}

/** Numéros du lecteur pour les chansons lisibles de la playlist (les chansons retirées n'en ont pas). */
export async function readerPositionsOf(playlist: Pick<Playlist, "items">): Promise<Map<string, number>> {
  const published = await publishedSongIds(playlist.items.map((item) => item.songId));
  const isReadable = (id: string) => (isUuid(id) ? published.has(id) : getMockSong(id) !== undefined);
  return readablePositions(playlist.items, isReadable);
}
