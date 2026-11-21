// Migre la base de test une fois avant les tests d'intégration.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export default async function setup(): Promise<void> {
  const url = process.env.DATABASE_URL_TEST ?? "postgres://ghanni:ghanni@localhost:5433/ghanni_test";
  const pool = new Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
  await pool.end();
}
