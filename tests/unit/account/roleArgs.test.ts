import { describe, expect, it } from "vitest";
import { noAnimatorWarning, parseRoleArgs } from "@/lib/account/roles";

describe("parseRoleArgs", () => {
  it("lit l'adresse, le rôle global et le rôle d'animateur", () => {
    expect(parseRoleArgs(["Sami@Example.com", "--animator"])).toEqual({
      ok: true,
      email: "sami@example.com",
      change: { isAnimator: true },
    });
    expect(parseRoleArgs(["rania@example.com", "--role", "moderator", "--no-animator"])).toEqual({
      ok: true,
      email: "rania@example.com",
      change: { globalRole: "moderator", isAnimator: false },
    });
  });

  it("refuse une commande sans changement, un rôle inconnu ou une adresse invalide", () => {
    expect(parseRoleArgs(["sami@example.com"]).ok).toBe(false);
    expect(parseRoleArgs(["sami@example.com", "--role", "root"]).ok).toBe(false);
    expect(parseRoleArgs(["pas-une-adresse", "--animator"]).ok).toBe(false);
    expect(parseRoleArgs([]).ok).toBe(false);
  });
});

describe("noAnimatorWarning", () => {
  it("ne dit rien pour zéro ou un club", () => {
    expect(noAnimatorWarning("sami@example.com", [])).toBeNull();
    expect(noAnimatorWarning("sami@example.com", [{ slug: "jasmins", name: "Les Jasmins" }])).toBeNull();
  });

  it("liste les clubs quand il en reste plusieurs", () => {
    const warning = noAnimatorWarning("sami@example.com", [
      { slug: "jasmins", name: "Les Jasmins" },
      { slug: "oliviers", name: "Les Oliviers" },
    ]);
    expect(warning).toContain("sami@example.com");
    expect(warning).toContain("2 clubs : Les Jasmins (jasmins), Les Oliviers (oliviers)");
  });
});
