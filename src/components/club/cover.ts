/**
 * Couverture de club générée : fonctions pures, sans dépendance au rendu.
 * Le même nom donne toujours la même couverture (hachage déterministe du nom normalisé).
 */

export type CoverCombo = 1 | 2 | 3 | 4;
export type CoverMotif = "outline" | "filled" | "double";

export interface CoverStyle {
  /** Combinaison de couleurs : tokens --cover-n-bg / --cover-n-fg. */
  combo: CoverCombo;
  /** Orientation de l'étoile khatam, en degrés. */
  rotation: 0 | 22.5;
  motif: CoverMotif;
  /** Décalage du motif de fond de la grande couverture (0 à 3). */
  patternShift: number;
  initial: string;
}

const MOTIFS: CoverMotif[] = ["outline", "filled", "double"];

const normalize = (name: string) =>
  name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr");

/** FNV-1a 32 bits sur les points de code, suivi du brassage final de MurmurHash3 (meilleure répartition). */
export function hashName(name: string): number {
  let h = 0x811c9dc5;
  for (const char of normalize(name)) {
    h ^= char.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Mots génériques ignorés pour choisir l'initiale (« Club des Voix » → V). */
const GENERIC_WORDS = new Set([
  "club", "chorale", "choeur", "chœur", "les", "le", "la", "l", "des", "du", "de", "d", "et",
  "نادي", "جمعية", "فرقة", "كورال",
]);

const firstGrapheme = (text: string): string => {
  const segment = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)[Symbol.iterator]().next();
  return segment.done ? "" : segment.value.segment;
};

/** Initiale affichée sur la couverture : premier mot significatif, sans l'article arabe « ال ». */
export function clubInitial(name: string): string {
  const words = name.normalize("NFC").trim().split(/[\s'’-]+/).filter(Boolean);
  if (words.length === 0) return "·";
  const word = words.find((w) => !GENERIC_WORDS.has(w.toLocaleLowerCase("fr"))) ?? words[0];
  const stem = word.startsWith("ال") && [...word].length > 3 ? word.slice(2) : word;
  return firstGrapheme(stem).toLocaleUpperCase("fr") || "·";
}

export function clubCoverStyle(name: string): CoverStyle {
  const h = hashName(name);
  return {
    combo: ((h % 4) + 1) as CoverCombo,
    rotation: (h >>> 2) & 1 ? 22.5 : 0,
    motif: MOTIFS[(h >>> 3) % MOTIFS.length],
    patternShift: (h >>> 5) % 4,
    initial: clubInitial(name),
  };
}
