// Plan 3, tâche 1 : contraintes des tables song_revisions et reports (spec §5, §8.3, écart 1).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { reports, songRevisions, users } from "@/lib/db/schema";
import { insertReport, insertRevision, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

/** Code PostgreSQL de l'erreur levée (Drizzle le range dans `cause`), ou `null` si tout passe. */
async function pgError(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (error) {
    const code = (value: unknown) => (value as { code?: string } | undefined)?.code;
    return code((error as { cause?: unknown }).cause) ?? code(error) ?? "inconnue";
  }
}

const UNIQUE = "23505";
const CHECK = "23514";

describe("schéma des propositions et des signalements", () => {
  beforeEach(resetDb);

  it("une seule correction en attente par auteur et par chanson ; les ajouts ne sont pas limités", async () => {
    const leila = await insertUser();
    const sami = await insertUser();
    const song = await insertSong("Ya Lella");
    const first = await insertRevision({ authorId: leila.id, songId: song });
    expect(await pgError(() => insertRevision({ authorId: leila.id, songId: song }))).toBe(UNIQUE);
    expect(await pgError(() => insertRevision({ authorId: sami.id, songId: song }))).toBeNull();
    expect(await pgError(() => insertRevision({ authorId: leila.id }))).toBeNull();
    expect(await pgError(() => insertRevision({ authorId: leila.id }))).toBeNull();

    await db.update(songRevisions).set({ status: "approved", reviewedAt: new Date() }).where(eq(songRevisions.id, first));
    expect(await pgError(() => insertRevision({ authorId: leila.id, songId: song }))).toBeNull();
  });

  it("une proposition relue porte sa date, un rejet porte sa note", async () => {
    const leila = await insertUser();
    const id = await insertRevision({ authorId: leila.id });
    const set = (values: Partial<typeof songRevisions.$inferInsert>) =>
      pgError(() => db.update(songRevisions).set(values).where(eq(songRevisions.id, id)));
    expect(await set({ status: "approved" })).toBe(CHECK);
    expect(await set({ reviewedAt: new Date() })).toBe(CHECK);
    expect(await set({ status: "rejected", reviewedAt: new Date() })).toBe(CHECK);
    expect(await set({ status: "rejected", reviewedAt: new Date(), reviewNote: "Déjà dans Ghnaya." })).toBeNull();
  });

  it("un signalement traité porte sa note", async () => {
    const id = await insertReport({ songId: await insertSong("Ya Lili") });
    const set = (values: Partial<typeof reports.$inferInsert>) =>
      pgError(() => db.update(reports).set(values).where(eq(reports.id, id)));
    expect(await set({ status: "dismissed" })).toBe(CHECK);
    expect(await set({ status: "dismissed", resolutionNote: "Sans rapport avec la chanson." })).toBeNull();
  });

  it("supprimer un compte garde ses propositions et ses signalements, sans auteur (écart 1)", async () => {
    const leila = await insertUser();
    const song = await insertSong("Sidi Mansour");
    const revision = await insertRevision({ authorId: leila.id, songId: song });
    const report = await insertReport({ songId: song, reporterId: leila.id });
    await db.delete(users).where(eq(users.id, leila.id));
    const [r] = await db.select().from(songRevisions).where(eq(songRevisions.id, revision));
    const [s] = await db.select().from(reports).where(eq(reports.id, report));
    expect(r.authorId).toBeNull();
    expect(s.reporterId).toBeNull();
  });
});
