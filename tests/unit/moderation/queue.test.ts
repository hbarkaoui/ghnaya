import { describe, expect, it } from "vitest";
import { compareProposals, compareReports, countByStatus, nextInQueue, proposalQueue, reportQueue } from "@/lib/moderation/queue";
import type { ProposalStatus } from "@/types/proposal";
import type { ReportReason, ReportStatus } from "@/types/report";

const proposal = (id: string, createdAt: string, status: ProposalStatus = "pending") => ({ id, createdAt, status });

const report = (id: string, reason: ReportReason, createdAt: string, status: ReportStatus = "open") => ({
  id,
  reason,
  createdAt,
  status,
});

describe("proposalQueue : la file des propositions", () => {
  it("ne garde que les propositions en attente, de la plus ancienne à la plus récente", () => {
    const queue = proposalQueue([
      proposal("p-recente", "2026-11-18T10:00:00Z"),
      proposal("p-relue", "2026-11-01T10:00:00Z", "approved"),
      proposal("p-ancienne", "2026-11-12T10:00:00Z"),
      proposal("p-refusee", "2026-11-02T10:00:00Z", "rejected"),
    ]);
    expect(queue.map((p) => p.id)).toEqual(["p-ancienne", "p-recente"]);
  });

  it("départage deux propositions du même instant par leur identifiant, pour un ordre stable", () => {
    const queue = proposalQueue([proposal("p-b", "2026-11-12T10:00:00Z"), proposal("p-a", "2026-11-12T10:00:00Z")]);
    expect(queue.map((p) => p.id)).toEqual(["p-a", "p-b"]);
  });
});

describe("reportQueue : la file des signalements", () => {
  it("place les signalements pour droits d'auteur en tête, puis les autres par ancienneté", () => {
    const queue = reportQueue([
      report("r-doublon", "duplicate", "2026-11-10T10:00:00Z"),
      report("r-droits-recent", "copyright", "2026-11-18T10:00:00Z"),
      report("r-paroles", "wrong_lyrics", "2026-11-05T10:00:00Z"),
      report("r-droits-ancien", "copyright", "2026-11-12T10:00:00Z"),
    ]);
    expect(queue.map((r) => r.id)).toEqual(["r-droits-ancien", "r-droits-recent", "r-paroles", "r-doublon"]);
  });

  it("ne garde que les signalements ouverts", () => {
    const queue = reportQueue([
      report("r-ouvert", "spam", "2026-11-10T10:00:00Z"),
      report("r-classe", "spam", "2026-11-01T10:00:00Z", "dismissed"),
      report("r-traite", "copyright", "2026-11-01T10:00:00Z", "resolved"),
    ]);
    expect(queue.map((r) => r.id)).toEqual(["r-ouvert"]);
  });
});

describe("nextInQueue : l'élément suivant (« Suivante »)", () => {
  const a = proposal("p-a", "2026-11-10T10:00:00Z");
  const b = proposal("p-b", "2026-11-11T10:00:00Z");
  const c = proposal("p-c", "2026-11-12T10:00:00Z");

  it("donne l'élément qui suit dans la file", () => {
    expect(nextInQueue([a, b, c], a, compareProposals)).toBe(b);
  });

  it("donne l'élément qui suivait celui qu'on vient de relire, sorti de la file", () => {
    expect(nextInQueue([a, c], b, compareProposals)).toBe(c);
  });

  it("revient au début de la file après le dernier élément : on ne s'arrête qu'à la file vide", () => {
    expect(nextInQueue([a, b, c], c, compareProposals)).toBe(a);
  });

  it("ne renvoie rien quand l'élément courant est le seul de la file", () => {
    expect(nextInQueue([b], b, compareProposals)).toBeNull();
  });

  it("ne renvoie rien quand la file est vide", () => {
    expect(nextInQueue([], b, compareProposals)).toBeNull();
  });

  it("suit l'ordre des signalements, droits d'auteur en tête", () => {
    const droits = report("r-droits", "copyright", "2026-11-18T10:00:00Z");
    const spam = report("r-spam", "spam", "2026-11-01T10:00:00Z");
    expect(nextInQueue([droits, spam], droits, compareReports)).toBe(spam);
  });
});

describe("countByStatus", () => {
  it("compte les propositions de chaque statut, et toutes", () => {
    const list = [proposal("a", "2026-11-01"), proposal("b", "2026-11-02", "approved"), proposal("c", "2026-11-03", "rejected")];
    expect(countByStatus(list)).toEqual({ all: 3, pending: 1, approved: 1, rejected: 1 });
  });
});

describe("nextInQueue, avec un repère d'un autre type que la file", () => {
  it("compare une proposition lue en entier à la file des résumés", () => {
    const queue = [
      { id: "b", createdAt: "2026-11-02" },
      { id: "c", createdAt: "2026-11-03" },
    ];
    const current = { id: "a", createdAt: "2026-11-01", payload: { lyrics: "سطر" } };
    expect(nextInQueue(queue, current, compareProposals)?.id).toBe("b");
  });
});
