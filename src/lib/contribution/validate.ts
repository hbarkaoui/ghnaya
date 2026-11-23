import { detectScript } from "@/lib/text/detectScript";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { isDialect, type Dialect } from "@/types/catalog";

/**
 * Validation d'une proposition (spec §8.1), en fonctions pures : le serveur la rejoue à chaque envoi,
 * et le plan 3 la reprendra dans son schéma zod. Les erreurs sont des codes, traduits par l'appelant
 * dans la langue de l'interface (messages `contribute.errors.*`), avec leurs valeurs en chaînes (ICU).
 */

export const TITLE_MAX_LENGTH = 200;
export const ARTIST_NAME_MAX_LENGTH = 120;
export const ARTISTS_MAX = 6;
export const LYRICS_MIN_LENGTH = 20;
export const LYRICS_MAX_LENGTH = 20_000;
/** La translittération est plus longue que l'arabe (voyelles écrites, « ch », « kh »…). */
export const TRANSLIT_MAX_LENGTH = 30_000;

/** Ce que le formulaire envoie, tel quel. */
export interface ProposalInput {
  titleAr: string;
  titleLatin: string;
  artists: string[];
  lyrics: string;
  dialect: string;
  translit: string;
  rights: boolean;
}

/** Proposition validée et normalisée ; les artistes sont encore des noms (voir resolveArtists). */
export interface ProposalDraft {
  titleAr: string | null;
  titleLatin: string | null;
  artists: string[];
  lyrics: string;
  lyricsTranslit: string | null;
  dialect: Dialect;
}

/** `title` porte l'erreur commune aux deux titres ; `form` les erreurs qui ne visent aucun champ. */
export type ProposalField =
  | "title"
  | "titleAr"
  | "titleLatin"
  | "artists"
  | "lyrics"
  | "dialect"
  | "translit"
  | "rights"
  | "form";

export type ProposalErrorCode =
  | "titleMissing"
  | "titleTooLong"
  | "titleArNotArabic"
  | "titleLatinHasArabic"
  | "artistsMissing"
  | "artistsTooMany"
  | "artistTooLong"
  | "lyricsMissing"
  | "lyricsTooShort"
  | "lyricsTooLong"
  | "lyricsNotArabic"
  | "dialectMissing"
  | "translitTooLong"
  | "translitHasArabic"
  | "translitLines"
  | "rightsMissing"
  | "unchanged"
  | "pendingExists"
  | "songMissing"
  | "emailNotVerified"
  | "tooMany";

export interface ProposalError {
  code: ProposalErrorCode;
  values?: Record<string, string>;
}

export type ProposalErrors = Partial<Record<ProposalField, ProposalError>>;

export type ProposalValidation = { ok: true; draft: ProposalDraft } | { ok: false; errors: ProposalErrors };

/**
 * Texte sur plusieurs lignes (paroles, translittération) : fins de ligne unifiées, espaces de fin de
 * ligne retirés, pas de ligne vide au début ni à la fin, une seule ligne vide entre deux couplets.
 */
export function normalizeMultiline(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
}

const hasArabicLetters = (text: string) => detectScript(text) !== "latin";
const lineCount = (text: string) => text.split("\n").length;
/** Clé de comparaison d'un nom : sans casse, accents, signes ni variantes de l'alif. */
const nameKey = (name: string) => normalizeLatin(normalizeArabic(name));

