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
/**
 * Tâche 15 : une clé de 2 consonnes sert encore, mais seulement pour un titre ou un nom entier.
 * Sans cela, « nasaya » (clé « ns ») ne trouve « Nassaya » que par trigrammes, où « maya nasri » l'emporte.
 */
export const WHOLE_KEY_MIN_LENGTH = 2;
/**
 * Tâche 15 : en dessous de 6 consonnes, un passage de paroles trouvé par la clé ne rapporte pas de points.
 * La clé n'a pas d'espaces : une suite de 4 ou 5 consonnes se trouve par hasard, à cheval sur deux mots,
 * dans beaucoup de paroles (« lhstn » dans « ala hastanna »). La chanson reste trouvée, avec son extrait.
 */
export const LYRICS_KEY_SCORE_MIN_LENGTH = 6;
/**
 * Barème de la spec §6.2, revu à la tâche 15 : un début de clé seul vaut moins qu'un début de texte exact,
 * et la similarité de clé est pondérée par `keySimilarityFactor`. La clé n'a qu'une quinzaine de symboles et
 * pas d'espaces : à niveau égal, ses trigrammes prouvent moins que ceux du texte (« el hawa sotan »
 * ressemble autant, par la clé, à « Chitana el hass » que, par le texte, à « El Hawa Sultan »).
 */
export const SCORE = { textPrefix: 10, keyPrefix: 5, similarity: 6, keySimilarityFactor: 0.8, lyrics: 3 } as const;
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
