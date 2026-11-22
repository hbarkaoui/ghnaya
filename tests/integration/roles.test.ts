import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { clubsOfEmail, setUserRoles } from "@/lib/account/roles";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { insertClub, insertUser } from "./factories";
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

describe("clubsOfEmail", () => {
  beforeEach(resetDb);

  it("liste les clubs du compte dans l'ordre d'adhésion", async () => {
    const sami = await insertUser({ email: "sami@example.com", isAnimator: true });
    const other = await insertUser();
    await insertClub({ name: "Les Jasmins", slug: "jasmins", animatorIds: [sami.id] });
    await insertClub({ name: "Les Oliviers", slug: "oliviers", animatorIds: [other.id], memberIds: [sami.id] });
    await insertClub({ name: "Ailleurs", slug: "ailleurs", animatorIds: [other.id] });
    expect(await clubsOfEmail(db, "sami@example.com")).toEqual([
      { slug: "jasmins", name: "Les Jasmins" },
      { slug: "oliviers", name: "Les Oliviers" },
    ]);
    expect(await clubsOfEmail(db, "personne@example.com")).toEqual([]);
  });
});
