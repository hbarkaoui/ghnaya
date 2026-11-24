// Plan 5, tâche 5 : la base répond-elle, et toutes les migrations du code y sont-elles appliquées ?
import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { summarizeError } from "./errorSummary";
import journal from "../../../drizzle/meta/_journal.json";

export type Health =
  | { status: "ok" }
  | { status: "migrations_pending"; applied: number; expected: number }
  | { status: "db_unreachable" };

/** Migrations que ce code attend : les entrées du journal de drizzle-kit. */
export const EXPECTED_MIGRATIONS = journal.entries.length;

export async function checkHealth(db: Db, expected = EXPECTED_MIGRATIONS): Promise<Health> {
  let applied: number;
  try {
    const result = await db.execute<{ n: number }>(sql`select count(*)::int as n from drizzle.__drizzle_migrations`);
    applied = result.rows[0]?.n ?? 0;
  } catch (e) {
    // Ni message ni cause : ils peuvent contenir l'hôte ou l'utilisateur de la base.
    const { name, code, causeName } = summarizeError(e);
    console.error(JSON.stringify({ level: "error", event: "health_db_unreachable", name, code, causeName }));
    return { status: "db_unreachable" };
  }
  return applied >= expected ? { status: "ok" } : { status: "migrations_pending", applied, expected };
}
