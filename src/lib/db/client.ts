// Plan 1, tâche 5 : pool PostgreSQL et instance Drizzle, partagés par l'app, les scripts et les tests.
// Plan 5, tâche 3 : sur Vercel, le pool est attaché au cycle de vie des fonctions (Fluid Compute) : les
// connexions inactives sont fermées avant la suspension d'une instance, au lieu d'être perdues ouvertes.
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// En développement, le rechargement à chaud réévalue ce module : on garde le même pool.
const globalForDb = globalThis as unknown as { ghanniPool?: Pool };

export const pool =
  globalForDb.ghanniPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 5_000, connectionTimeoutMillis: 10_000 });
if (process.env.NODE_ENV !== "production") globalForDb.ghanniPool = pool;
if (process.env.VERCEL) attachDatabasePool(pool);

export const db = drizzle(pool, { schema });
export type Db = typeof db;

/** Transaction ouverte par `db.transaction`. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
/** La base, ou une transaction en cours : pour les écritures qui servent seules ou dans une transaction. */
export type Executor = Db | Tx;
