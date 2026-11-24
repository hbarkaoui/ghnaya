// Plan 4, tâche 1 : horodatage du verrou de génération (spec §7, écart 3).
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";

describe("songs.translit_started_at", () => {
  it("est un horodatage avec fuseau, nullable, sans valeur par défaut", async () => {
    const res = await db.execute<{ data_type: string; is_nullable: string; column_default: string | null }>(sql`
      SELECT data_type, is_nullable, column_default FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'songs' AND column_name = 'translit_started_at'`);
    expect(res.rows).toEqual([{ data_type: "timestamp with time zone", is_nullable: "YES", column_default: null }]);
  });
});
