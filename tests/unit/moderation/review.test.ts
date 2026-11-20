import { describe, expect, it } from "vitest";
import {
  NOTE_MAX,
  checkReportAction,
  checkReview,
  parseDecision,
  parseReportAction,
  statusAfter,
} from "@/lib/moderation/review";

const pending = { authorId: "u-leila", status: "pending" as const };

describe("parseDecision", () => {
  it("reconnaît les deux décisions et rien d'autre", () => {
    expect(parseDecision("approve")).toBe("approve");
    expect(parseDecision("reject")).toBe("reject");
    expect(parseDecision("delete")).toBeNull();
    expect(parseDecision(null)).toBeNull();
  });
});

describe("checkReview : approuver ou rejeter une proposition", () => {
  it("accepte l'approbation par un autre modérateur, sans note", () => {
    expect(checkReview({ proposal: pending, reviewerId: "u-rania", decision: "approve", note: "" })).toEqual({
      ok: true,
      note: null,
    });
  });

  it("garde une note facultative à l'approbation, nettoyée", () => {
    expect(checkReview({ proposal: pending, reviewerId: "u-rania", decision: "approve", note: "  Merci !\r\n" })).toEqual(
      { ok: true, note: "Merci !" },
    );
  });

  it("refuse qu'un modérateur approuve sa propre proposition (spec §4.3)", () => {
    expect(
      checkReview({ proposal: { ...pending, authorId: "u-rania" }, reviewerId: "u-rania", decision: "approve", note: "" }),
    ).toEqual({ ok: false, error: "ownProposal" });
  });

  it("exige une note pour rejeter", () => {
    expect(checkReview({ proposal: pending, reviewerId: "u-rania", decision: "reject", note: "   \n " })).toEqual({
      ok: false,
      error: "noteRequired",
    });
    expect(checkReview({ proposal: pending, reviewerId: "u-rania", decision: "reject", note: null })).toEqual({
      ok: false,
      error: "noteRequired",
    });
  });

  it("accepte un rejet avec une note", () => {
    expect(
      checkReview({ proposal: pending, reviewerId: "u-rania", decision: "reject", note: "Déjà dans Ghnaya." }),
    ).toEqual({ ok: true, note: "Déjà dans Ghnaya." });
  });

  it(`refuse une note de plus de ${NOTE_MAX} caractères`, () => {
    expect(
      checkReview({ proposal: pending, reviewerId: "u-rania", decision: "reject", note: "x".repeat(NOTE_MAX + 1) }),
    ).toEqual({ ok: false, error: "noteTooLong" });
  });

  it("refuse de relire une proposition déjà relue", () => {
    expect(
      checkReview({ proposal: { ...pending, status: "approved" }, reviewerId: "u-rania", decision: "reject", note: "Non" }),
    ).toEqual({ ok: false, error: "notPending" });
  });
});

describe("checkReportAction : traiter un signalement", () => {
  const open = { status: "open" as const };

  it("reconnaît les trois actions et rien d'autre", () => {
    expect(parseReportAction("remove")).toBe("remove");
    expect(parseReportAction("correct")).toBe("correct");
    expect(parseReportAction("dismiss")).toBe("dismiss");
    expect(parseReportAction("restore")).toBeNull();
  });

  it("exige une note, quelle que soit l'action", () => {
    for (const action of ["remove", "correct", "dismiss"] as const) {
      expect(checkReportAction({ report: open, action, note: " ", songPublished: true })).toEqual({
        ok: false,
        error: "noteRequired",
      });
    }
  });

  it("accepte une action avec une note", () => {
    expect(checkReportAction({ report: open, action: "remove", note: " Demande des ayants droit ", songPublished: true })).toEqual({
      ok: true,
      note: "Demande des ayants droit",
    });
  });

  it("refuse de retirer ou de corriger une chanson déjà retirée, mais permet de classer", () => {
    expect(checkReportAction({ report: open, action: "remove", note: "Motif", songPublished: false })).toEqual({
      ok: false,
      error: "songGone",
    });
    expect(checkReportAction({ report: open, action: "correct", note: "Motif", songPublished: false })).toEqual({
      ok: false,
      error: "songGone",
    });
    expect(checkReportAction({ report: open, action: "dismiss", note: "Déjà retirée", songPublished: false })).toEqual({
      ok: true,
      note: "Déjà retirée",
    });
  });

  it("refuse de traiter un signalement déjà traité", () => {
    expect(
      checkReportAction({ report: { status: "dismissed" }, action: "dismiss", note: "Motif", songPublished: true }),
    ).toEqual({ ok: false, error: "notOpen" });
  });

  it("classe sans suite (« dismissed ») ou marque comme traité (« resolved ») selon l'action", () => {
    expect(statusAfter("remove")).toBe("resolved");
    expect(statusAfter("correct")).toBe("resolved");
    expect(statusAfter("dismiss")).toBe("dismissed");
  });
});
