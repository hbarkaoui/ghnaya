import { describe, expect, it } from "vitest";
import { accountFor, clubsOf, soleAnimatorClubs } from "@/mocks/account";
import { demoUserFor, type DemoSession } from "@/mocks/session";

const user = (session: DemoSession) => {
  const found = demoUserFor(session);
  if (!found) throw new Error(`pas d'utilisateur pour ${session}`);
  return found;
};

describe("clubsOf : les pastilles de club de la page Moi", () => {
  it("donne le club d'un membre, avec son nom", () => {
    expect(clubsOf(user("member"))).toEqual([{ slug: "les-jasmins", name: "Les Jasmins" }]);
  });

  it("donne les clubs d'un animateur, dans l'ordre de ses clubs", () => {
    expect(clubsOf(user("animator")).map((c) => c.name)).toEqual(["Les Jasmins", "Malouf Sfax", "Chorale du Bardo"]);
  });

  it("ne donne rien à un membre sans club", () => {
    expect(clubsOf(user("member-no-club"))).toEqual([]);
  });
});

describe("soleAnimatorClubs : la règle du dernier animateur (spec §12)", () => {
  it("liste les clubs où l'animateur est le seul animateur", () => {
    // Adhésions de clubStore : Malouf Sfax a un second animateur, Les Jasmins et la Chorale du Bardo non.
    expect(soleAnimatorClubs(user("animator"))).toEqual([
      { slug: "les-jasmins", name: "Les Jasmins" },
      { slug: "chorale-du-bardo", name: "Chorale du Bardo" },
    ]);
  });

  it("ne bloque jamais un membre qui n'anime aucun club", () => {
    expect(soleAnimatorClubs(user("member"))).toEqual([]);
    expect(soleAnimatorClubs(user("moderator"))).toEqual([]);
  });
});

describe("accountFor : e-mail et propositions en attente", () => {
  it("donne à chaque utilisateur son propre e-mail", () => {
    const emails = (["member", "animator", "moderator"] as const).map((s) => accountFor(user(s)).email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const email of emails) expect(email).toMatch(/^[^@\s]+@example\.com$/);
  });

  it("donne au membre des propositions en attente, et aucune à l'animateur", () => {
    expect(accountFor(user("member")).pendingContributions).toBeGreaterThan(0);
    expect(accountFor(user("animator")).pendingContributions).toBe(0);
  });
});
