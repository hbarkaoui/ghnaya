import type { Song } from "@/types/catalog";
import { REMOVED_SONGS, SONGS } from "./catalog";

type RemovedSong = Pick<Song, "id" | "titleAr" | "titleLatin" | "artists">;

/**
 * MAQUETTE : écritures de la modération (tâche 14) dans le catalogue en mémoire, en attendant
 * `lib/moderation` et la table `songs` (plan 3). Une chanson n'est jamais modifiée sur place : elle
 * est remplacée, pour que la recherche (index chanson par chanson) la réindexe.
 */
export function createSongStore(songs: Song[], removed: RemovedSong[]) {
  return {
    /** Publie une chanson approuvée : remplace la chanson corrigée à sa place, ou ajoute la nouvelle. */
    publish(song: Song): void {
      const index = songs.findIndex((s) => s.id === song.id);
      if (index === -1) songs.push(song);
      else songs[index] = song;
    },
    /**
     * Retrait doux (spec §5) : la chanson quitte le catalogue publié (ni cherchable ni lisible, sa fiche
     * répond « introuvable ou retirée ») et rejoint les chansons retirées, que les playlists affichent
     * « chanson retirée ». Elle est gardée en entier, pour un rétablissement futur.
     */
    remove(id: string): boolean {
      const index = songs.findIndex((s) => s.id === id);
      if (index === -1) return false;
      const [song] = songs.splice(index, 1);
      removed.push(song);
      return true;
    },
  };
}

export const songStore = createSongStore(SONGS, REMOVED_SONGS);
