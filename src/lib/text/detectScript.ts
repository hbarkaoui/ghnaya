// Plan 1, tâche 2 : écriture d'un texte et nombre de caractères significatifs.
export type Script = "arabic" | "latin" | "mixed";

export function detectScript(input: string): Script {
  // (?=\p{L}) : seules les lettres arabes comptent, pas les signes diacritiques ni les chiffres arabes.
  const arabic = (input.match(/(?=\p{L})\p{Script=Arabic}/gu) ?? []).length;
  const latin = (input.match(/\p{Script=Latin}/gu) ?? []).length;
  if (arabic > 0 && latin > 0) return "mixed";
  if (arabic > 0) return "arabic";
  return "latin";
}

/** Lettres et chiffres : une requête en compte au moins 2 pour lancer une recherche. */
export function countSignificant(input: string): number {
  return (input.match(/[\p{L}\p{N}]/gu) ?? []).length;
}
