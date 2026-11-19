import { CHAR_MAP, LATIN_DIGRAPHS } from "./searchKeyMap";

// Plan 1, tâche 3 : squelette de consonnes commun à l'arabe et à l'arabizi.
// Limite connue : « th » latin vaut ت/ث, alors que « Fethi » s'écrit فتحي (ت + ح).
// Ces cas sont rattrapés par la similarité trigramme (spec §6.1).
export function toSearchKey(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ـ/g, "")
    .toLowerCase();
  let out = "";
  for (let i = 0; i < s.length; ) {
    const digraph = LATIN_DIGRAPHS[s.slice(i, i + 2)];
    if (digraph !== undefined) {
      out += digraph;
      i += 2;
      continue;
    }
    const mapped = CHAR_MAP[s[i]];
    if (mapped !== undefined) out += mapped;
    i += 1;
  }
  return out.replace(/(.)\1+/g, "$1");
}
