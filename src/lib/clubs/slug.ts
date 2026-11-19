const MAX_LENGTH = 48;
/** Adresses déjà prises sous /clubs par une page de l'app. */
const RESERVED = ["nouveau"];

/**
 * Slug d'un club, tiré de son nom (IA, stratégie d'URL) : minuscules, sans accents ni voyelles brèves,
 * mots séparés par des tirets. Les lettres arabes sont gardées, pour rester lisible. En cas de doublon,
 * un suffixe -2, -3… est ajouté.
 */
export function clubSlug(name: string, taken: readonly string[]): string {
  const base =
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_LENGTH)
      .replace(/-+$/, "") || "club";

  const unavailable = [...RESERVED, ...taken];
  if (!unavailable.includes(base)) return base;
  let n = 2;
  while (unavailable.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
