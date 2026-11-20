// Contrôle des icônes retournées en arabe (tâche 20). Outil de test, pas utilisé par l'application.
//
// Règle : une icône de lucide-react porte `rtl:-scale-x-100` si, et seulement si, elle indique une direction
// de lecture — chevrons et flèches horizontales (retour, précédent / suivant, flèches de liste), entrée et
// sortie (LogIn / LogOut), envoi (Send), « Lire » (Play) — ou si elle dessine une liste, dont les lignes
// suivent le sens de l'écriture (ListPlus, ListMusic). Une icône passée en prop (`Icon={LogOut}`) est
// retournée par le composant qui la reçoit quand la prop `flipIcon` est présente (MenuList).

export const DIRECTIONAL_ICONS = new Set([
  "ChevronLeft",
  "ChevronRight",
  "ChevronsLeft",
  "ChevronsRight",
  "ArrowLeft",
  "ArrowRight",
  "MoveLeft",
  "MoveRight",
  "LogIn",
  "LogOut",
  "Send",
  "SendHorizontal",
  "Reply",
  "Undo2",
  "Redo2",
  "Play",
  "ListPlus",
  "ListMusic",
]);

export type IconFlipIssue = { icon: string; line: number; problem: "flipped" | "not-flipped" };

const FLIP = "rtl:-scale-x-100";

/** Noms locaux importés de lucide-react (`X as Y` → Y), sans les imports de type. */
function lucideImports(source: string): Set<string> {
  const names = new Set<string>();
  for (const [, list] of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']lucide-react["']/g)) {
    for (const raw of list.split(",")) {
      const item = raw.trim();
      if (!item || item.startsWith("type ")) continue;
      names.add(item.split(/\s+as\s+/).pop()!.trim());
    }
  }
  return names;
}

/** Texte de la balise JSX ouverte à `start` (le « < »), jusqu'au « > » qui la ferme, accolades comprises. */
function tagAt(source: string, start: number): string {
  let depth = 0;
  for (let i = start + 1; i < source.length; i++) {
    const c = source[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return source.slice(start, i + 1);
  }
  return source.slice(start);
}

const lineOf = (source: string, index: number) => source.slice(0, index).split("\n").length;

function check(icon: string, flipped: boolean, line: number): IconFlipIssue[] {
  const directional = DIRECTIONAL_ICONS.has(icon);
  if (directional && !flipped) return [{ icon, line, problem: "not-flipped" }];
  if (!directional && flipped) return [{ icon, line, problem: "flipped" }];
  return [];
}

export function findIconFlipIssues(source: string): IconFlipIssue[] {
  const icons = lucideImports(source);
  if (icons.size === 0) return [];
  const issues: (IconFlipIssue & { index: number })[] = [];

  for (const match of source.matchAll(/<([A-Z]\w*)\b/g)) {
    if (!icons.has(match[1])) continue;
    const tag = tagAt(source, match.index);
    for (const issue of check(match[1], tag.includes(FLIP), lineOf(source, match.index)))
      issues.push({ ...issue, index: match.index });
  }

  for (const match of source.matchAll(/\bIcon=\{([A-Z]\w*)\}/g)) {
    if (!icons.has(match[1])) continue;
    const tag = tagAt(source, source.lastIndexOf("<", match.index));
    for (const issue of check(match[1], /\bflipIcon\b/.test(tag), lineOf(source, match.index)))
      issues.push({ ...issue, index: match.index });
  }

  return issues.sort((a, b) => a.index - b.index).map(({ icon, line, problem }) => ({ icon, line, problem }));
}
