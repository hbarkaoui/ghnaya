// Durées de conservation annoncées dans la politique de confidentialité (relecture juridique, 27/11/2026).
import { eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/client";
import { reports, sessions, users, verifications } from "@/lib/db/schema";
import type { MailMessage } from "@/lib/mail/transport";
import { GET } from "@/app/api/taches/conservation/route";
import { markUserActive, runRetention } from "@/lib/retention/retention";
import { insertClub, insertReport, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

const NOW = new Date("2030-06-15T03:00:00Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
const YEAR = 365;

function mailbox() {
  const sent: MailMessage[] = [];
  return { sent, send: async (message: MailMessage) => void sent.push(message) };
}

async function userRow(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row;
}

describe("durées de conservation", () => {
  beforeEach(resetDb);

  it("efface les sessions et les liens de connexion expirés, garde les autres", async () => {
    const leila = await insertUser();
    await db.insert(sessions).values([
      { userId: leila.id, token: "expiree", expiresAt: daysAgo(1) },
      { userId: leila.id, token: "valide", expiresAt: daysAgo(-3) },
    ]);
    await db.insert(verifications).values([
      { identifier: "ancien", value: "x", expiresAt: daysAgo(1) },
      { identifier: "recent", value: "y", expiresAt: daysAgo(-1) },
    ]);

    const result = await runRetention(db, { now: NOW, send: mailbox().send });

    expect(result).toMatchObject({ expiredSessions: 1, expiredVerifications: 1 });
    expect((await db.select().from(sessions)).map((s) => s.token)).toEqual(["valide"]);
    expect((await db.select().from(verifications)).map((v) => v.identifier)).toEqual(["recent"]);
  });

  it("efface l'adresse de contact d'un signalement clos depuis plus d'un an, pas avant", async () => {
    const songId = await insertSong("Chanson");
    const old = await insertReport({ songId, contactEmail: "ancien@example.com" });
    const recent = await insertReport({ songId, contactEmail: "recent@example.com" });
    const open = await insertReport({ songId, contactEmail: "ouvert@example.com", createdAt: daysAgo(2 * YEAR) });
    const close = (id: string, at: Date) =>
      db.execute(sql`UPDATE reports SET status = 'dismissed', resolution_note = 'Sans suite.', updated_at = ${at}
        WHERE id = ${id}`);
    await close(old, daysAgo(YEAR + 1));
    await close(recent, daysAgo(YEAR - 1));

    const result = await runRetention(db, { now: NOW, send: mailbox().send });

    expect(result.reportContacts).toBe(1);
    const emails = Object.fromEntries(
      (await db.select().from(reports)).map((r) => [r.id, r.contactEmail]),
    );
    expect(emails).toEqual({ [old]: null, [recent]: "recent@example.com", [open]: "ouvert@example.com" });
  });

  it("prévient un mois avant de supprimer un compte inactif, une seule fois, dans sa langue", async () => {
    const soon = await insertUser({ locale: "ar", lastActiveAt: daysAgo(3 * YEAR - 29) });
    const active = await insertUser({ lastActiveAt: daysAgo(3 * YEAR - 31) });
    const box = mailbox();

    const first = await runRetention(db, { now: NOW, send: box.send });
    const second = await runRetention(db, { now: NOW, send: box.send });

    expect(first.inactivityNotices).toBe(1);
    expect(second.inactivityNotices).toBe(0);
    expect(box.sent.map((m) => m.to)).toEqual([soon.email]);
    expect(box.sent[0].html).toContain('dir="rtl"');
    expect(box.sent[0].link).toMatch(/\/connexion$/);
    expect((await userRow(soon.id)).inactivityNoticeAt).toEqual(NOW);
    expect((await userRow(active.id)).inactivityNoticeAt).toBeNull();
  });

  it("supprime un compte inactif depuis 3 ans, au moins un mois après l'avertissement", async () => {
    const warned = await insertUser({ lastActiveAt: daysAgo(3 * YEAR + 1), inactivityNoticeAt: daysAgo(31) });
    const lateNotice = await insertUser({ lastActiveAt: daysAgo(4 * YEAR), inactivityNoticeAt: daysAgo(10) });
    const neverWarned = await insertUser({ lastActiveAt: daysAgo(4 * YEAR) });
    const box = mailbox();

    const result = await runRetention(db, { now: NOW, send: box.send });

    expect(result.deletedAccounts).toBe(1);
    expect(await userRow(warned.id)).toBeUndefined();
    expect(await userRow(lateNotice.id)).toBeDefined();
    // Jamais prévenu (compte devenu inactif avant la mise en place) : il l'est maintenant, pas supprimé.
    expect(await userRow(neverWarned.id)).toBeDefined();
    expect(box.sent.map((m) => m.to)).toEqual([neverWarned.email]);
  });

  it("garde le seul animateur d'un club, même inactif, et le compte", async () => {
    const sami = await insertUser({ isAnimator: true, lastActiveAt: daysAgo(4 * YEAR), inactivityNoticeAt: daysAgo(60) });
    await insertClub({ name: "Les Jasmins", animatorIds: [sami.id] });

    const result = await runRetention(db, { now: NOW, send: mailbox().send });

    expect(result).toMatchObject({ deletedAccounts: 0, keptLastAnimators: 1 });
    expect(await userRow(sami.id)).toBeDefined();
  });

  it("une connexion remet le compte à zéro : date d'activité et avertissement", async () => {
    const leila = await insertUser({ lastActiveAt: daysAgo(3 * YEAR), inactivityNoticeAt: daysAgo(5) });

    await markUserActive(db, leila.id, NOW);

    expect(await userRow(leila.id)).toMatchObject({ lastActiveAt: NOW, inactivityNoticeAt: null });
  });
});

describe("GET /api/taches/conservation", () => {
  beforeEach(resetDb);
  afterEach(() => vi.unstubAllEnvs());

  const call = (authorization?: string) =>
    GET(new Request("http://localhost/api/taches/conservation", { headers: authorization ? { authorization } : {} }));

  it("ne tourne pas sans CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer ")).status).toBe(503);
  });

  it("refuse un appel sans le secret, tourne avec", async () => {
    const secret = "c".repeat(40);
    vi.stubEnv("CRON_SECRET", secret);
    const leila = await insertUser();
    await db.insert(sessions).values({ userId: leila.id, token: "expiree", expiresAt: new Date(Date.now() - 1000) });

    expect((await call()).status).toBe(401);
    expect(await db.select().from(sessions)).toHaveLength(1);

    const response = await call(`Bearer ${secret}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok", expiredSessions: 1 });
    expect(await db.select().from(sessions)).toHaveLength(0);
  });
});
