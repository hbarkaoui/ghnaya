import { describe, expect, it } from "vitest";
import { moderationSeedProposals } from "@/mocks/moderationSeed";
import { createProposalStore, SEED_PROPOSALS } from "@/mocks/proposals";
import type { ProposalPayload } from "@/types/proposal";

const PAYLOAD: ProposalPayload = {
  titleAr: "عنوان",
  titleLatin: null,
  artists: [],
  lyrics: "سطر مخترع للتجربة\nوسطر ثاني",
  lyricsTranslit: null,
  dialect: "tn",
};

describe("magasin des propositions, côté modération", () => {
  it("liste toutes les propositions en attente, quels que soient leurs auteurs", () => {
    const store = createProposalStore(SEED_PROPOSALS);
    const added = store.add({ authorId: "u-youssef", songId: null, payload: PAYLOAD }, new Date("2026-11-19T10:00:00Z"));
    expect(store.listPending().map((p) => p.id)).toEqual(["p-lamouni", added.id]);
  });

  it("enregistre une décision : statut, note et date de relecture", () => {
    const store = createProposalStore(SEED_PROPOSALS);
    const reviewed = store.review(
      "p-lamouni",
      { status: "rejected", note: "Chanson retirée à la demande des ayants droit." },
      new Date("2026-11-19T11:00:00Z"),
    );
    expect(reviewed).toMatchObject({
      id: "p-lamouni",
      status: "rejected",
      reviewNote: "Chanson retirée à la demande des ayants droit.",
      reviewedAt: "2026-11-19T11:00:00.000Z",
    });
    expect(store.listPending()).toEqual([]);
    expect(store.listFor("u-leila").find((p) => p.id === "p-lamouni")?.status).toBe("rejected");
  });

  it("ne relit qu'une proposition en attente", () => {
    const store = createProposalStore(SEED_PROPOSALS);
    expect(store.review("p-sidi-mansour-doublon", { status: "approved", note: null })).toBeUndefined();
    expect(store.review("inconnue", { status: "approved", note: null })).toBeUndefined();
  });
});

describe("propositions de démonstration de la file", () => {
  it("sont toutes en attente, d'auteurs sans session de démonstration (Mes contributions de Leïla et Sami ne changent pas)", () => {
    expect(moderationSeedProposals().length).toBeGreaterThanOrEqual(4);
    for (const p of moderationSeedProposals()) {
      expect(p.status).toBe("pending");
      expect(["u-leila", "u-sami", "u-nour", "u-rania"]).not.toContain(p.authorId);
    }
  });

  it("mêlent ajouts et corrections", () => {
    expect(moderationSeedProposals().some((p) => p.songId === null)).toBe(true);
    expect(moderationSeedProposals().some((p) => p.songId !== null)).toBe(true);
  });
});
