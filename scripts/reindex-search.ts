// Plan 1, tâche 15 : `pnpm reindex:search`. Voir « Benchmark de la recherche » du README.
import "dotenv/config";
import { db, pool } from "@/lib/db/client";
import { reindexSearch } from "./reindexSearch";

reindexSearch(db, (line) => console.log(line))
  .then((report) => console.log(JSON.stringify(report, null, 2)))
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
