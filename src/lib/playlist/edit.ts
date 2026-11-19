import type { PlaylistItem } from "@/types/catalog";

/**
 * Modifications d'une playlist en mode édition (IA, « Playlist ») : ↑ / ↓, retrait (et son annulation),
 * note de l'animateur, renommage. Fonctions pures : elles renvoient une nouvelle liste, renumérotée
 * à partir de 1 (contrainte `unique(playlist_id, position)` du modèle de données).
 *
 * Une chanson n'apparaît qu'une fois dans une playlist (« Déjà dans … », tâche 9) : son identifiant
 * désigne donc la ligne. Une demande qui vise une chanson absente (déjà retirée, page périmée) ne
 * change rien.
 */

export type Direction = "up" | "down";

/** Longueur maximale d'une note de l'animateur (« tonalité Ré », « seulement le 2e couplet »). */
export const NOTE_MAX_LENGTH = 200;
/** Longueur maximale du nom d'une playlist. */
export const NAME_MAX_LENGTH = 80;

type Item = Pick<PlaylistItem, "position" | "songId">;

const byPosition = <T extends Item>(items: T[]) => [...items].sort((a, b) => a.position - b.position);
const renumber = <T extends Item>(items: T[]): T[] => items.map((item, i) => ({ ...item, position: i + 1 }));

/** Monte (`up`) ou descend (`down`) une chanson d'un cran. Rien ne bouge au bord de la liste. */
export function moveItem<T extends Item>(items: T[], songId: string, direction: Direction): T[] {
  const sorted = byPosition(items);
  const from = sorted.findIndex((item) => item.songId === songId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= sorted.length) return items;
  [sorted[from], sorted[to]] = [sorted[to], sorted[from]];
  return renumber(sorted);
}

/** Retire une chanson de la playlist. */
export function removeItem<T extends Item>(items: T[], songId: string): T[] {
  if (!items.some((item) => item.songId === songId)) return items;
  return renumber(byPosition(items).filter((item) => item.songId !== songId));
}

/** Remet une chanson retirée à sa position (« Annuler »), ou en fin de liste. Jamais de doublon. */
export function insertItem<T extends Item>(items: T[], restored: T): T[] {
  if (items.some((item) => item.songId === restored.songId)) return items;
  const sorted = byPosition(items);
  sorted.splice(Math.min(Math.max(restored.position - 1, 0), sorted.length), 0, restored);
  return renumber(sorted);
}

/** Note sur une seule ligne, sans espaces autour, limitée en longueur ; une note vide devient `null`. */
export function normalizeNote(raw: string): string | null {
  const note = raw.replace(/\s+/g, " ").trim().slice(0, NOTE_MAX_LENGTH).trim();
  return note === "" ? null : note;
}

/** Écrit (ou efface, avec un texte vide) la note d'une chanson. */
export function setItemNote<T extends Item & Pick<PlaylistItem, "note">>(items: T[], songId: string, raw: string): T[] {
  const note = normalizeNote(raw);
  return items.map((item) => (item.songId === songId ? { ...item, note } : item));
}

/** Nom de playlist sans espaces superflus, limité en longueur ; `null` s'il est vide (refusé). */
export function normalizePlaylistName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim().slice(0, NAME_MAX_LENGTH).trim();
  return name === "" ? null : name;
}
