// Plan 1, tâche 5 : pool PostgreSQL et instance Drizzle, partagés par l'app, les scripts et les tests.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// En développement, le rechargement à chaud réévalue ce module : on garde le même pool.
const globalForDb = globalThis as unknown as { ghanniPool?: Pool };

export const pool = globalForDb.ghanniPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.ghanniPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
