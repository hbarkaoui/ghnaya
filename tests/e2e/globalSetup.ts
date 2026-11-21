import { execSync } from "node:child_process";

/** Migre la base de test, la vide et y écrit le catalogue fictif (refusé hors de localhost). */
export default function globalSetup(): void {
  const DATABASE_URL = process.env.DATABASE_URL_TEST ?? "postgres://ghanni:ghanni@localhost:5433/ghanni_test";
  execSync("pnpm db:migrate && pnpm seed:fixtures", { stdio: "inherit", env: { ...process.env, DATABASE_URL } });
}
