import { describe, expect, it } from "vitest";
import { signInHref } from "@/lib/auth/returnPath";

const retourOf = (href: string) => new URL(href, "https://ghnaya.test").searchParams.get("retour");

describe("signInHref", () => {
  it("renvoie vers /connexion avec la page où revenir", () => {
    const href = signInHref("/chanson/s-sidi-mansour");
    expect(href.startsWith("/connexion?")).toBe(true);
    expect(retourOf(href)).toBe("/chanson/s-sidi-mansour");
  });

  it("garde la requête de la page (recherche, page de résultats)", () => {
    expect(retourOf(signInHref("/recherche?q=sidi+mansour&page=2"))).toBe("/recherche?q=sidi+mansour&page=2");
    expect(retourOf(signInHref("/recherche?q=%D8%B3%D9%8A%D8%AF%D9%8A"))).toBe("/recherche?q=%D8%B3%D9%8A%D8%AF%D9%8A");
  });

  it("n'accepte qu'un chemin interne, sinon renvoie vers l'accueil", () => {
    expect(retourOf(signInHref("https://exemple.com/piege"))).toBe("/");
    expect(retourOf(signInHref("//exemple.com"))).toBe("/");
    expect(retourOf(signInHref("/\\exemple.com"))).toBe("/");
    expect(retourOf(signInHref(""))).toBe("/");
  });
});
