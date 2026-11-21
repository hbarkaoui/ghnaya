// Plan 1, tâche 7 : préparation de la requête et extrait de paroles. Fonctions pures, partagées
// par la recherche (fictive aujourd'hui, SQL demain) et par le surlignage de l'extrait.
import { countSignificant, detectScript } from "@/lib/text/detectScript";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { toSearchKey } from "@/lib/text/searchKey";

/** Une requête de moins de 2 caractères significatifs (lettres ou chiffres) ne lance pas de recherche. */
export const MIN_SIGNIFICANT = 2;
/** En dessous de 4 consonnes, la clé ne sert pas à chercher dans les paroles (trop de faux positifs). */
export const LYRICS_KEY_MIN_LENGTH = 4;
/**
 * Écart 4 du plan 1 : en dessous de 3 consonnes, la clé ne sert pas à chercher dans les titres et les
 * artistes. Sinon « ya lella » (clé « l ») ressort presque tout le catalogue.
 */
export const TITLE_KEY_MIN_LENGTH = 3;
/** Seuil de word_similarity (opérateur <% de pg_trgm). À ajuster avec `pnpm bench:search`. */
export const WORD_SIMILARITY_THRESHOLD = 0.5;
const MAX_QUERY_LENGTH = 200;

export interface PreparedQuery {
  significant: number;
  ar: string;
  lat: string;
  key: string;
}

export function prepareQuery(raw: string): PreparedQuery {
  const q = raw.trim().slice(0, MAX_QUERY_LENGTH);
  const script = detectScript(q);
  return {
    significant: countSignificant(q),
    ar: script === "latin" ? "" : normalizeArabic(q),
    lat: script === "arabic" ? "" : normalizeLatin(q),
    key: toSearchKey(q),
  };
}

export function findSnippet(lyrics: string, q: PreparedQuery): string | null {
  for (const line of lyrics.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (q.ar && normalizeArabic(trimmed).includes(q.ar)) return trimmed;
    if (q.key.length >= LYRICS_KEY_MIN_LENGTH && toSearchKey(trimmed).includes(q.key)) return trimmed;
  }
  return null;
}
