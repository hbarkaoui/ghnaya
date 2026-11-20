import { detectScript } from "./detectScript";

export type ScriptAttrs = { lang?: "ar"; dir: "rtl" | "ltr" | "auto" };

/**
 * `lang` et `dir` d'un fragment saisi par quelqu'un (nom de club, de playlist, de personne, titre) selon
 * son écriture (brief, accessibilité) : un fragment arabe porte `lang="ar"` et `dir="rtl"`, un fragment
 * latin `dir="ltr"` (sa langue reste inconnue : français, arabizi…). Un texte mêlé, ou sans lettre, est
 * laissé au navigateur (`dir="auto"`).
 */
export function scriptAttrs(text: string): ScriptAttrs {
  if (!/\p{L}/u.test(text)) return { dir: "auto" };
  const script = detectScript(text);
  if (script === "arabic") return { lang: "ar", dir: "rtl" };
  if (script === "latin") return { dir: "ltr" };
  return { dir: "auto" };
}

/** Texte brut d'un nœud React simple : chaîne, nombre, ou morceaux passés par t.rich à une balise. */
export function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}
