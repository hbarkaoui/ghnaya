import { describe, expect, it } from "vitest";
import { clubHref, signInHref } from "@/lib/clubs/href";

describe("liens des clubs", () => {
  it("mène au club ou à l'une de ses sections", () => {
    expect(clubHref("les-jasmins")).toBe("/clubs/les-jasmins");
    expect(clubHref("les-jasmins", "membres")).toBe("/clubs/les-jasmins/membres");
    expect(clubHref("les-jasmins", "reglages")).toBe("/clubs/les-jasmins/reglages");
  });

  it("encode un slug arabe", () => {
    expect(clubHref("نادي")).toBe("/clubs/%D9%86%D8%A7%D8%AF%D9%8A");
  });

  it("renvoie vers la connexion avec la page où revenir", () => {
    expect(signInHref("/rejoindre/k7m2x9pq4r")).toBe("/connexion?retour=%2Frejoindre%2Fk7m2x9pq4r");
  });
});
