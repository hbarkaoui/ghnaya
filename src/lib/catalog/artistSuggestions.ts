import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { suggestArtists, type KnownArtist } from "@/lib/contribution/artists";
import { db } from "@/lib/db/client";
import { countSignificant, detectScript } from "@/lib/text/detectScript";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { toSearchKey } from "@/lib/text/searchKey";

/**
 * Artistes de la table `artists` pour la saisie d'une proposition (spec §8.1). La base ne livre que des
 * candidats ; `suggestArtists` et `resolveArtists` (lib/contribution/artists, testés sans base) les classent
 * et les comparent, comme du temps de la maquette.
 */

const CANDIDATES_MAX = 200;
const SUGGESTIONS_MAX = 5;

// Les chaînes normalisées ne contiennent que des lettres, des chiffres et des espaces : aucun caractère
// spécial de LIKE (% ou _) ne peut s'y trouver (même raisonnement que `searchSongs`).
const contains = (column: "search_ar" | "search_latin" | "search_key", value: string): SQL =>
  sql`${sql.raw(column)} LIKE ${`%${value}%`}`;

/** Conditions qui retrouvent un nom dans l'une ou l'autre écriture ; la clé de consonnes rapproche l'arabizi de l'arabe. */
function matches(name: string, withKey: boolean): SQL[] {
  const script = detectScript(name);
  const clauses: SQL[] = [];
  const ar = script !== "latin" ? normalizeArabic(name) : "";
  const latin = script !== "arabic" ? normalizeLatin(name) : "";
  const key = toSearchKey(name);
  if (ar) clauses.push(contains("search_ar", ar));
  if (latin) clauses.push(contains("search_latin", latin));
  if (withKey && key.length >= 2) clauses.push(contains("search_key", key));
  return clauses;
}

async function candidatesWhere(clauses: SQL[]): Promise<KnownArtist[]> {
  if (clauses.length === 0) return [];
  const res = await db.execute<{ id: string; name_ar: string | null; name_latin: string | null }>(sql`
    SELECT id, name_ar, name_latin FROM artists
    WHERE ${sql.join(clauses, sql` OR `)}
    ORDER BY length(search_ar) + length(search_latin), id
    LIMIT ${CANDIDATES_MAX}`);
  return res.rows.map((r) => ({ id: r.id, nameAr: r.name_ar, nameLatin: r.name_latin }));
}

/** Autocomplétion : à partir de 2 lettres, les artistes connus qui répondent à la saisie, les meilleurs d'abord. */
export async function suggestArtistsFromDb(query: string, limit = SUGGESTIONS_MAX): Promise<KnownArtist[]> {
  const q = query.trim();
  if (countSignificant(q) < 2) return [];
  return suggestArtists(q, await candidatesWhere(matches(q, true)), limit);
}

/** Artistes qui peuvent porter l'un de ces noms saisis : la matière de `resolveArtists`, qui compare les noms en entier. */
export async function artistCandidates(names: readonly string[]): Promise<KnownArtist[]> {
  return candidatesWhere(names.flatMap((name) => matches(name, false)));
}
