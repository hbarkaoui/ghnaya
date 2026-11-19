const ARABIC = /\p{Script=Arabic}/u;
const firstLetter = (word: string) => Array.from(word)[0] ?? "";

/**
 * Initiales d'un avatar.
 *  - Nom latin : première et dernière initiale (« Amira Ben Salah » → « AS »).
 *  - Nom arabe : une seule lettre, sans l'article « ال » (des initiales arabes accolées se lieraient).
 */
export function initials(name: string): string {
  const words = name.trim().split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "?";

  const first = words[0];
  if (ARABIC.test(first)) return firstLetter(first.startsWith("ال") && first.length > 3 ? first.slice(2) : first);

  const last = words.length > 1 ? firstLetter(words[words.length - 1]) : "";
  return (firstLetter(first) + last).toLocaleUpperCase();
}
