import { sql, type SQL } from "drizzle-orm";

/** `a, b, c` en paramètres SQL, pour `IN (...)`. L'appelant écarte la liste vide (`IN ()` est invalide). */
export const inList = (values: readonly string[]): SQL =>
  sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  );
