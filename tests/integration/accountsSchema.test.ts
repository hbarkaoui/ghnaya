import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { clubMembers, playlistItems, playlists, users } from "@/lib/db/schema";
import { insertClub, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("schéma des comptes, des clubs et des playlists", () => {
  beforeEach(resetDb);

  it("donne un UUID et les valeurs par défaut à un nouvel utilisateur", async () => {
    const { id } = await insertUser();
    const [row] = await db.select().from(users).where(eq(users.id, id));
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row).toMatchObject({ globalRole: "member", isAnimator: false, locale: "fr" });
  });

  it("refuse deux comptes avec la même adresse", async () => {
    await insertUser({ email: "leila@example.com" });
    await expect(insertUser({ email: "leila@example.com" })).rejects.toThrow();
  });

  it("exige qu'une playlist appartienne soit à un utilisateur, soit à un club", async () => {
    const user = await insertUser();
    const club = await insertClub({ name: "Les Jasmins", animatorIds: [user.id] });
    await expect(db.insert(playlists).values({ name: "Sans propriétaire" })).rejects.toThrow();
    await expect(
      db.insert(playlists).values({ name: "Les deux", ownerUserId: user.id, clubId: club.id }),
    ).rejects.toThrow();
    await db.insert(playlists).values({ name: "Personnelle", ownerUserId: user.id });
    await db.insert(playlists).values({ name: "De club", clubId: club.id });
  });

  it("refuse une chanson en double et deux chansons à la même position", async () => {
    const user = await insertUser();
    const [a, b] = [await insertSong("A"), await insertSong("B")];
    const [p] = await db.insert(playlists).values({ name: "P", ownerUserId: user.id }).returning();
    await db.insert(playlistItems).values({ playlistId: p.id, songId: a, position: 1 });
    await expect(db.insert(playlistItems).values({ playlistId: p.id, songId: a, position: 2 })).rejects.toThrow();
    await expect(db.insert(playlistItems).values({ playlistId: p.id, songId: b, position: 1 })).rejects.toThrow();
  });

  it("supprime les playlists personnelles et les adhésions d'un compte supprimé", async () => {
    const leila = await insertUser();
    const sami = await insertUser({ isAnimator: true });
    const club = await insertClub({ name: "Les Jasmins", animatorIds: [sami.id], memberIds: [leila.id] });
    await db.insert(playlists).values({ name: "Mes préférées", ownerUserId: leila.id });
    await db.insert(playlists).values({ name: "Séance", clubId: club.id, createdBy: leila.id });

    await db.delete(users).where(eq(users.id, leila.id));

    const left = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM playlists`);
    expect(Number(left.rows[0].n)).toBe(1); // la playlist du club reste, sans créateur
    expect(await db.select().from(clubMembers).where(eq(clubMembers.userId, leila.id))).toEqual([]);
  });

  it("supprime les adhésions et les playlists d'un club supprimé", async () => {
    const sami = await insertUser({ isAnimator: true });
    const club = await insertClub({ name: "Malouf Sfax", animatorIds: [sami.id] });
    await db.insert(playlists).values({ name: "Séance", clubId: club.id });
    await db.execute(sql`DELETE FROM clubs WHERE id = ${club.id}`);
    const left = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM playlists`);
    expect(Number(left.rows[0].n)).toBe(0);
  });
});
