import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { CHAR_MAP, LATIN_DIGRAPHS } from "@/lib/text/searchKeyMap";
import { LYRICS_KEY_MIN_LENGTH, type PreparedQuery } from "./query";

export interface SnippetSegment {
  text: string;
  hit: boolean;
}

/**
 * Texte transformé (normalisé ou clé de consonnes), avec pour chacun de ses caractères la plage
 * [from, to[ du texte d'origine dont il provient. Sert à reporter une correspondance trouvée sur le
 * texte transformé vers le texte affiché, signes diacritiques compris.
 */
interface Mapped {
  text: string;
  from: number[];
  to: number[];
}

const WORD_CHAR = /[\p{L}\p{M}\p{N}]/u;

/** Parcourt le texte par point de code, avec sa position (en unités UTF-16) dans la chaîne. */
function* codePoints(text: string): Generator<[string, number]> {
  for (let i = 0; i < text.length; ) {
    const char = String.fromCodePoint(text.codePointAt(i) ?? 0);
    yield [char, i];
    i += char.length;
  }
}

/** Même résultat que normalizeArabic(text), caractère par caractère. */
function mapArabic(text: string): Mapped {
  const out: Mapped = { text: "", from: [], to: [] };
  const push = (char: string, from: number, to: number) => {
    out.text += char;
    out.from.push(from);
    out.to.push(to);
  };
  for (const [char, i] of codePoints(text)) {
    const normalized = normalizeArabic(char);
    if (normalized) {
      for (const c of normalized) push(c, i, i + char.length);
    } else if (!WORD_CHAR.test(char) && out.text && !out.text.endsWith(" ")) {
      // Espace ou ponctuation : un seul séparateur. Les signes diacritiques et le tatweel disparaissent.
      push(" ", i, i + char.length);
    }
  }
  return out;
}

/** Même résultat que toSearchKey(text), caractère par caractère. */
function mapSearchKey(text: string): Mapped {
  const stream: Array<{ c: string; from: number; to: number }> = [];
  for (const [char, i] of codePoints(text)) {
    const decomposed = char.normalize("NFD").replace(/\p{M}/gu, "").replace(/ـ/g, "").toLowerCase();
    for (const c of decomposed) stream.push({ c, from: i, to: i + char.length });
  }
  const out: Mapped = { text: "", from: [], to: [] };
  const emit = (mapped: string, from: number, to: number) => {
    for (const c of mapped) {
      if (out.text.endsWith(c)) {
        out.to[out.to.length - 1] = to; // doublon consécutif réduit : la plage s'étend
      } else {
        out.text += c;
        out.from.push(from);
        out.to.push(to);
      }
    }
  };
  for (let k = 0; k < stream.length; ) {
    const next = stream[k + 1];
    const digraph = next ? LATIN_DIGRAPHS[stream[k].c + next.c] : undefined;
    if (digraph !== undefined && next) {
      emit(digraph, stream[k].from, next.to);
      k += 2;
      continue;
    }
    const mapped = CHAR_MAP[stream[k].c];
    if (mapped !== undefined) emit(mapped, stream[k].from, stream[k].to);
    k += 1;
  }
  return out;
}

function locate(mapped: Mapped, needle: string): [number, number] | null {
  const index = needle ? mapped.text.indexOf(needle) : -1;
  return index < 0 ? null : [mapped.from[index], mapped.to[index + needle.length - 1]];
}

/**
 * Découpe une ligne d'extrait (renvoyée par findSnippet) pour surligner le passage trouvé.
 * Mêmes règles que findSnippet : d'abord l'arabe normalisé, puis la clé de consonnes (arabizi).
 * Le surlignage couvre des mots entiers : couper un mot arabe au milieu casserait la liaison des lettres.
 */
export function highlightSnippet(line: string, q: PreparedQuery): SnippetSegment[] {
  const range =
    (q.ar ? locate(mapArabic(line), q.ar) : null) ??
    (q.key.length >= LYRICS_KEY_MIN_LENGTH ? locate(mapSearchKey(line), q.key) : null);
  if (!range) return [{ text: line, hit: false }];

  let [start, end] = range;
  while (start > 0 && WORD_CHAR.test(line[start - 1])) start -= 1;
  while (end < line.length && WORD_CHAR.test(line[end])) end += 1;

  return [
    { text: line.slice(0, start), hit: false },
    { text: line.slice(start, end), hit: true },
    { text: line.slice(end), hit: false },
  ].filter((segment) => segment.text.length > 0);
}
