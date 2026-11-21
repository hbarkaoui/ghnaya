import { afterAll } from "vitest";
import { pool } from "@/lib/db/client";

afterAll(async () => {
  await pool.end();
});
