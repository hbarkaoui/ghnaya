/** Code d'invitation d'un club (spec §10) : 10 caractères, sans i, l, o, 0 ni 1, faciles à confondre. */
export const INVITE_CODE_LENGTH = 10;
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
// Plus grand multiple de la taille de l'alphabet sous 256 : au-delà, l'octet est rejeté (pas de biais).
const LIMIT = 256 - (256 % ALPHABET.length);

export function newInviteCode(): string {
  let code = "";
  while (code.length < INVITE_CODE_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH * 2))) {
      if (byte < LIMIT && code.length < INVITE_CODE_LENGTH) code += ALPHABET[byte % ALPHABET.length];
    }
  }
  return code;
}

const IN_LINK = new RegExp(`/rejoindre/([a-z0-9]{${INVITE_CODE_LENGTH}})(?![a-z0-9])`, "i");
const BARE = new RegExp(`^[a-z0-9]{${INVITE_CODE_LENGTH}}$`, "i");

/**
 * Code d'invitation lu dans ce que l'utilisateur a collé : le lien seul, le message qui le contient,
 * ou le code. `null` si rien ne ressemble à une invitation.
 */
export function parseInviteCode(input: string): string | null {
  const text = input.trim();
  const code = text.match(IN_LINK)?.[1] ?? (BARE.test(text) ? text : null);
  return code ? code.toLowerCase() : null;
}
