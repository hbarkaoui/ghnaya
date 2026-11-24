// Plan 5, tâche 5 : santé de la base et des migrations.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { checkHealth, EXPECTED_MIGRATIONS } from "@/lib/system/health";

const { GET } = await import("@/app/api/sante/route");

describe("checkHealth", () => {
  it("compte les migrations du journal", () => {
    expect(EXPECTED_MIGRATIONS).toBeGreaterThanOrEqual(6);
  });

  it("répond ok sur une base migrée", async () => {
    await expect(checkHealth(db)).resolves.toEqual({ status: "ok" });
  });

  it("signale une migration attendue et absente", async () => {
    await expect(checkHealth(db, EXPECTED_MIGRATIONS + 1)).resolves.toEqual({
      status: "migrations_pending",
      applied: EXPECTED_MIGRATIONS,
      expected: EXPECTED_MIGRATIONS + 1,
    });
  });

  it("journalise le code de la cause, sans message ni hôte", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const pool = new Pool({ connectionString: "postgres://secretuser:y@127.0.0.1:1/z", connectionTimeoutMillis: 1_000 });
    try {
      await checkHealth(drizzle(pool, { schema }));
      const line = String(spy.mock.calls[0]?.[0]);
      expect(JSON.parse(line)).toMatchObject({ event: "health_db_unreachable", code: "ECONNREFUSED" });
      expect(line).not.toContain("127.0.0.1");
      expect(line).not.toContain("secretuser");
    } finally {
      spy.mockRestore();
      await pool.end();
    }
  });

  it("signale une base injoignable, sans lever", async () => {
    const pool = new Pool({ connectionString: "postgres://x:y@127.0.0.1:1/z", connectionTimeoutMillis: 1_000 });
    try {
      await expect(checkHealth(drizzle(pool, { schema }))).resolves.toEqual({ status: "db_unreachable" });
    } finally {
      await pool.end();
    }
  });
});

describe("GET /api/sante", () => {
  it("répond 200, sans cache", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
