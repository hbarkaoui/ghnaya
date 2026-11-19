// Plan 1, tâche 2 : normalisation du latin et de l'arabizi (colonne search_latin et requêtes).
export function normalizeLatin(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
