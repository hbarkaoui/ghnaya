/**
 * Erreur lue dans `?error=` de /connexion. Better Auth AJOUTE son propre `error` à l'adresse d'erreur : le
 * paramètre peut donc arriver en double (`error=google&error=access_denied`), donc en tableau.
 */
export function signInErrorKey(error: string | string[] | undefined): "linkInvalid" | "google" | null {
  const values = (Array.isArray(error) ? error : [error]).filter((v): v is string => typeof v === "string" && v !== "");
  if (values.length === 0) return null;
  return values.includes("INVALID_TOKEN") ? "linkInvalid" : "google";
}
