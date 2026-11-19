import { describe, expect, it } from "vitest";
import { countByStatus, createProposalStore, formatProposalDate, SEED_PROPOSALS } from "@/mocks/proposals";
import type { ProposalPayload } from "@/types/proposal";

const PAYLOAD: ProposalPayload = {
  titleAr: null,
  titleLatin: "Lamouni",
  artists: [{ id: null, nameAr: null, nameLatin: "Emel Mathlouthi" }],
  lyrics: "سطر مخترع للتجربة\nوسطر ثاني",
  lyricsTranslit: null,
  dialect: "tn",
};

describe("magasin fictif des propositions", () => {
  it("ajoute une proposition en attente, datée et identifiée", () => {
    const store = createProposalStore([]);
    const proposal = store.add({ authorId: "u-leila", songId: null, payload: PAYLOAD }, new Date("2026-11-19T10:00:00Z"));
    expect(proposal).toMatchObject({
      authorId: "u-leila",
      songId: null,
      payload: PAYLOAD,
      rightsDeclared: true,
      status: "pending",
      reviewNote: null,
      createdAt: "2026-11-19T10:00:00.000Z",
      reviewedAt: null,
    });
    expect(store.get(proposal.id)).toEqual(proposal);
  });

  it("liste les propositions d'un auteur, de la plus récente à la plus ancienne", () => {
    const store = createProposalStore([]);
    const first = store.add({ authorId: "u-leila", songId: null, payload: PAYLOAD }, new Date("2026-11-01"));
    store.add({ authorId: "u-sami", songId: null, payload: PAYLOAD }, new Date("2026-11-02"));
    const third = store.add({ authorId: "u-leila", songId: null, payload: PAYLOAD }, new Date("2026-11-03"));
    expect(store.listFor("u-leila").map((p) => p.id)).toEqual([third.id, first.id]);
  });

  it("sait si l'auteur a déjà une correction en attente sur une chanson", () => {
    const store = createProposalStore([]);
    store.add({ authorId: "u-leila", songId: "s-ya-lella", payload: PAYLOAD });
    expect(store.hasPending("u-leila", "s-ya-lella")).toBe(true);
    expect(store.hasPending("u-sami", "s-ya-lella")).toBe(false);
    expect(store.hasPending("u-leila", "s-ala-nar")).toBe(false);
  });

  it("donne au membre de démonstration une proposition de chaque statut, avec la note du refus", () => {
    const leila = createProposalStore(SEED_PROPOSALS).listFor("u-leila");
    expect(countByStatus(leila)).toEqual({ all: 3, pending: 1, approved: 1, rejected: 1 });
    expect(leila.find((p) => p.status === "rejected")?.reviewNote).toBeTruthy();
  });
});

describe("formatProposalDate", () => {
  it("écrit la date dans la langue de l'interface, en chiffres occidentaux", () => {
    expect(formatProposalDate("2026-11-18T10:00:00Z", "fr")).toBe("18 novembre 2026");
    expect(formatProposalDate("2026-11-18T10:00:00Z", "ar")).toMatch(/^18 .+ 2026$/);
  });
});
