/**
 * Violation d'une contrainte d'unicité (code PostgreSQL 23505). Drizzle enveloppe l'erreur du pilote :
 * le code est alors dans `cause`.
 */
export function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown) =>
    typeof value === "object" && value !== null && "code" in value ? (value as { code: unknown }).code : undefined;
  if (code(error) === "23505") return true;
  const cause = typeof error === "object" && error !== null && "cause" in error ? (error as { cause: unknown }).cause : undefined;
  return code(cause) === "23505";
}
