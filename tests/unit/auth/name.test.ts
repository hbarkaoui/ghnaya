import { describe, expect, it } from "vitest";
import { USER_NAME_MAX, defaultNameFromEmail, normalizeUserName } from "@/lib/auth/name";

describe("defaultNameFromEmail", () => {
  it("prend la partie avant @", () => {
    expect(defaultNameFromEmail("leila@example.com")).toBe("leila");
    expect(defaultNameFromEmail("sami.trabelsi+club@gmail.com")).toBe("sami.trabelsi");
  });

  it("ne renvoie jamais un nom vide", () => {
    expect(defaultNameFromEmail("@example.com")).toBe("example.com");
    expect(defaultNameFromEmail("")).toBe("Membre");
  });
});

describe("normalizeUserName", () => {
  it("nettoie les espaces et accepte l'arabe", () => {
    expect(normalizeUserName("  Leïla   Ben Salah ")).toEqual({ ok: true, name: "Leïla Ben Salah" });
    expect(normalizeUserName("سلمى")).toEqual({ ok: true, name: "سلمى" });
  });

  it("refuse un nom vide ou trop long", () => {
    expect(normalizeUserName("   ")).toEqual({ ok: false, error: "required" });
    expect(normalizeUserName(42)).toEqual({ ok: false, error: "required" });
    expect(normalizeUserName("a".repeat(USER_NAME_MAX + 1))).toEqual({ ok: false, error: "tooLong" });
  });
});
