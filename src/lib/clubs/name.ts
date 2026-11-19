export const CLUB_NAME_MAX = 60;

const clean = (raw: string) => raw.normalize("NFC").replace(/\s+/g, " ").trim();

export type ClubNameCheck = { ok: true; name: string } | { ok: false; error: "required" | "tooLong" };

/** Nom d'un club à la création ou au renommage : espaces nettoyés, obligatoire, 60 caractères au plus. */
export function validateClubName(raw: string): ClubNameCheck {
  const name = clean(raw);
  if (!name) return { ok: false, error: "required" };
  if (name.length > CLUB_NAME_MAX) return { ok: false, error: "tooLong" };
  return { ok: true, name };
}

/** Suppression d'un club : le nom retapé doit être celui du club (majuscules et espaces autour ignorés). */
export function confirmsClubName(typed: string, name: string): boolean {
  const value = clean(typed);
  return value.length > 0 && value.toLocaleLowerCase() === clean(name).toLocaleLowerCase();
}
