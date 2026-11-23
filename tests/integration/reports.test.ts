// Plan 3, tâche 7 : signalements, retrait doux et rétablissement (spec §9 ; §13, retrait doux).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteUserAccount } from "@/lib/account/write";
import { getSongById } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { getReport, openReports, treatedReports } from "@/lib/moderation/queries";
import { createReport, resolveReport, restoreSong } from "@/lib/moderation/reportWrite";
import { searchSongs } from "@/lib/search/searchSongs";
import { seedFixtures } from "../fixtures/seed";
import { insertReport, insertUser } from "./factories";
import { resetDb } from "./helpers";

const UNKNOWN = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";
const at = (iso: string) => new Date(iso);
const statusOf = async (songId: string) => (await db.select().from(songs).where(eq(songs.id, songId)))[0];

describe("signalements en base", () => {
  let ids = new Map<string, string>();
  let rania: { id: string };

  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
  });

  it("enregistre le signalement d'un visiteur (avec son adresse) et celui d'un membre", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = ids.get("s-ya-lili")!;
    const visitor = await createReport(db, {
      songId: song,
      reporterId: null,
      contactEmail: "droits@exemple-editions.com",
      reason: "copyright",
      details: "Nous représentons les ayants droit.",
    });
    const member = await createReport(db, {
      songId: song,
      reporterId: leila.id,
      contactEmail: null,
      reason: "wrong_lyrics",
      details: "Deux vers sont inversés.",
    });
    expect(await getReport(visitor)).toMatchObject({
      reporterId: null,
      reporterName: null,
      contactEmail: "droits@exemple-editions.com",
      reason: "copyright",
      status: "open",
      resolutionNote: null,
      song: { id: song, titleLatin: "Ya Lili", published: true, artists: [{ nameLatin: "Balti" }] },
    });
    expect(await getReport(member)).toMatchObject({ reporterId: leila.id, reporterName: "Leïla", contactEmail: null });
    expect(await getReport("pas-un-uuid")).toBeNull();
    expect(await getReport(UNKNOWN)).toBeNull();
  });

  it("file des signalements : droits d'auteur en tête, puis du plus ancien au plus récent (spec §9)", async () => {
    const song = ids.get("s-ya-lili")!;
    const oldSpam = await insertReport({ songId: song, reason: "spam", createdAt: at("2026-11-10T10:00:00Z") });
    const lateCopyright = await insertReport({ songId: song, reason: "copyright", createdAt: at("2026-11-18T10:00:00Z") });
    const wrong = await insertReport({ songId: song, reason: "wrong_lyrics", createdAt: at("2026-11-16T10:00:00Z") });
    const earlyCopyright = await insertReport({ songId: song, reason: "copyright", createdAt: at("2026-11-17T10:00:00Z") });
    expect((await openReports()).map((r) => r.id)).toEqual([earlyCopyright, lateCopyright, oldSpam, wrong]);
  });

  it("retirer la chanson : retrait doux, motif, protégée des imports ; plus cherchable ni lisible", async () => {
    const song = ids.get("s-sidi-mansour")!;
    const report = await insertReport({ songId: song, reason: "copyright" });
    expect(await resolveReport(db, { reportId: report, resolverId: rania.id, action: "remove", note: "Demande des ayants droit." })).toEqual({ ok: true });

    expect(await statusOf(song)).toMatchObject({ status: "removed", removedReason: "Demande des ayants droit.", importLocked: true });
    expect(await getSongById(song)).toBeNull();
    expect((await searchSongs("sidi mansour")).items.map((i) => i.id)).not.toContain(song);
    expect(await getReport(report)).toMatchObject({
      status: "resolved",
      resolutionNote: "Demande des ayants droit.",
      resolvedByName: "Rania",
      song: { id: song, published: false },
    });
    expect(await openReports()).toEqual([]);
    expect((await treatedReports()).map((r) => r.id)).toEqual([report]);
  });

  it("corriger ou classer sans suite ne retire rien", async () => {
    const song = ids.get("s-ya-lella")!;
    const toCorrect = await insertReport({ songId: song });
    const toDismiss = await insertReport({ songId: song, reason: "spam" });
    expect(await resolveReport(db, { reportId: toCorrect, resolverId: rania.id, action: "correct", note: "Je propose la correction." })).toEqual({ ok: true });
    expect(await resolveReport(db, { reportId: toDismiss, resolverId: rania.id, action: "dismiss", note: "Sans rapport." })).toEqual({ ok: true });
    expect((await statusOf(song)).status).toBe("published");
    expect(await getReport(toCorrect)).toMatchObject({ status: "resolved" });
    expect(await getReport(toDismiss)).toMatchObject({ status: "dismissed", resolutionNote: "Sans rapport." });
  });

  it("refuse un signalement déjà traité ou inconnu, et retirer une chanson déjà retirée", async () => {
    const song = ids.get("s-habaytak")!;
    const first = await insertReport({ songId: song });
    const second = await insertReport({ songId: song });
    await resolveReport(db, { reportId: first, resolverId: rania.id, action: "remove", note: "Retrait." });
    expect(await resolveReport(db, { reportId: first, resolverId: rania.id, action: "dismiss", note: "Encore." })).toEqual({ ok: false, error: "notOpen" });
    expect(await resolveReport(db, { reportId: second, resolverId: rania.id, action: "remove", note: "Aussi." })).toEqual({ ok: false, error: "songGone" });
    expect(await resolveReport(db, { reportId: second, resolverId: rania.id, action: "correct", note: "Aussi." })).toEqual({ ok: false, error: "songGone" });
    expect(await resolveReport(db, { reportId: second, resolverId: rania.id, action: "dismiss", note: "Déjà retirée." })).toEqual({ ok: true });
    expect(await resolveReport(db, { reportId: UNKNOWN, resolverId: rania.id, action: "dismiss", note: "x" })).toEqual({ ok: false, error: "notFound" });
  });

  it("deux modérateurs qui traitent le même signalement en même temps : un seul l'emporte", async () => {
    const report = await insertReport({ songId: ids.get("s-ala-nar")! });
    const other = await insertUser({ globalRole: "moderator" });
    const results = await Promise.all([
      resolveReport(db, { reportId: report, resolverId: rania.id, action: "remove", note: "A." }),
      resolveReport(db, { reportId: report, resolverId: other.id, action: "remove", note: "B." }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, error: "notOpen" }]);
  });

  it("rétablit une chanson retirée : cherchable et lisible de nouveau, motif effacé", async () => {
    const song = ids.get("s-sidi-mansour")!;
    const report = await insertReport({ songId: song });
    await resolveReport(db, { reportId: report, resolverId: rania.id, action: "remove", note: "Demande des ayants droit." });
    expect(await restoreSong(db, song)).toBe("restored");
    expect(await statusOf(song)).toMatchObject({ status: "published", removedReason: null });
    expect((await searchSongs("sidi mansour")).items.map((i) => i.id)).toContain(song);
    expect(await restoreSong(db, song)).toBe("notRemoved");
  });

  it("garde le signalement d'un compte supprimé, sans auteur, et lit les 100 derniers signalements traités", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = ids.get("s-ya-lili")!;
    const report = await insertReport({ songId: song, reporterId: leila.id });
    await resolveReport(db, { reportId: report, resolverId: rania.id, action: "dismiss", note: "Sans suite." });
    expect(await deleteUserAccount(db, leila.id)).toEqual({ ok: true });
    expect(await getReport(report)).toMatchObject({ reporterId: null, reporterName: null, contactEmail: null });

    for (let i = 0; i < 101; i += 1) {
      const id = await insertReport({ songId: song, createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)) });
      await resolveReport(db, { reportId: id, resolverId: rania.id, action: "dismiss", note: `Note ${i}.` });
    }
    expect(await treatedReports()).toHaveLength(100);
  });
});
