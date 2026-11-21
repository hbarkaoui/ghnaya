// Plan 1, tâche 11 : `pnpm import:public-domain [--dry-run]`, sur tous les fichiers de data/public-domain.
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { db, pool } from "@/lib/db/client";
import { runPublicDomainImport } from "./runPublicDomainImport";

const DATA_DIR = "data/public-domain";

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { "dry-run": { type: "boolean", default: false } } });
  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => ({ path: path.join(DATA_DIR, f), content: readFileSync(path.join(DATA_DIR, f), "utf8") }));
  const report = await runPublicDomainImport({
    db,
    files,
    currentYear: new Date().getFullYear(),
    dryRun: values["dry-run"],
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.rejected.length > 0) process.exitCode = 1;
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
