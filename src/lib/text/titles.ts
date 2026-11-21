// Plan 1, tâche 4 : nettoyage des titres et des artistes importés (LRCLIB).
import { detectScript } from "./detectScript";
import { normalizeLatin } from "./normalizeLatin";

const NOISE =
  /\s*[(\[][^)\]]*(official|video|clip|lyric|audio|\bhd\b|\bhq\b|4k|visuali[sz]er|exclusive|كلمات|فيديو|كليب|حصري)[^)\]]*[)\]]/giu;
const FEAT_IN_TITLE = /\s*[(\[]\s*(?:feat\.?|ft\.?|featuring)\s+([^)\]]+)[)\]]/iu;
const TRACK_NUMBER = /^\s*\d{1,3}\s*[.\-)]\s*/u;
const ARTIST_SEP = /\s*(?:,|&|;|؛|\bfeat\.?(?=\s)|\bft\.?(?=\s)|\bfeaturing\b)\s*/iu;
/** Séparateur des valeurs multiples des tags ID3v2.4, présent dans l'export LRCLIB ; PostgreSQL le refuse. */
const NUL = "\u0000";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitArtists(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.replaceAll(NUL, ";").split(ARTIST_SEP)) {
    const name = part.trim();
    const key = normalizeLatin(name);
    if (name && !seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

export interface CleanTitle {
  title: string;
  featuring: string[];
}

export function cleanImportedTitle(raw: string, artistNames: string[]): CleanTitle {
  let t = raw.trim();
  let featuring: string[] = [];
  const feat = t.match(FEAT_IN_TITLE);
  if (feat) {
    featuring = splitArtists(feat[1]);
    t = t.replace(FEAT_IN_TITLE, "");
  }
  t = t.replace(NOISE, "").replace(/\s*\|.*$/u, "").replace(TRACK_NUMBER, "");
  // « Artiste [feat. Invité] - Titre » : la partie gauche contient l'artiste du morceau.
  const artistKeys = new Set(artistNames.map(normalizeLatin));
  const dash = t.match(/^(.+?)\s+[-–—]\s+(.+)$/u);
  if (dash) {
    const left = splitArtists(dash[1]);
    if (left.some((n) => artistKeys.has(normalizeLatin(n)))) {
      featuring = [...featuring, ...left.filter((n) => !artistKeys.has(normalizeLatin(n)))];
      t = dash[2];
    }
  }
  for (const artist of artistNames) {
    const prefix = new RegExp(`^${escapeRegExp(artist)}\\s*(?:[-–—:]\\s*|\\s+)(?=\\S)`, "iu");
    t = t.replace(prefix, "");
  }
  t = t.replace(/\s+/gu, " ").trim();
  return { title: t || raw.trim(), featuring };
}

export function splitTitleScripts(title: string): { titleAr?: string; titleLatin?: string } {
  const script = detectScript(title);
  if (script === "arabic") return { titleAr: title };
  if (script === "latin") return { titleLatin: title };
  const words = title.split(/\s+/u);
  const ar = words.filter((w) => detectScript(w) === "arabic").join(" ");
  const lat = words
    .filter((w) => detectScript(w) !== "arabic")
    .join(" ")
    .replace(/[\s\-–—|:]+$/u, "")
    .trim();
  return { ...(ar ? { titleAr: ar } : {}), ...(lat ? { titleLatin: lat } : {}) };
}
