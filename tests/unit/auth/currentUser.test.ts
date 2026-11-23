import { describe, expect, it } from "vitest";
import { toCurrentUser } from "@/lib/auth/types";

const base = { id: "u1", name: "Leïla", email: "leila@example.com" };

describe("toCurrentUser", () => {
  it("donne les valeurs par défaut d'un membre", () => {
    expect(toCurrentUser(base, [])).toEqual({
      ...base,
      locale: "fr",
      emailVerified: false,
      globalRole: "member",
      isAnimator: false,
      isModerator: false,
      clubs: [],
      clubSlugs: [],
    });
  });

  it("reprend l'adresse vérifiée, et seulement la valeur vraie", () => {
    expect(toCurrentUser({ ...base, emailVerified: true }, []).emailVerified).toBe(true);
    expect(toCurrentUser({ ...base, emailVerified: "oui" }, []).emailVerified).toBe(false);
  });

  it("un modérateur et un admin modèrent", () => {
    expect(toCurrentUser({ ...base, globalRole: "moderator" }, []).isModerator).toBe(true);
    expect(toCurrentUser({ ...base, globalRole: "admin" }, []).isModerator).toBe(true);
  });

  it("garde l'ordre des clubs et en tire les slugs", () => {
    const clubs = [
      { slug: "les-jasmins", name: "Les Jasmins", role: "animator" as const },
      { slug: "malouf-sfax", name: "Malouf Sfax", role: "member" as const },
    ];
    expect(toCurrentUser({ ...base, isAnimator: true }, clubs).clubSlugs).toEqual(["les-jasmins", "malouf-sfax"]);
  });

  it("ignore un rôle ou une langue inconnus", () => {
    const user = toCurrentUser({ ...base, globalRole: "root", locale: "en" }, []);
    expect(user.globalRole).toBe("member");
    expect(user.locale).toBe("fr");
  });
});
