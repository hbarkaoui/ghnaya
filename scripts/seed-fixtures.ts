// Plan 1, tâche 14 (étape 1) : vide la base locale et y écrit le catalogue fictif (tests de bout en bout,
// base de développement). Refusé hors de localhost : le script commence par tout effacer.
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "@/lib/db/client";
import { seedFixtures } from "../tests/fixtures/seed";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
    throw new Error("seed-fixtures vide la base : refusé hors de localhost.");
  }
  await db.execute(sql`TRUNCATE song_artists, songs, artists, rate_limits CASCADE`);
  const ids = await seedFixtures(db);
  console.log(`${ids.size} chansons de test insérées.`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
