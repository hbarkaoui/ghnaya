import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { clubsOf, getClubByInvite, joinMembershipsOf, membersOf, memberCountOf, soleAnimatorClubs } from "@/lib/clubs/queries";
import { createClub, deleteClub, joinClub, promoteMember, regenerateInvite, renameClub } from "@/lib/clubs/write";
import { db } from "@/lib/db/client";
import { clubMembers } from "@/lib/db/schema";
import { insertClub, insertUser } from "./factories";
import { resetDb } from "./helpers";

const member = async (name: string) => {
  const u = await insertUser({ name });
  return { id: u.id, isAnimator: false };
};
const animator = async (name: string) => {
  const u = await insertUser({ name, isAnimator: true });
  return { id: u.id, isAnimator: true };
};

describe("création et réglages d'un club", () => {
  beforeEach(resetDb);

  it("crée le club, son slug, un code de 10 caractères, et en fait animer son créateur", async () => {
    const sami = await animator("Sami");
    const club = await createClub(db, "Les Jasmins", sami.id);
    expect(club.slug).toBe("les-jasmins");
    expect(club.inviteCode).toMatch(/^[a-z2-9]{10}$/);
    expect(await clubsOf(sami.id)).toEqual([{ ...club, memberCount: 1, role: "animator" }]);
  });

  it("donne un slug distinct à deux clubs du même nom", async () => {
    const sami = await animator("Sami");
    await createClub(db, "Les Jasmins", sami.id);
    expect((await createClub(db, "Les Jasmins", sami.id)).slug).toBe("les-jasmins-2");
    expect((await createClub(db, "Les  Jasmins", sami.id)).slug).toBe("les-jasmins-3");
  });

  it("ne donne jamais un slug réservé", async () => {
    const sami = await animator("Sami");
    expect((await createClub(db, "Nouveau", sami.id)).slug).toBe("nouveau-2");
  });

  it("renomme sans changer le slug, et invalide l'ancien lien d'invitation", async () => {
    const sami = await animator("Sami");
    const club = await createClub(db, "Les Jasmins", sami.id);
    await renameClub(db, club.id, "Jasmins de Tunis");
    const code = await regenerateInvite(db, club.id);
    expect(code).not.toBe(club.inviteCode);
    expect(await getClubByInvite(club.inviteCode)).toBeNull();
    expect(await getClubByInvite(code.toUpperCase())).toMatchObject({ slug: "les-jasmins", name: "Jasmins de Tunis" });
  });

  it("supprime le club et ses adhésions", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    const club = await insertClub({ name: "Les Jasmins", animatorIds: [sami.id], memberIds: [leila.id] });
    await deleteClub(db, club.id);
    expect(await db.select().from(clubMembers)).toEqual([]);
  });
});

describe("membres", () => {
  beforeEach(resetDb);

  it("liste les animateurs d'abord, puis par ordre alphabétique", async () => {
    const sami = await animator("Sami");
    const [b, a] = [await member("Bilel"), await member("Amira")];
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [b.id, a.id] });
    expect((await membersOf(club.id, "fr")).map((m) => m.name)).toEqual(["Sami", "Amira", "Bilel"]);
    expect(await memberCountOf(club.id)).toBe(3);
  });

  it("promeut un membre, et refuse de promouvoir un inconnu", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [leila.id] });
    expect(await promoteMember(db, club.id, leila.id)).toBe(true);
    expect(await promoteMember(db, club.id, leila.id)).toBe(false); // déjà animatrice
    expect(await promoteMember(db, club.id, (await member("X")).id)).toBe(false);
    expect((await membersOf(club.id, "fr")).find((m) => m.id === leila.id)?.role).toBe("animator");
  });

  it("repère les clubs dont on est le seul animateur", async () => {
    const sami = await animator("Sami");
    const rim = await animator("Rim");
    await insertClub({ name: "Seul", slug: "seul", animatorIds: [sami.id] });
    await insertClub({ name: "À deux", slug: "a-deux", animatorIds: [sami.id, rim.id] });
    expect(await soleAnimatorClubs(sami.id)).toEqual([{ slug: "seul", name: "Seul" }]);
  });
});

