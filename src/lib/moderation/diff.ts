import { normalizeMultiline } from "@/lib/contribution/validate";

/**
 * Vue des différences de la modération (spec §8.4) : les paroles comparées ligne par ligne.
 * Fonctions pures, sans dépendance au rendu : `DiffView` les affiche sur une colonne en mobile, et sur
 * deux colonnes (avant / après) à partir de 1024 px, avec `pairDiffRows`.
 */

export type DiffKind = "same" | "added" | "removed";
export interface DiffLine {
  kind: DiffKind;
  text: string;
}

/** Les lignes d'un texte, normalisé comme une proposition (fins de ligne, espaces, lignes vides en trop). */
const toLines = (text: string): string[] => {
  const normalized = normalizeMultiline(text);
  return normalized === "" ? [] : normalized.split("\n");
};

/**
 * Différences entre deux versions, à partir de la plus longue sous-suite commune (LCS). Dans une
 * zone modifiée, les anciennes lignes passent avant les nouvelles : une ligne corrigée apparaît comme
 * « retirée » puis « ajoutée », à sa place.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = toLines(before);
  const b = toLines(after);

  // common[i][j] : longueur de la plus longue sous-suite commune à a[i..] et b[j..].
  const common = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      common[i][j] = a[i] === b[j] ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push({ kind: "same", text: a[i] });
      i++;
      j++;
    } else if (j >= b.length || (i < a.length && common[i + 1][j] >= common[i][j + 1])) {
      lines.push({ kind: "removed", text: a[i] });
      i++;
    } else {
      lines.push({ kind: "added", text: b[j] });
      j++;
    }
  }
  return lines;
}

export function diffStats(lines: readonly DiffLine[]): { added: number; removed: number } {
  return {
    added: lines.filter((l) => l.kind === "added").length,
    removed: lines.filter((l) => l.kind === "removed").length,
  };
}

export interface DiffSegment {
  /** Lignes identiques repliées (« Afficher 4 lignes identiques »). */
  hidden: boolean;
  lines: DiffLine[];
}

/** Lignes identiques gardées visibles de part et d'autre d'un changement. */
const CONTEXT = 2;
/** En dessous, on montre les lignes : un bouton pour 1 ou 2 lignes coûterait plus qu'il n'aide. */
const MIN_HIDDEN = 3;

/**
 * Découpe le diff en parties visibles et repliées : seules les longues suites de lignes identiques
 * sont repliées, en gardant 2 lignes de contexte autour de chaque changement. Sans aucun changement,
 * tout reste visible.
 */
export function segmentDiff(lines: readonly DiffLine[]): DiffSegment[] {
  const changed = lines.map((l) => l.kind !== "same");
  if (!changed.includes(true)) return lines.length > 0 ? [{ hidden: false, lines: [...lines] }] : [];

  // Une ligne identique reste visible si un changement se trouve à CONTEXT lignes ou moins.
  const visible = lines.map((_, i) =>
    changed.slice(Math.max(0, i - CONTEXT), i + CONTEXT + 1).some(Boolean),
  );

  const segments: DiffSegment[] = [];
  let start = 0;
  while (start < lines.length) {
    let end = start;
    while (end < lines.length && visible[end] === visible[start]) end++;
    const hidden = !visible[start] && end - start >= MIN_HIDDEN;
    const previous = segments.at(-1);
    if (previous && !previous.hidden && !hidden) previous.lines.push(...lines.slice(start, end));
    else segments.push({ hidden, lines: lines.slice(start, end) });
    start = end;
  }
  return segments;
}

/** Une rangée de la vue sur deux colonnes : la ligne d'avant et celle d'après, ou rien d'un côté. */
export interface DiffRow {
  before: DiffLine | null;
  after: DiffLine | null;
}

/**
 * Les lignes face à face, pour la vue sur deux colonnes (avant / après) : une ligne identique se trouve
 * des deux côtés ; dans une zone modifiée, la n-ième ligne retirée fait face à la n-ième ligne ajoutée
 * (une ligne corrigée en face de sa correction), et le côté le plus court est complété par des vides.
 */
export function pairDiffRows(lines: readonly DiffLine[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let removed: DiffLine[] = [];
  let added: DiffLine[] = [];

  const flushChanges = () => {
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      rows.push({ before: removed[k] ?? null, after: added[k] ?? null });
    }
    removed = [];
    added = [];
  };

  for (const line of lines) {
    if (line.kind === "removed") removed.push(line);
    else if (line.kind === "added") added.push(line);
    else {
      flushChanges();
      rows.push({ before: line, after: line });
    }
  }
  flushChanges();
  return rows;
}
