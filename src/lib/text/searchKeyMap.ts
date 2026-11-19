// Plan 1, tâche 3. Unique source de vérité de la clé de consonnes (spec §6.1).
// Valeur '' = caractère retiré. Caractère absent de la table = ignoré.
export const LATIN_DIGRAPHS: Readonly<Record<string, string>> = {
  ch: "c",
  sh: "c",
  kh: "x",
  gh: "g",
  th: "t",
  dh: "z",
  dj: "j",
};

export const CHAR_MAP: Readonly<Record<string, string>> = {
  // Arabe
  "ب": "b", "پ": "b",
  "ت": "t", "ط": "t", "ث": "t",
  "ج": "j",
  "ح": "h", "ه": "h",
  "خ": "x",
  "د": "d", "ض": "d",
  "ذ": "z", "ظ": "z", "ز": "z",
  "ر": "r",
  "س": "s", "ص": "s",
  "ش": "c", "چ": "c",
  "ع": "3",
  "غ": "g",
  "ف": "f", "ڤ": "f",
  "ق": "k", "ك": "k", "ڨ": "k", "گ": "k", "ک": "k",
  "ل": "l", "م": "m", "ن": "n",
  "ا": "", "و": "", "ي": "", "ى": "", "ء": "", "ة": "", "ی": "",
  // Latin / arabizi
  b: "b", p: "b", t: "t", j: "j", h: "h", d: "d", z: "z", r: "r", s: "s",
  f: "f", v: "f", k: "k", q: "k", g: "k", c: "k", x: "ks", l: "l", m: "m", n: "n",
  a: "", e: "", i: "", o: "", u: "", w: "", y: "",
  "3": "3", "5": "x", "7": "h", "8": "g", "9": "k",
  "0": "", "1": "", "2": "", "4": "", "6": "",
};
