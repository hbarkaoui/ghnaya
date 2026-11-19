import { describe, expect, it } from "vitest";
import { safeReturnPath, signInHref } from "@/lib/auth/returnPath";

describe("safeReturnPath : n'accepter que des chemins internes", () => {
  it("accepte la racine et les chemins internes simples", () => {
    expect(safeReturnPath("/")).toBe("/");
    expect(safeReturnPath("/chanson/12")).toBe("/chanson/12");
    expect(safeReturnPath("/lecture/p-jeudi/3")).toBe("/lecture/p-jeudi/3");
  });

  it("garde la requête et l'ancre", () => {
    expect(safeReturnPath("/recherche?q=sidi&page=2")).toBe("/recherche?q=sidi&page=2");
    expect(safeReturnPath("/clubs/les-jasmins#membres")).toBe("/clubs/les-jasmins#membres");
  });

  it("encode une requête en arabe au lieu de la refuser", () => {
    expect(safeReturnPath("/recherche?q=سيدي")).toBe("/recherche?q=%D8%B3%D9%8A%D8%AF%D9%8A");
  });

  it("renvoie l'accueil quand le retour est absent, vide ou n'est pas une chaîne", () => {
    expect(safeReturnPath(undefined)).toBe("/");
    expect(safeReturnPath(null)).toBe("/");
    expect(safeReturnPath("")).toBe("/");
    expect(safeReturnPath(["/chanson/1", "/chanson/2"])).toBe("/");
  });

  it("utilise le repli fourni", () => {
    expect(safeReturnPath("https://exemple.com", "/moi")).toBe("/moi");
  });

  it("refuse les URL absolues", () => {
    expect(safeReturnPath("https://exemple.com")).toBe("/");
    expect(safeReturnPath("http://exemple.com/chanson/1")).toBe("/");
    expect(safeReturnPath("HTTPS://exemple.com")).toBe("/");
  });

  it("refuse les URL relatives au protocole (//hôte)", () => {
    expect(safeReturnPath("//exemple.com")).toBe("/");
    expect(safeReturnPath("///exemple.com")).toBe("/");
    expect(safeReturnPath("//exemple.com/chanson/1")).toBe("/");
  });

  it("refuse les barres obliques inversées, que les navigateurs lisent comme des barres", () => {
    expect(safeReturnPath("/\\exemple.com")).toBe("/");
    expect(safeReturnPath("/\\/exemple.com")).toBe("/");
    expect(safeReturnPath("\\\\exemple.com")).toBe("/");
  });

  it("refuse les schémas javascript:, data: et autres", () => {
    expect(safeReturnPath("javascript:alert(1)")).toBe("/");
    expect(safeReturnPath("JavaScript:alert(1)")).toBe("/");
    expect(safeReturnPath("data:text/html,<script>alert(1)</script>")).toBe("/");
    expect(safeReturnPath("mailto:leila@exemple.tn")).toBe("/");
  });

  it("refuse les caractères de contrôle, que les navigateurs suppriment (/\\t/hôte devient //hôte)", () => {
    expect(safeReturnPath("/\t/exemple.com")).toBe("/");
    expect(safeReturnPath("/\n/exemple.com")).toBe("/");
    expect(safeReturnPath("/\r\n/exemple.com")).toBe("/");
    expect(safeReturnPath("/chanson/1\u0000")).toBe("/");
  });

  it("refuse les chemins relatifs et les espaces en tête", () => {
    expect(safeReturnPath("chanson/12")).toBe("/");
    expect(safeReturnPath("./chanson/12")).toBe("/");
    expect(safeReturnPath("../chanson/12")).toBe("/");
    expect(safeReturnPath(" /chanson/12")).toBe("/");
  });

  it("résout les segments « .. » sans sortir du site", () => {
    expect(safeReturnPath("/chanson/../../../moi")).toBe("/moi");
  });

  it("ne renvoie jamais vers la connexion elle-même (boucle)", () => {
    expect(safeReturnPath("/connexion")).toBe("/");
    expect(safeReturnPath("/connexion?retour=/moi")).toBe("/");
    expect(safeReturnPath("/connexion/verifier")).toBe("/");
  });

  it("refuse un chemin démesuré", () => {
    expect(safeReturnPath(`/recherche?q=${"a".repeat(3000)}`)).toBe("/");
  });
});

describe("signInHref : lien vers la connexion avec le retour", () => {
  it("garde les barres lisibles dans le paramètre retour", () => {
    expect(signInHref("/")).toBe("/connexion?retour=/");
    expect(signInHref("/chanson/12")).toBe("/connexion?retour=/chanson/12");
  });

  it("encode la requête du chemin de retour", () => {
    expect(signInHref("/recherche?q=sidi&page=2")).toBe("/connexion?retour=/recherche%3Fq%3Dsidi%26page%3D2");
  });

  it("se relit à l'identique depuis l'URL de connexion", () => {
    for (const path of ["/", "/chanson/12", "/recherche?q=sidi mansour&page=2", "/clubs/les-jasmins#membres"]) {
      const retour = new URL(signInHref(path), "http://localhost").searchParams.get("retour");
      expect(safeReturnPath(retour)).toBe(safeReturnPath(path));
    }
  });

  it("remplace un retour externe par l'accueil", () => {
    expect(signInHref("https://exemple.com")).toBe("/connexion?retour=/");
    expect(signInHref("//exemple.com")).toBe("/connexion?retour=/");
  });

  it("mène à « Vérifiez vos e-mails » en gardant le retour", () => {
    expect(signInHref("/chanson/12", "verify")).toBe("/connexion/verifier?retour=/chanson/12");
    expect(signInHref("//exemple.com", "verify")).toBe("/connexion/verifier?retour=/");
  });
});
