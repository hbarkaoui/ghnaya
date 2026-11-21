import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { setUserRoles } from "@/lib/account/roles";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("setUserRoles", () => {
  beforeEach(resetDb);

  it("change seulement ce qui est demandé", async () => {
    await insertUser({ email: "sami@example.com", globalRole: "moderator" });
    expect(await setUserRoles(db, "sami@example.com", { isAnimator: true })).toEqual({
      email: "sami@example.com",
      globalRole: "moderator",
      isAnimator: true,
    });
    const [row] = await db.select().from(users).where(eq(users.email, "sami@example.com"));
    expect(row.globalRole).toBe("moderator");
  });

  it("renvoie null pour une adresse inconnue", async () => {
    expect(await setUserRoles(db, "personne@example.com", { isAnimator: true })).toBeNull();
  });
});
