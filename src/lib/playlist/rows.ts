import type { Playlist, PlaylistItem } from "@/types/catalog";

/**
 * Numéro de chaque chanson lisible dans le lecteur (`/lecture/[id]/[position]`), à partir de 1.
 * Une chanson retirée (spec §5, retrait doux) reste dans la liste mais n'est pas lisible : elle n'a
 * pas de numéro, et le lecteur passe directement à la suivante. Le numéro affiché dans la liste est
 * donc toujours celui du lecteur (« ouvre la chanson 4 » désigne la même chanson partout).
 */
export function readablePositions(
  items: Pick<PlaylistItem, "position" | "songId">[],
  isReadable: (songId: string) => boolean,
): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const item of [...items].sort((a, b) => a.position - b.position)) {
    if (isReadable(item.songId)) numbers.set(item.songId, numbers.size + 1);
  }
  return numbers;
}

/** Copie personnelle d'une playlist de club (« Copier dans mes playlists ») : mêmes chansons, mêmes notes. */
export function copyPlaylist(
  source: Playlist,
  { id, ownerId, now }: { id: string; ownerId: string; now: string },
): Playlist {
  return {
    id,
    name: source.name,
    club: null,
    ownerId,
    items: source.items.map((item) => ({ ...item })),
    updatedAt: now,
  };
}
