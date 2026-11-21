// Plan 1, tâche 4 : part des lettres arabes dans un texte (entre 0 et 1), pour le filtre d'import LRCLIB.
export function arabicRatio(text: string): number {
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  if (letters === 0) return 0;
  const arabic = (text.match(/(?=\p{L})\p{Script=Arabic}/gu) ?? []).length;
  return arabic / letters;
}
