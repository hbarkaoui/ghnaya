// Plan 3, tâche 6 : décider d'une proposition (spec §4.3, §8.4, §8.5 ; §12 : le serveur refuse).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { songRevisions, songs, users } from "@/lib/db/schema";
import { getRevision } from "@/lib/moderation/queries";
import { insertRevision, insertSong, insertUser, PAYLOAD } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }));
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
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "fr",
}));

const { reviewProposal } = await import("@/app/actions/moderation");

const INITIAL = { error: null, attempt: 0 };

async function decide(revisionId: string, decision: "approve" | "reject", note = "") {
  const data = new FormData();
  data.set("decision", decision);
  data.set("note", note);
  try {
    return { state: await reviewProposal(revisionId, INITIAL, data) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND") return { notFound: true };
    const match = /^REDIRECT (.+)$/.exec(message);
    if (!match) throw error;
    return { redirect: match[1] };
  }
}

async function signIn(userId: string): Promise<void> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

const contributed = async () => (await db.select().from(songs).where(eq(songs.source, "contribution"))).length;
const at = (iso: string) => new Date(iso);

describe("décider d'une proposition", () => {
  let leila: { id: string };
  let rania: { id: string };

  beforeEach(async () => {
    await resetDb();
    leila = await insertUser({ name: "Leïla" });
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
    await signIn(rania.id);
  });

  it("renvoie un visiteur à la connexion et cache la modération à un membre", async () => {
    const id = await insertRevision({ authorId: leila.id });
    session.user = null;
    expect((await decide(id, "approve")).redirect).toMatch(/^\/connexion/);
    await signIn(leila.id);
    expect(await decide(id, "approve")).toEqual({ notFound: true });
    expect((await getRevision(id))?.status).toBe("pending");
    expect(await contributed()).toBe(0);
  });

  it("approuver publie la chanson, puis ouvre la proposition suivante, ou la file vide", async () => {
    const first = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-10T10:00:00Z") });
    const second = await insertRevision({
      authorId: leila.id,
      payload: { ...PAYLOAD, titleLatin: "Seconde" },
      createdAt: at("2026-11-11T10:00:00Z"),
    });
    expect(await decide(first, "approve")).toEqual({ redirect: `/moderation/${second}?statut=approved` });
    expect(await decide(second, "approve")).toEqual({ redirect: "/moderation?statut=approved" });
    expect(await contributed()).toBe(2);
    expect(await getRevision(first)).toMatchObject({ status: "approved" });
  });

  it("un modérateur n'approuve pas sa propre proposition, mais peut la rejeter (spec §4.3)", async () => {
    const own = await insertRevision({ authorId: rania.id });
    expect(await decide(own, "approve")).toEqual({ state: { error: "ownProposal", attempt: 1 } });
    expect(await contributed()).toBe(0);
    expect((await getRevision(own))?.status).toBe("pending");
    expect(await decide(own, "reject", "Je la retire.")).toEqual({ redirect: "/moderation?statut=rejected" });
    expect((await getRevision(own))?.status).toBe("rejected");
  });

  it("un admin approuve les siennes, pour amorcer la plateforme", async () => {
    const admin = await insertUser({ globalRole: "admin" });
    await signIn(admin.id);
    const own = await insertRevision({ authorId: admin.id });
    expect(await decide(own, "approve")).toEqual({ redirect: "/moderation?statut=approved" });
    expect(await contributed()).toBe(1);
  });

  it("rejeter exige une note, que l'auteur lira ensuite", async () => {
    const id = await insertRevision({ authorId: leila.id });
    expect(await decide(id, "reject", "  ")).toEqual({ state: { error: "noteRequired", attempt: 1 } });
    expect(await decide(id, "reject", "Déjà dans Ghnaya.")).toEqual({ redirect: "/moderation?statut=rejected" });
    expect(await getRevision(id)).toMatchObject({ status: "rejected", reviewNote: "Déjà dans Ghnaya." });
  });

  it("refuse la correction d'une chanson retirée entre-temps, et une proposition déjà relue ou inconnue", async () => {
    const removed = await insertSong("Ya Lili");
    const correction = await insertRevision({ authorId: leila.id, songId: removed });
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    expect(await decide(correction, "approve")).toEqual({ state: { error: "songGone", attempt: 1 } });
    expect((await getRevision(correction))?.status).toBe("pending");

    const done = await insertRevision({ authorId: leila.id });
    await db
      .update(songRevisions)
      .set({ status: "rejected", reviewedAt: new Date(), reviewNote: "Doublon." })
      .where(eq(songRevisions.id, done));
    expect(await decide(done, "approve")).toEqual({ state: { error: "notPending", attempt: 1 } });
    expect(await decide("6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f", "approve")).toEqual({ notFound: true });
  });
});
