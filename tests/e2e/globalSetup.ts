import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

/** Migre la base de test, la vide, y écrit le catalogue fictif et les comptes de démonstration (refusé hors de localhost). */
export default function globalSetup(): void {
  const DATABASE_URL = process.env.DATABASE_URL_TEST ?? "postgres://ghanni:ghanni@localhost:5433/ghanni_test";
  rmSync(".outbox-e2e", { recursive: true, force: true });
  execSync("pnpm db:migrate && pnpm seed:fixtures && pnpm seed:demo", { stdio: "inherit", env: { ...process.env, DATABASE_URL } });
}
