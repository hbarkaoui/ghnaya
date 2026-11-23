// Plan 4, tâche 2 : validation de l'alignement ligne à ligne (spec §7, écart 6).

/** Lignes d'un texte : retours à la ligne normalisés, espaces de fin retirés, lignes blanches vidées. */
export function translitLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : line.trimEnd()));
}

export type Alignment = { ok: true; text: string } | { ok: false; expected: number; actual: number };

/**
 * Une ligne latine par ligne arabe, et les lignes vides (entre les couplets) aux mêmes places : sinon
 * l'affichage entrelacé décalerait les couplets. Renvoie la translittération normalisée, celle qu'on enregistre.
 */
export function checkAlignment(lyrics: string, translit: string): Alignment {
  const arabic = translitLines(lyrics);
  const latin = translit.trim() === "" ? [] : translitLines(translit);
  const aligned =
    arabic.length === latin.length && arabic.every((line, i) => (line === "") === (latin[i] === ""));
  return aligned ? { ok: true, text: latin.join("\n") } : { ok: false, expected: arabic.length, actual: latin.length };
}
