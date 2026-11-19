// Plan 1, tâche 2 : normalisation de l'arabe (colonne search_ar et requêtes).

/** Signes diacritiques (tashkeel, marques coraniques, alif suscrit) et tatweel. */
const MARKS_AND_TATWEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const LETTER_MAP: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ى": "ي",
  "ة": "ه",
  "ؤ": "و",
  "ئ": "ي",
  "ک": "ك",
  "ی": "ي",
};
const LETTER_RE = /[أإآٱىةؤئکی]/g;
const EASTERN_DIGITS = /[٠-٩۰-۹]/g;

export function normalizeArabic(input: string): string {
  return input
    .normalize("NFC")
    .replace(MARKS_AND_TATWEEL, "")
    .replace(LETTER_RE, (c) => LETTER_MAP[c] ?? c)
    .replace(EASTERN_DIGITS, (d) => {
      const code = d.charCodeAt(0);
      return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
    })
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
