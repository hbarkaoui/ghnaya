/**
 * Texte rogné à une hauteur de ligne serrée (revue de design, constat 1).
 *
 * `line-clamp-*` et `truncate` posent `overflow: hidden` sur le texte lui-même. Avec une hauteur de ligne
 * inférieure à 1,5, la boîte coupe ce qui descend sous la ligne de base : les points des lettres arabes
 * (« سيدي » devenait « سيدى » dans le titre du lecteur). Les tailles text-lg et au-delà prennent la hauteur
 * de ligne « tight » (1,25) des tokens, et leading-tight, leading-snug et leading-none sont aussi trop serrés.
 */

export interface ClippedTextIssue {
  line: number;
  classes: string;
}

const CLIPS = /(?:^|\s)(?:line-clamp-\d+|truncate)(?=\s|$)/;
const TIGHT_SIZE = /(?:^|\s)text-(?:lg|xl|[2-9]xl)(?=\s|$)/;
const TIGHT_LEADING = /(?:^|\s)leading-(?:tight|snug|none)(?=\s|$)/;
const ROOMY_LEADING = /(?:^|\s)leading-(?:normal|relaxed|loose|lyrics)(?=\s|$)/;

/** Valeurs de className écrites en littéral : "…", '…' ou `…` (les ${…} d'un gabarit sont ignorés). */
const CLASS_NAME = /className=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g;

export function findClippedTightText(source: string): ClippedTextIssue[] {
  const issues: ClippedTextIssue[] = [];
  for (const match of source.matchAll(CLASS_NAME)) {
    const classes = (match[1] ?? match[2] ?? match[3] ?? "").replace(/\$\{[^}]*\}/g, " ");
    if (!CLIPS.test(classes)) continue;
    const tight = TIGHT_LEADING.test(classes) || (TIGHT_SIZE.test(classes) && !ROOMY_LEADING.test(classes));
    if (!tight) continue;
    const line = source.slice(0, match.index).split("\n").length;
    issues.push({ line, classes: classes.trim() });
  }
  return issues;
}
