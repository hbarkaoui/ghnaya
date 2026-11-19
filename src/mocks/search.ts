import { findSnippet, LYRICS_KEY_MIN_LENGTH, MIN_SIGNIFICANT, prepareQuery, type PreparedQuery } from "@/lib/search/query";
import { PAGE_SIZE, type SearchOptions, type SearchResult, type SongHit } from "@/lib/search/types";
import { detectScript } from "@/lib/text/detectScript";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { toSearchKey } from "@/lib/text/searchKey";
import type { Song } from "@/types/catalog";

/**
 * MAQUETTE : la recherche du plan 1 (tâche 7) rejouée en mémoire sur les chansons fictives, en
 * attendant PostgreSQL et pg_trgm. Mêmes colonnes de recherche (tâche 6), même barème :
 *  - titre ou artiste qui commence par la requête : 10 points ;
 *  - similarité word_similarity, la plus forte des trois colonnes : jusqu'à 6 points ;
 *  - passage trouvé dans les paroles : 3 points.
 * Tri par score décroissant, puis par titre.
 */

/** Délai simulé d'une requête en base, pour voir l'état de chargement (aucun délai dans les tests). */
export const SIMULATED_LATENCY_MS = process.env.NODE_ENV === "test" ? 0 : 400;
const WORD_SIMILARITY_THRESHOLD = 0.5;
/**
 * Écart assumé avec le plan 1 : la clé de consonnes n'est pas comparée aux titres en dessous de
 * 3 consonnes. Sinon « ya lella » (clé « l ») ressort presque tout le catalogue, car « l » est
 * contenu dans la plupart des clés. À reporter dans la tâche 7 du plan 1.
 */
const TITLE_KEY_MIN_LENGTH = 3;

interface IndexedSong {
  song: Song;
  searchAr: string;
  searchLatin: string;
  searchKey: string;
  lyricsSearchAr: string;
  lyricsSearchKey: string;
}

const uniqueJoin = (parts: string[]) => [...new Set(parts.filter((p) => p.length > 0))].join(" ");

/** Colonnes de recherche d'une chanson, comme songSearchColumns (plan 1, tâche 6). */
function indexSong(song: Song): IndexedSong {
  const texts = [song.titleAr, song.titleLatin, ...song.artists.flatMap((a) => [a.nameAr, a.nameLatin])].filter(
    (t): t is string => !!t,
  );
  return {
    song,
    searchAr: uniqueJoin(texts.filter((t) => detectScript(t) !== "latin").map(normalizeArabic)),
    searchLatin: uniqueJoin(texts.filter((t) => detectScript(t) !== "arabic").map(normalizeLatin)),
    searchKey: uniqueJoin(texts.map(toSearchKey)),
    lyricsSearchAr: normalizeArabic(song.lyrics),
    lyricsSearchKey: toSearchKey(song.lyrics),
  };
}

const indexes = new WeakMap<readonly Song[], IndexedSong[]>();
function indexFor(songs: readonly Song[]): IndexedSong[] {
  let index = indexes.get(songs);
  if (!index) {
    index = songs.map(indexSong);
    indexes.set(songs, index);
  }
  return index;
}

/** Trigrammes d'un texte, mot par mot, comme pg_trgm : chaque mot est entouré de « ␣␣ » et « ␣ ». */
function trigrams(text: string): string[] {
  const out: string[] = [];
  for (const word of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (!word) continue;
    const chars = Array.from(`  ${word} `);
    for (let i = 0; i + 3 <= chars.length; i += 1) out.push(chars.slice(i, i + 3).join(""));
  }
  return out;
}

/** word_similarity de pg_trgm : meilleure similarité entre la requête et un passage continu du texte. */
function wordSimilarity(query: string, text: string): number {
  const wanted = new Set(trigrams(query));
  if (wanted.size === 0) return 0;
  const ordered = trigrams(text);
  let best = 0;
  for (let i = 0; i < ordered.length; i += 1) {
    if (!wanted.has(ordered[i])) continue;
    const extent = new Set<string>();
    let common = 0;
    for (let j = i; j < ordered.length; j += 1) {
      if (!extent.has(ordered[j])) {
        extent.add(ordered[j]);
        if (wanted.has(ordered[j])) common += 1;
      }
      best = Math.max(best, common / (wanted.size + extent.size - common));
    }
  }
  return best;
}

interface Scored {
  indexed: IndexedSong;
  score: number;
  lyricsMatch: boolean;
}

function scoreSong(indexed: IndexedSong, q: PreparedQuery): Scored | null {
  const parts: Array<[string, string]> = [
    [q.ar, indexed.searchAr],
    [q.lat, indexed.searchLatin],
  ];
  if (q.key.length >= TITLE_KEY_MIN_LENGTH) parts.push([q.key, indexed.searchKey]);

  let prefix = false;
  let similarity = 0;
  let titleMatch = false;
  for (const [value, column] of parts) {
    if (!value) continue;
    const sim = wordSimilarity(value, column);
    similarity = Math.max(similarity, sim);
    if (` ${column}`.includes(` ${value}`)) prefix = true;
    if (sim >= WORD_SIMILARITY_THRESHOLD || column.includes(value)) titleMatch = true;
  }
  const lyricsMatch =
    (q.ar !== "" && indexed.lyricsSearchAr.includes(q.ar)) ||
    (q.key.length >= LYRICS_KEY_MIN_LENGTH && indexed.lyricsSearchKey.includes(q.key));
  if (!titleMatch && !lyricsMatch) return null;
  return { indexed, lyricsMatch, score: (prefix ? 10 : 0) + 6 * similarity + (lyricsMatch ? 3 : 0) };
}

const sortTitle = (song: Song) => song.titleLatin ?? song.titleAr ?? "";
const byScoreThenTitle = (a: Scored, b: Scored) => {
  if (a.score !== b.score) return b.score - a.score;
  const [ta, tb] = [sortTitle(a.indexed.song), sortTitle(b.indexed.song)];
  return ta < tb ? -1 : ta > tb ? 1 : 0;
};

/**
 * Recherche en mémoire dans `songs`. `pageSize` ne sert qu'à l'aperçu de développement de la
 * pagination : le jeu fictif compte moins de 20 chansons.
 */
export function searchCatalog(
  songs: readonly Song[],
  raw: string,
  opts: SearchOptions = {},
  pageSize: number = PAGE_SIZE,
): SearchResult {
  const requested = Math.floor(opts.page ?? 1);
  const page = Number.isFinite(requested) ? Math.max(1, requested) : 1;
  const q = prepareQuery(raw);
  if (q.significant < MIN_SIGNIFICANT) return { items: [], total: 0, page, tooShort: true };

  const ranked = indexFor(songs)
    .filter(({ song }) => !opts.dialect || song.dialect === opts.dialect)
    .filter(({ song }) => !opts.artistId || song.artists.some((a) => a.id === opts.artistId))
    .map((indexed) => scoreSong(indexed, q))
    .filter((s): s is Scored => s !== null)
    .sort(byScoreThenTitle);

  const pageItems = ranked.slice((page - 1) * pageSize, page * pageSize);
  const items: SongHit[] = pageItems.map(({ indexed: { song }, lyricsMatch }) => ({
    id: song.id,
    titleAr: song.titleAr,
    titleLatin: song.titleLatin,
    dialect: song.dialect,
    artists: song.artists,
    snippet: lyricsMatch ? findSnippet(song.lyrics, q) : null,
  }));
  // Comme count(*) OVER () dans la requête SQL du plan 1 : 0 au-delà de la dernière page.
  return { items, total: items.length > 0 ? ranked.length : 0, page, tooShort: false };
}
