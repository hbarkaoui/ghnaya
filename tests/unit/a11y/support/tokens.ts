/**
 * Lecture des tokens de couleur de src/app/design-tokens.css, par portée :
 *  - light : `:root, [data-theme="light"]` ;
 *  - dark : le clair, recouvert par `[data-theme="dark"]` ;
 *  - systemDark / darkOverrides : les deux blocs du sombre tels quels (le premier sous
 *    `@media (prefers-color-scheme: dark)`), pour vérifier qu'ils disent la même chose ;
 *  - reader / readerLight : le lecteur `[data-reader]`, sombre par défaut, puis son thème clair, posés
 *    sur le thème clair de l'app (le lecteur ne lit pas les couleurs de l'app, sauf --color-border-focus).
 * Les `var(--x)` sont résolues dans la portée, comme le ferait le navigateur sur un même élément.
 */

export type TokenScope = Record<string, string>;

export type TokenScopes = {
  light: TokenScope;
  dark: TokenScope;
  systemDark: TokenScope;
  darkOverrides: TokenScope;
  reader: TokenScope;
  readerLight: TokenScope;
};

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Déclarations `--nom: valeur;` du premier bloc dont le sélecteur (sans les espaces) vaut `selector`. */
function declarationsOf(css: string, selector: string): TokenScope {
  const compact = (s: string) => s.replace(/\s+/g, "");
  const blocks = css.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const [, head, body] of blocks) {
    if (compact(head) !== compact(selector)) continue;
    const scope: TokenScope = {};
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) scope[name] = value.trim();
    return scope;
  }
  throw new Error(`Bloc introuvable : ${selector}`);
}

/** Résout les var(--x) (avec ou sans valeur de repli) dans la portée. */
function resolve(scope: TokenScope): TokenScope {
  const resolved: TokenScope = {};
  const valueOf = (name: string, seen: Set<string>): string => {
    if (resolved[name] !== undefined) return resolved[name];
    if (seen.has(name)) throw new Error(`Référence circulaire : ${name}`);
    const raw = scope[name];
    if (raw === undefined) throw new Error(`Token absent : ${name}`);
    const next = new Set(seen).add(name);
    const value = raw.replace(/var\((--[\w-]+)(?:\s*,[^)]*)?\)/g, (_, ref: string) =>
      scope[ref] === undefined ? `var(${ref})` : valueOf(ref, next),
    );
    resolved[name] = value;
    return value;
  };
  for (const name of Object.keys(scope)) valueOf(name, new Set());
  return resolved;
}

export function readTokenScopes(source: string): TokenScopes {
  const css = stripComments(source);
  const base = declarationsOf(css, ':root,[data-theme="light"]');
  const darkOverrides = declarationsOf(css, '[data-theme="dark"]');
  const media = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{([\s\S]*?\})\s*\}/);
  if (!media) throw new Error("Bloc @media (prefers-color-scheme: dark) introuvable");
  const systemDark = declarationsOf(media[1], ':root:not([data-theme="light"])');
  const reader = declarationsOf(css, "[data-reader]");
  const readerLight = declarationsOf(css, '[data-reader][data-reader-theme="light"]');

  return {
    light: resolve(base),
    dark: resolve({ ...base, ...darkOverrides }),
    systemDark,
    darkOverrides,
    reader: resolve({ ...base, ...reader }),
    readerLight: resolve({ ...base, ...reader, ...readerLight }),
  };
}
