// Plan 3, tâche 4 : GET /api/artistes est réservé aux membres à l'adresse vérifiée, et limité.
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { seedFixtures } from "../fixtures/seed";
import { insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));

const { GET } = await import("@/app/api/artistes/route");

const ask = (q: string) => GET(new Request(`http://localhost/api/artistes?q=${encodeURIComponent(q)}`));

async function signIn(userId: string): Promise<void> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

describe("GET /api/artistes", () => {
  beforeEach(async () => {
    await resetDb();
    await seedFixtures(db);
    session.user = null;
  });

  it("refuse un visiteur et une adresse non vérifiée", async () => {
    expect((await ask("sab")).status).toBe(401);
    await signIn((await insertUser({ emailVerified: false })).id);
    expect((await ask("sab")).status).toBe(401);
  });

  it("propose les artistes connus à un membre, sans mise en cache", async () => {
    await signIn((await insertUser()).id);
    const res = await ask("sab");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = (await res.json()) as { artists: { nameLatin: string | null }[] };
    expect(body.artists[0].nameLatin).toBe("Saber Rebai");
  });

  it("répond 429 au-delà de 120 requêtes par minute", async () => {
    await signIn((await insertUser()).id);
    for (let i = 0; i < 120; i += 1) expect((await ask("sab")).status).toBe(200);
    expect((await ask("sab")).status).toBe(429);
  });
});
