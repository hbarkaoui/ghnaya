import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteUserAccount, setUserLocale, updateUserName } from "@/lib/account/write";
import { db } from "@/lib/db/client";
import { playlists, sessions, users } from "@/lib/db/schema";
import { insertClub, insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("compte", () => {
  beforeEach(resetDb);

  it("change le nom et la langue", async () => {
    const leila = await insertUser({ name: "leila" });
    await updateUserName(db, leila.id, "Leïla Ben Salah");
    await setUserLocale(db, leila.id, "ar");
    const [row] = await db.select().from(users).where(eq(users.id, leila.id));
    expect(row).toMatchObject({ name: "Leïla Ben Salah", locale: "ar" });
  });

  it("refuse la suppression du seul animateur d'un club", async () => {
    const sami = await insertUser({ isAnimator: true });
    await insertClub({ name: "Les Jasmins", slug: "les-jasmins", animatorIds: [sami.id] });
    expect(await deleteUserAccount(db, sami.id)).toEqual({
      ok: false,
      reason: "last-animator",
      clubs: [{ slug: "les-jasmins", name: "Les Jasmins" }],
    });
    expect(await db.select().from(users).where(eq(users.id, sami.id))).toHaveLength(1);
  });

  it("supprime le compte, ses sessions, ses playlists et ses adhésions ; les playlists du club restent", async () => {
    const sami = await insertUser({ isAnimator: true });
    const leila = await insertUser();
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [leila.id] });
    await db.insert(playlists).values({ name: "Mes préférées", ownerUserId: leila.id });
    await db.insert(playlists).values({ name: "Séance", clubId: club.id, createdBy: leila.id });
    await db.insert(sessions).values({ userId: leila.id, token: "t", expiresAt: new Date(Date.now() + 3600_000) });

    expect(await deleteUserAccount(db, leila.id)).toEqual({ ok: true });

    const count = async (table: string) =>
      Number((await db.execute<{ n: string }>(sql.raw(`SELECT count(*) AS n FROM ${table}`))).rows[0].n);
    expect(await count("users")).toBe(1);
    expect(await count("sessions")).toBe(0);
    expect(await count("club_members")).toBe(1);
    const left = await db.select().from(playlists);
    expect(left.map((p) => [p.name, p.createdBy])).toEqual([["Séance", null]]);
  });

  it("un animateur qui n'est pas le seul de son club peut supprimer son compte", async () => {
    const [sami, rim] = [await insertUser({ isAnimator: true }), await insertUser({ isAnimator: true })];
    await insertClub({ name: "C", animatorIds: [sami.id, rim.id] });
    expect(await deleteUserAccount(db, sami.id)).toEqual({ ok: true });
  });
});
