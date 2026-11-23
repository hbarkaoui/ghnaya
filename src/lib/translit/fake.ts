// Plan 4, tâche 3 : générateur factice, déterministe, sans réseau (écart 7). Ce n'est pas une vraie
// translittération (pas de voyelles courtes) : il sert aux tests et au développement sans clé.
import type { TranslitGenerator } from "./generator";

const LETTERS: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "7", خ: "kh", د: "d", ذ: "dh",
  ر: "r", ز: "z", س: "s", ش: "ch", ص: "s", ض: "dh", ط: "t", ظ: "dh", ع: "3", غ: "gh", ف: "f", ق: "9",
  ك: "k", ل: "l", م: "m", ن: "n", ه: "h", ة: "a", و: "ou", ي: "i", ى: "a", ء: "2", ئ: "2", ؤ: "2",
};
/** Harakat, chadda, soukoun et tatwil. */
const MARKS = /[ً-ْـ]/g;

export function fakeTranslit(lyrics: string): string {
  return lyrics
    .split("\n")
    .map((line) => [...line.replace(MARKS, "")].map((char) => LETTERS[char] ?? char).join(""))
    .join("\n");
}

export const fakeGenerator: TranslitGenerator = async ({ lyrics }) => fakeTranslit(lyrics);
