import { countSignificant, detectScript } from "@/lib/text/detectScript";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { toSearchKey } from "@/lib/text/searchKey";
import type { ArtistRef, Song } from "@/types/catalog";
import type { ProposedArtist } from "@/types/proposal";

/** Artiste de la base, tel que l'autocomplétion le connaît. */
export type KnownArtist = Pick<ArtistRef, "id" | "nameAr" | "nameLatin">;

const SUGGESTIONS_MAX = 5;

/** Artistes du catalogue, chacun une seule fois. MAQUETTE : le plan 3 interrogera la table `artists`. */
export function knownArtists(songs: readonly Pick<Song, "artists">[]): KnownArtist[] {
  const byId = new Map<string, KnownArtist>();
  for (const { artists } of songs) {
    for (const { id, nameAr, nameLatin } of artists) if (!byId.has(id)) byId.set(id, { id, nameAr, nameLatin });
  }
  return [...byId.values()];
}

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/**
 * Clés de consonnes d'un nom, mot par mot. Un mot arabe qui commence par l'article « ال » accepte
 * aussi sa clé sans l'article : « الرياحي » se tape « riahi » autant que « erriahi ».
 */
function wordKeys(name: string): string[][] {
  return words(name)
    .map((word) => {
      const key = toSearchKey(word);
      return word.startsWith("ال") && key.startsWith("l") ? [key, key.slice(1)] : [key];
    })
    .filter((keys) => keys[0] !== "");
}

/** Les mots de la requête commencent, dans l'ordre, des mots consécutifs du nom. */
function keySequenceMatches(query: string[], name: string[][]): boolean {
  for (let start = 0; start + query.length <= name.length; start += 1) {
    if (query.every((q, i) => name[start + i].some((key) => key.startsWith(q)))) return true;
  }
  return false;
}

/**
 * Note d'un nom pour une requête :
 *  4 : le nom commence par la requête, dans la même écriture ;
 *  3 : un autre mot du nom commence par la requête ;
 *  2 : le nom contient la requête ;
 *  1 : la requête rejoint l'autre écriture par la clé de consonnes, mot à mot (arabizi ↔ arabe) ;
 *  0 : aucun rapport.
 */
function scoreName(name: string | null, nameScript: "arabic" | "latin", query: string): number {
  if (!name) return 0;
  const queryScript = detectScript(query);
  if (queryScript === nameScript || queryScript === "mixed") {
    const normalize = nameScript === "arabic" ? normalizeArabic : normalizeLatin;
    const [n, q] = [normalize(name), normalize(query)];
    if (q && n.startsWith(q)) return 4;
    if (q && ` ${n}`.includes(` ${q}`)) return 3;
    if (q && n.includes(q)) return 2;
  }
  if (queryScript !== nameScript) {
    const queryKeys = words(query).map(toSearchKey).filter(Boolean);
    if (queryKeys.join("").length >= 2 && keySequenceMatches(queryKeys, wordKeys(name))) return 1;
  }
  return 0;
}

const sortName = (a: KnownArtist) => a.nameLatin ?? a.nameAr ?? "";

/** Suggestions d'artistes pour l'autocomplétion : à partir de 2 lettres, les meilleures d'abord. */
export function suggestArtists(query: string, artists: readonly KnownArtist[], limit = SUGGESTIONS_MAX): KnownArtist[] {
  const q = query.trim();
  if (countSignificant(q) < 2) return [];
  return artists
    .map((artist) => ({
      artist,
      score: Math.max(scoreName(artist.nameAr, "arabic", q), scoreName(artist.nameLatin, "latin", q)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || sortName(a.artist).localeCompare(sortName(b.artist)))
    .slice(0, limit)
    .map(({ artist }) => artist);
}

/** Clé d'égalité de deux noms : sans casse, accents, signes ni variantes de l'alif. */
const nameKey = (name: string) => normalizeLatin(normalizeArabic(name));

/**
 * Artistes d'une proposition : un nom qui correspond à un artiste connu (dans l'une ou l'autre
 * écriture) le désigne ; sinon c'est un nouvel artiste, rangé selon l'écriture de son nom.
 */
export function resolveArtists(names: readonly string[], known: readonly KnownArtist[]): ProposedArtist[] {
  const out: ProposedArtist[] = [];
  for (const name of names) {
    const key = nameKey(name);
    const match = known.find((a) => [a.nameAr, a.nameLatin].some((n) => n !== null && nameKey(n) === key));
    if (match) {
      if (!out.some((a) => a.id === match.id)) out.push({ id: match.id, nameAr: match.nameAr, nameLatin: match.nameLatin });
      continue;
    }
    const arabic = detectScript(name) !== "latin";
    out.push({ id: null, nameAr: arabic ? name : null, nameLatin: arabic ? null : name });
  }
  return out;
}
