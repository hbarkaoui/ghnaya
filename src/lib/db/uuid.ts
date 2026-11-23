const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identifiant UUID bien formé : à tester avant de comparer une chaîne de l'adresse à une colonne `uuid`. */
export const isUuid = (value: string): boolean => UUID_RE.test(value);
