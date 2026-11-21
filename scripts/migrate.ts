import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/lib/db/client";

async function main(): Promise<void> {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations appliquées.");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
