import { describe, expect, it } from "vitest";
import { initials } from "@/components/ui/initials";

describe("initials : avatar à initiales", () => {
  it("prend la première et la dernière initiale d'un nom latin, en majuscules", () => {
    expect(initials("Amira Ben Salah")).toBe("AS");
    expect(initials("karim trabelsi")).toBe("KT");
    expect(initials("Jean-Pierre Dupont")).toBe("JD");
  });

  it("garde une seule lettre pour un prénom seul", () => {
    expect(initials("Leïla")).toBe("L");
  });

  it("garde une seule lettre arabe, sans l'article « ال »", () => {
    expect(initials("سلمى")).toBe("س");
    expect(initials("نور الهدى")).toBe("ن");
    expect(initials("الهادي")).toBe("ه");
  });

  it("renvoie un point d'interrogation pour un nom vide", () => {
    expect(initials("  ")).toBe("?");
  });
});
