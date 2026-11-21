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
/**
 * Tâche 15 : à défaut de la phrase exacte, une requête arabe d'au moins `LYRICS_WORDS_MIN` mots de
 * `LYRICS_WORD_MIN_LENGTH` lettres ou plus trouve aussi les paroles qui ont tous ces mots, dans n'importe quel
 * ordre. Les versions chantées reprennent et intercalent des mots : « تفيد بإيه يا ندم » n'est pas en entier dans
 * « تفيد بإيه، إيه، إيه يا ندم ». Ces chansons ne gagnent pas de points : avec leur similarité de titre, elles
 * passeraient devant celle qui a la phrase exacte (« ليه تبكي ما انا قلبي » devant « جرح الناس »).
 */
export const LYRICS_WORD_MIN_LENGTH = 3;
export const LYRICS_WORDS_MIN = 2;
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

/** Mots de la requête arabe cherchés un par un dans les paroles, ou aucun (voir `LYRICS_WORDS_MIN`). */
export function lyricsWords(q: PreparedQuery): string[] {
  const words = [...new Set(q.ar.split(" ").filter((w) => w.length >= LYRICS_WORD_MIN_LENGTH))];
  return words.length >= LYRICS_WORDS_MIN ? words : [];
}

/** Spec §6.2 : la clé ne cherche dans les paroles que pour une requête en latin. */
export const usesLyricsKey = (q: PreparedQuery): boolean => q.lat !== "" && q.key.length >= LYRICS_KEY_MIN_LENGTH;

/**
 * Première ligne qui a la phrase cherchée (arabe normalisé, ou clé pour une requête en latin). À défaut, la
 * ligne qui a le plus de mots de `lyricsWords`, puisque la chanson peut les avoir répartis sur plusieurs lignes.
 */
export function findSnippet(lyrics: string, q: PreparedQuery): string | null {
  const lines = lyrics
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const exact = lines.find(
    (line) => (q.ar && normalizeArabic(line).includes(q.ar)) || (usesLyricsKey(q) && toSearchKey(line).includes(q.key)),
  );
  if (exact) return exact;

  const words = lyricsWords(q);
  let best: string | null = null;
  let bestCount = 0;
  for (const line of lines) {
    const normalized = normalizeArabic(line);
    const count = words.filter((w) => normalized.includes(w)).length;
    if (count > bestCount) [best, bestCount] = [line, count];
  }
  return best;
}
