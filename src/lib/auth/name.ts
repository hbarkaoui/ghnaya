/** Nom d'un compte (affiché dans les clubs) : 60 caractères au plus, espaces nettoyés. */
export const USER_NAME_MAX = 60;

const clean = (raw: string) => raw.normalize("NFC").replace(/\s+/g, " ").trim();

/** Nom par défaut d'un compte créé par lien magique : la partie avant @ (écart 3 du plan 2). */
export function defaultNameFromEmail(email: string): string {
  const [local, domain] = email.split("@");
  const name = clean(local?.split("+")[0] ?? "") || clean(domain ?? "");
  return name.slice(0, USER_NAME_MAX) || "Membre";
}

export type UserNameCheck = { ok: true; name: string } | { ok: false; error: "required" | "tooLong" };

export function normalizeUserName(raw: unknown): UserNameCheck {
  const name = typeof raw === "string" ? clean(raw) : "";
  if (!name) return { ok: false, error: "required" };
  if ([...name].length > USER_NAME_MAX) return { ok: false, error: "tooLong" };
  return { ok: true, name };
}
