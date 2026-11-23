// Plan 3, tâche 7 : les actions « Signaler », « Traiter un signalement » et « Rétablir » (spec §9, §12).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { reports, songs, users } from "@/lib/db/schema";
import { REPORT_LIMIT } from "@/lib/moderation/limits";
import { seedFixtures } from "../fixtures/seed";
import { insertReport, insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  RedirectType: { push: "push", replace: "replace" },
}));
// Les messages sont rendus sous la forme de leur clé : le test lit le code d'erreur.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => Object.assign((key: string) => key, { markup: (key: string) => key }),
  getLocale: async () => "fr",
}));

const { submitReport } = await import("@/app/actions/report");
const { handleReport, restoreSongAction } = await import("@/app/actions/moderation");

const EDITING = { status: "editing" as const, errors: {}, attempt: 0 };
const NOTE_STATE = { error: null, attempt: 0 };

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const report = (over: Record<string, string> = {}) =>
  form({ reason: "wrong_lyrics", details: "Deux vers sont inversés.", email: "visiteur@example.com", ...over });

/** Soit la valeur renvoyée, soit l'adresse de la redirection, soit « introuvable ». */
async function run<T>(call: () => Promise<T>): Promise<{ value: T } | { redirect: string } | { notFound: true }> {
  try {
    return { value: await call() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND") return { notFound: true };
    const match = /^REDIRECT (.+)$/.exec(message);
    if (!match) throw error;
    return { redirect: match[1] };
  }
}

async function signIn(userId: string | null): Promise<void> {
  if (!userId) {
    session.user = null;
    return;
  }
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

const allReports = () => db.select().from(reports).orderBy(reports.createdAt);
const songStatus = async (id: string) => (await db.select().from(songs).where(eq(songs.id, id)))[0].status;

describe("signaler une chanson", () => {
  let ids = new Map<string, string>();
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    await signIn(null);
  });

  it("un visiteur laisse son adresse ; un membre signale avec son compte, sans adresse", async () => {
    const song = ids.get("s-ya-lili")!;
    expect(await run(() => submitReport(song, EDITING, report({ email: "" })))).toMatchObject({
      value: { status: "editing", errors: { email: "emailMissing" } },
    });
    expect(await run(() => submitReport(song, EDITING, report()))).toEqual({
      value: { status: "sent", sentTo: "visiteur@example.com" },
    });
    await signIn((await insertUser()).id);
    expect(await run(() => submitReport(song, EDITING, report({ email: "ignoree@example.com" })))).toEqual({
      value: { status: "sent", sentTo: null },
    });
    const rows = await allReports();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => [r.contactEmail, r.reporterId === null])).toEqual([
      ["visiteur@example.com", true],
      [null, false],
    ]);
  });

  it("refuse une chanson retirée ou inconnue", async () => {
    const removed = ids.get("s-habaytak")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    for (const song of [removed, "s-sidi-mansour"]) {
      expect(await run(() => submitReport(song, EDITING, report()))).toMatchObject({
        value: { errors: { form: "songMissing" } },
      });
    }
    expect(await allReports()).toHaveLength(0);
  });

  it(`refuse le ${REPORT_LIMIT.limit + 1}e signalement du jour depuis la même adresse IP (spec §12)`, async () => {
    const song = ids.get("s-ya-lili")!;
    for (let i = 0; i < REPORT_LIMIT.limit; i += 1) {
      expect(await run(() => submitReport(song, EDITING, report()))).toMatchObject({ value: { status: "sent" } });
    }
    expect(await run(() => submitReport(song, EDITING, report()))).toMatchObject({
      value: { status: "editing", errors: { form: "tooMany" } },
    });
    expect(await allReports()).toHaveLength(REPORT_LIMIT.limit);
  });
});

describe("traiter un signalement", () => {
  let ids = new Map<string, string>();
  let rania: { id: string };
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
    await signIn(rania.id);
  });

  const handle = (id: string, action: string, note = "Retrait demandé par les ayants droit.") =>
    run(() => handleReport(id, NOTE_STATE, form({ action, note })));

  it("réserve le traitement aux modérateurs", async () => {
    const id = await insertReport({ songId: ids.get("s-ya-lili")! });
    await signIn(null);
    expect(await handle(id, "remove")).toMatchObject({ redirect: expect.stringMatching(/^\/connexion/) });
    await signIn((await insertUser()).id);
    expect(await handle(id, "remove")).toEqual({ notFound: true });
    expect(await songStatus(ids.get("s-ya-lili")!)).toBe("published");
  });

  it("retirer la chanson : retrait doux, puis le signalement suivant ou la file vide", async () => {
    const first = await insertReport({ songId: ids.get("s-ya-lili")!, reason: "copyright", createdAt: new Date("2026-11-10T10:00:00Z") });
    const second = await insertReport({ songId: ids.get("s-habaytak")!, createdAt: new Date("2026-11-11T10:00:00Z") });
    expect(await handle(first, "remove")).toEqual({ redirect: `/moderation/signalements/${second}?statut=removed` });
    expect(await songStatus(ids.get("s-ya-lili")!)).toBe("removed");
    expect(await handle(second, "dismiss", "Sans suite.")).toEqual({ redirect: "/moderation/signalements?statut=dismissed" });
    expect(await songStatus(ids.get("s-habaytak")!)).toBe("published");
  });

  it("exige une note, et refuse un signalement déjà traité", async () => {
    const id = await insertReport({ songId: ids.get("s-ya-lili")! });
    expect(await handle(id, "remove", "  ")).toEqual({ value: { error: "noteRequired", attempt: 1 } });
    await handle(id, "dismiss", "Sans suite.");
    expect(await handle(id, "remove")).toEqual({ value: { error: "notOpen", attempt: 1 } });
  });

  it("corriger ouvre le formulaire de correction de la chanson", async () => {
    const song = ids.get("s-ya-lella")!;
    const id = await insertReport({ songId: song });
    expect(await handle(id, "correct", "Je propose la correction.")).toEqual({ redirect: `/contribuer/${song}` });
    expect(await songStatus(song)).toBe("published");
  });

  it("rétablir une chanson retirée, par son signalement, et par un modérateur seulement", async () => {
    const song = ids.get("s-ala-nar")!;
    const id = await insertReport({ songId: song, reason: "copyright" });
    await handle(id, "remove");
    await signIn((await insertUser()).id);
    expect(await run(() => restoreSongAction(id))).toEqual({ notFound: true });
    expect(await songStatus(song)).toBe("removed");
    await signIn(rania.id);
    expect(await run(() => restoreSongAction(id))).toEqual({ redirect: `/moderation/signalements/${id}?statut=restored` });
    expect(await songStatus(song)).toBe("published");
  });
});