function checkTitle(value: string, script: "arabic" | "latin"): ProposalError | null {
  if (value.length > TITLE_MAX_LENGTH) return { code: "titleTooLong", values: { max: String(TITLE_MAX_LENGTH) } };
  if (script === "arabic" && !hasArabicLetters(value)) return { code: "titleArNotArabic" };
  if (script === "latin" && hasArabicLetters(value)) return { code: "titleLatinHasArabic" };
  return null;
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names.map((n) => n.trim()).filter(Boolean)) {
    const key = nameKey(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function checkArtists(artists: string[]): ProposalError | null {
  if (artists.length === 0) return { code: "artistsMissing" };
  if (artists.length > ARTISTS_MAX) return { code: "artistsTooMany", values: { max: String(ARTISTS_MAX) } };
  if (artists.some((a) => a.length > ARTIST_NAME_MAX_LENGTH))
    return { code: "artistTooLong", values: { max: String(ARTIST_NAME_MAX_LENGTH) } };
  return null;
}

function checkLyrics(lyrics: string): ProposalError | null {
  if (lyrics === "") return { code: "lyricsMissing" };
  if (lyrics.length < LYRICS_MIN_LENGTH) return { code: "lyricsTooShort", values: { min: String(LYRICS_MIN_LENGTH) } };
  if (lyrics.length > LYRICS_MAX_LENGTH) return { code: "lyricsTooLong", values: { max: String(LYRICS_MAX_LENGTH) } };
  if (!hasArabicLetters(lyrics)) return { code: "lyricsNotArabic" };
  return null;
}

function checkTranslit(translit: string, lyrics: string, lyricsValid: boolean): ProposalError | null {
  if (translit.length > TRANSLIT_MAX_LENGTH)
    return { code: "translitTooLong", values: { max: String(TRANSLIT_MAX_LENGTH) } };
  if (hasArabicLetters(translit)) return { code: "translitHasArabic" };
  // Une ligne latine par ligne arabe (spec §7) ; la comparaison n'a de sens que sur des paroles valides.
  if (lyricsValid && lineCount(translit) !== lineCount(lyrics)) {
    return { code: "translitLines", values: { expected: String(lineCount(lyrics)), actual: String(lineCount(translit)) } };
  }
  return null;
}

export function validateProposal(input: ProposalInput): ProposalValidation {
  const errors: ProposalErrors = {};
  const titleAr = input.titleAr.trim();
  const titleLatin = input.titleLatin.trim();
  const artists = uniqueNames(input.artists);
  const lyrics = normalizeMultiline(input.lyrics);
  const translit = normalizeMultiline(input.translit);

  if (!titleAr && !titleLatin) errors.title = { code: "titleMissing" };
  const titleArError = titleAr ? checkTitle(titleAr, "arabic") : null;
  if (titleArError) errors.titleAr = titleArError;
  const titleLatinError = titleLatin ? checkTitle(titleLatin, "latin") : null;
  if (titleLatinError) errors.titleLatin = titleLatinError;

  const artistsError = checkArtists(artists);
  if (artistsError) errors.artists = artistsError;

  const lyricsError = checkLyrics(lyrics);
  if (lyricsError) errors.lyrics = lyricsError;

  if (!isDialect(input.dialect)) errors.dialect = { code: "dialectMissing" };

  const translitError = translit ? checkTranslit(translit, lyrics, !lyricsError) : null;
  if (translitError) errors.translit = translitError;

  if (!input.rights) errors.rights = { code: "rightsMissing" };

  if (Object.keys(errors).length > 0 || !isDialect(input.dialect)) return { ok: false, errors };
  return {
    ok: true,
    draft: {
      titleAr: titleAr || null,
      titleLatin: titleLatin || null,
      artists,
      lyrics,
      lyricsTranslit: translit || null,
      dialect: input.dialect,
    },
  };
}

const text = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

/** Lit le formulaire de /contribuer (`artist` est répété, un champ par artiste). */
export function proposalInputFromFormData(data: FormData): ProposalInput {
  return {
    titleAr: text(data, "titleAr"),
    titleLatin: text(data, "titleLatin"),
    artists: data.getAll("artist").filter((v): v is string => typeof v === "string"),
    lyrics: text(data, "lyrics"),
    dialect: text(data, "dialect"),
    translit: text(data, "translit"),
    rights: data.get("rights") !== null,
  };
}
