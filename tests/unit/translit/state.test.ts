import { describe, expect, it } from "vitest";
import { initialTranslits, toTranslitState, translitView } from "@/lib/translit/state";

const song = (id: string, lyricsTranslit: string | null, translitStatus: "none" | "generating" | "auto" | "reviewed") => ({
  id,
  lyricsTranslit,
  translitStatus,
});

describe("initialTranslits", () => {
  it("reprend les translittérations déjà en base, automatiques ou relues", () => {
    expect(
      initialTranslits([song("a", "ya lil", "auto"), song("b", "idha ach-cha3bou", "reviewed")]),
    ).toEqual({
      a: { kind: "ready", text: "ya lil", status: "auto" },
      b: { kind: "ready", text: "idha ach-cha3bou", status: "reviewed" },
    });
  });

  it("laisse de côté les chansons sans translittération prête", () => {
    expect(initialTranslits([song("a", null, "none"), song("b", null, "generating"), song("c", null, "auto")])).toEqual({});
  });
});

describe("toTranslitState", () => {
  it("garde une translittération relue et le refus d'un visiteur", () => {
    expect(toTranslitState({ ok: true, text: "ya lella", status: "reviewed" })).toEqual({
      kind: "ready",
      text: "ya lella",
      status: "reviewed",
    });
    expect(toTranslitState({ ok: false, reason: "signin" })).toEqual({ kind: "signin" });
  });

  it("traduit une génération réussie en translittération prête", () => {
    expect(toTranslitState({ ok: true, text: "ya lella", status: "auto" })).toEqual({
      kind: "ready",
      text: "ya lella",
      status: "auto",
    });
  });

  it("garde la raison d'un échec : erreur ou limite quotidienne", () => {
    expect(toTranslitState({ ok: false, reason: "failed" })).toEqual({ kind: "failed" });
    expect(toTranslitState({ ok: false, reason: "limit" })).toEqual({ kind: "limit" });
  });
});

describe("translitView", () => {
  it("reflète le refus d'un visiteur pour un mode latin", () => {
    expect(translitView(true, { kind: "signin" })).toBe("signin");
  });

  it("est éteinte quand le mode arabe seul est choisi, même si une translittération existe", () => {
    expect(translitView(false, { kind: "ready", text: "x", status: "auto" })).toBe("off");
    expect(translitView(false, undefined)).toBe("off");
  });

  it("est en cours tant qu'aucun résultat n'est connu pour un mode latin", () => {
    expect(translitView(true, undefined)).toBe("generating");
  });

  it("reflète le résultat connu pour un mode latin", () => {
    expect(translitView(true, { kind: "ready", text: "x", status: "reviewed" })).toBe("ready");
    expect(translitView(true, { kind: "failed" })).toBe("failed");
    expect(translitView(true, { kind: "limit" })).toBe("limit");
  });
});
