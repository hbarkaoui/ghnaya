// Plan 3, tâche 2 : propositions en base (spec §8.3, §8.4, §8.6, §8.7, §12).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteUserAccount } from "@/lib/account/write";
import { db } from "@/lib/db/client";
import { songRevisions } from "@/lib/db/schema";
import { allowRevision, REVISION_LIMIT } from "@/lib/moderation/limits";
import {
  getRevision,
  hasPendingRevision,
  moderationCounts,
  pendingRevisionCountOf,
  pendingRevisions,
  revisionsOf,
} from "@/lib/moderation/queries";
import { createRevision, rejectRevision } from "@/lib/moderation/revisionWrite";
import { insertReport, insertRevision, insertSong, insertUser, PAYLOAD } from "./factories";
import { resetDb } from "./helpers";

const UNKNOWN = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";
const at = (iso: string) => new Date(iso);

describe("propositions en base", () => {
  beforeEach(resetDb);

  it("enregistre une proposition en attente, que Mes contributions liste de la plus récente à la plus ancienne", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = await insertSong("Ya Lella");
    const old = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-01T10:00:00Z") });
    const created = await createRevision(db, { authorId: leila.id, songId: song, payload: PAYLOAD });
    if (!created.ok) throw new Error("proposition refusée");

    const list = await revisionsOf(leila.id);
    expect(list.map((r) => r.id)).toEqual([created.id, old]);
    expect(list[0]).toMatchObject({
      songId: song,
      authorId: leila.id,
      authorName: "Leïla",
      status: "pending",
      reviewNote: null,
      reviewedAt: null,
      payload: { titleAr: PAYLOAD.titleAr, titleLatin: PAYLOAD.titleLatin, artists: PAYLOAD.artists },
      songPublished: true,
    });
    expect(list[1].songPublished).toBe(false);
    expect(await getRevision(created.id)).toMatchObject({ payload: PAYLOAD, rightsDeclared: true });
    expect(await getRevision("pas-un-uuid")).toBeNull();
    expect(await getRevision(UNKNOWN)).toBeNull();
  });

  it("refuse une seconde correction en attente de la même chanson (spec §8.3)", async () => {
    const leila = await insertUser();
    const song = await insertSong("Sidi Mansour");
    expect((await createRevision(db, { authorId: leila.id, songId: song, payload: PAYLOAD })).ok).toBe(true);
    expect(await hasPendingRevision(leila.id, song)).toBe(true);
    expect(await createRevision(db, { authorId: leila.id, songId: song, payload: PAYLOAD })).toEqual({
      ok: false,
      error: "pendingExists",
    });
  });

  it("file de modération : les propositions en attente, de la plus ancienne à la plus récente (spec §8.4)", async () => {
    const [leila, sami] = [await insertUser(), await insertUser()];
    const second = await insertRevision({ authorId: sami.id, createdAt: at("2026-11-12T10:00:00Z") });
    const first = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-10T10:00:00Z") });
    const done = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-01T10:00:00Z") });
    await db
      .update(songRevisions)
      .set({ status: "rejected", reviewedAt: new Date(), reviewNote: "Doublon." })
      .where(eq(songRevisions.id, done));
    expect((await pendingRevisions()).map((r) => r.id)).toEqual([first, second]);
  });

  it("rejette une proposition en attente avec la note du modérateur, une seule fois", async () => {
    const [leila, rania] = [await insertUser(), await insertUser({ globalRole: "moderator" })];
    const id = await insertRevision({ authorId: leila.id });
    expect(await rejectRevision(db, { revisionId: id, reviewerId: rania.id, note: "Déjà dans Ghnaya." })).toEqual({ ok: true });
    const rejected = await getRevision(id);
    expect(rejected).toMatchObject({ status: "rejected", reviewNote: "Déjà dans Ghnaya." });
    expect(rejected?.reviewedAt).not.toBeNull();
    expect(await rejectRevision(db, { revisionId: id, reviewerId: rania.id, note: "Encore." })).toEqual({
      ok: false,
      error: "notPending",
    });
    expect(await rejectRevision(db, { revisionId: UNKNOWN, reviewerId: rania.id, note: "x" })).toEqual({
      ok: false,
      error: "notFound",
    });
  });

  it("compte les propositions en attente d'un auteur, et la taille des deux files", async () => {
    const leila = await insertUser();
    const song = await insertSong("Ya Lili");
    await insertRevision({ authorId: leila.id });
    await insertRevision({ authorId: leila.id, songId: song });
    await insertReport({ songId: song });
    expect(await pendingRevisionCountOf(leila.id)).toBe(2);
    expect(await moderationCounts()).toEqual({ proposals: 2, reports: 1 });
  });

  it("garde les propositions d'un compte supprimé, sans auteur (spec §12, écart 1)", async () => {
    const leila = await insertUser();
    const id = await insertRevision({ authorId: leila.id });
    expect(await deleteUserAccount(db, leila.id)).toEqual({ ok: true });
    expect(await getRevision(id)).toMatchObject({ authorId: null, authorName: null, status: "pending" });
  });

  it(`limite à ${REVISION_LIMIT.limit} propositions par jour et par personne (spec §8.7)`, async () => {
    const leila = await insertUser();
    for (let i = 0; i < REVISION_LIMIT.limit; i += 1) expect(await allowRevision(leila.id)).toBe(true);
    expect(await allowRevision(leila.id)).toBe(false);
    expect(await allowRevision((await insertUser()).id)).toBe(true);
  });
});
