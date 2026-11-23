// Plan 3, tâche 8 : retrait en masse des chansons d'une source (spec §9), lancé par un admin avec l'accès à la base.
import "dotenv/config";
import { db, pool } from "@/lib/db/client";
import { parseBulkArgs, runBulk } from "@/lib/moderation/bulk";

async function main(): Promise<void> {
  const parsed = parseBulkArgs(process.argv.slice(2));
  if (!parsed.ok) throw new Error(parsed.error);
  const { args } = parsed;
  const count = await runBulk(db, args);
  const done = args.restore ? (args.dryRun ? "seraient rétablies" : "rétablies") : args.dryRun ? "seraient retirées" : "retirées";
  console.log(`${count} chanson(s) ${done} (source ${args.source}${args.artistId ? `, artiste ${args.artistId}` : ""}).`);
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
