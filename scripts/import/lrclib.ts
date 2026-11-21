// Plan 1, tâche 10 : `pnpm import:lrclib --dump <fichier.sqlite3> [--dry-run]`. Voir « Import LRCLIB » du README.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { db, pool } from "@/lib/db/client";
import { buildAliasIndex } from "./artistAliases";
import { readLrclibTracks } from "./lrclibReader";
import { runLrclibImport } from "./runLrclibImport";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      dump: { type: "string" },
      aliases: { type: "string", default: "scripts/import/artist-aliases.yaml" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  if (!values.dump) throw new Error("Usage : pnpm import:lrclib --dump <fichier.sqlite3> [--dry-run]");
  const report = await runLrclibImport({
    db,
    tracks: readLrclibTracks(values.dump),
    aliases: buildAliasIndex(readFileSync(values.aliases, "utf8")),
    dryRun: values["dry-run"],
    log: (line) => console.log(line),
  });
  console.log(JSON.stringify({ ...report, estimatedMB: Math.round(report.estimatedBytes / 1e6) }, null, 2));
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