describe("rejoindre un club (règle des clubs)", () => {
  beforeEach(resetDb);

  it("un membre sans club rejoint", async () => {
    const sami = await animator("Sami");
    const nour = await member("Nour");
    const club = await insertClub({ name: "Jasmins", animatorIds: [sami.id] });
    expect(await joinClub(db, nour, club.inviteCode, false)).toMatchObject({ ok: true, left: [] });
    expect((await clubsOf(nour.id)).map((c) => c.role)).toEqual(["member"]);
  });

  it("un code inconnu est refusé, et un membre ne rejoint pas deux fois", async () => {
    const sami = await animator("Sami");
    const club = await insertClub({ name: "Jasmins", animatorIds: [sami.id] });
    expect(await joinClub(db, await member("Nour"), "inconnu123", false)).toEqual({ ok: false, reason: "invalid" });
    expect(await joinClub(db, sami, club.inviteCode, false)).toEqual({ ok: false, reason: "already-member" });
  });

  it("un membre d'un autre club doit confirmer, puis quitte le premier", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    const a = await insertClub({ name: "A", slug: "a", animatorIds: [sami.id], memberIds: [leila.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [sami.id] });
    expect(await joinClub(db, leila, b.inviteCode, false)).toEqual({ ok: false, reason: "needs-confirm" });
    expect(await joinClub(db, leila, b.inviteCode, true)).toMatchObject({ ok: true, left: ["a"] });
    expect((await clubsOf(leila.id)).map((c) => c.slug)).toEqual(["b"]);
    expect(await memberCountOf(a.id)).toBe(1);
  });

  it("le dernier animateur d'un club ne peut pas le quitter", async () => {
    const leila = await member("Leïla");
    const a = await insertClub({ name: "A", slug: "a", animatorIds: [leila.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [(await animator("Sami")).id] });
    expect(await joinClub(db, leila, b.inviteCode, true)).toEqual({ ok: false, reason: "last-animator", club: "a" });
    expect(await memberCountOf(a.id)).toBe(1);
  });

  it("un animateur rejoint un club en plus des siens", async () => {
    const sami = await animator("Sami");
    const rim = await animator("Rim");
    await insertClub({ name: "A", slug: "a", animatorIds: [sami.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [rim.id] });
    expect(await joinClub(db, sami, b.inviteCode, false)).toMatchObject({ ok: true, left: [] });
    expect((await clubsOf(sami.id)).map((c) => c.slug)).toEqual(["a", "b"]);
  });

  it("deux animateurs du même club qui partent en même temps : un seul part", async () => {
    const [x, y] = [await member("X"), await member("Y")];
    const a = await insertClub({ name: "A", slug: "a", animatorIds: [x.id, y.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [(await animator("Sami")).id] });
    const results = await Promise.all([joinClub(db, x, b.inviteCode, true), joinClub(db, y, b.inviteCode, true)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const left = await db.execute<{ n: string }>(
      sql`SELECT count(*) AS n FROM club_members WHERE club_id = ${a.id} AND role = 'animator'`,
    );
    expect(Number(left.rows[0].n)).toBe(1);
  });

  it("donne de quoi décider : ses adhésions et les animateurs de ses clubs", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    await insertClub({ name: "A", slug: "a", animatorIds: [sami.id], memberIds: [leila.id] });
    expect(await joinMembershipsOf(leila.id)).toEqual(
      expect.arrayContaining([
        { clubSlug: "a", userId: leila.id, role: "member" },
        { clubSlug: "a", userId: sami.id, role: "animator" },
      ]),
    );
    expect(await db.select().from(clubMembers).where(eq(clubMembers.userId, leila.id))).toHaveLength(1);
  });
});
