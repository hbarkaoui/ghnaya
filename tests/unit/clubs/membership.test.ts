import { describe, expect, it } from "vitest";
import { decideJoin, join, promoteToAnimator, type Membership } from "@/lib/clubs/membership";

const LEILA = { id: "u-leila", isAnimator: false };
const SAMI = { id: "u-sami", isAnimator: true };
const NOUR = { id: "u-nour", isAnimator: false };

const BASE: Membership[] = [
  { clubSlug: "les-jasmins", userId: "u-sami", role: "animator" },
  { clubSlug: "les-jasmins", userId: "u-leila", role: "member" },
  { clubSlug: "malouf-sfax", userId: "u-sami", role: "animator" },
  { clubSlug: "nghanniw", userId: "u-rim", role: "animator" },
];

const clubsOf = (memberships: Membership[], userId: string) =>
  memberships.filter((m) => m.userId === userId).map((m) => m.clubSlug);

describe("decideJoin : règle des clubs (spec §5 et §10)", () => {
  it("un membre sans club rejoint simplement le club", () => {
    expect(decideJoin(BASE, NOUR, "les-jasmins")).toEqual({ kind: "join" });
  });

  it("un membre qui a déjà un club doit confirmer qu'il le quitte", () => {
    expect(decideJoin(BASE, LEILA, "malouf-sfax")).toEqual({ kind: "switch", leaving: ["les-jasmins"] });
  });

  it("un animateur rejoint le club en plus des siens, sans rien quitter", () => {
    expect(decideJoin(BASE, SAMI, "nghanniw")).toEqual({ kind: "join" });
  });

  it("on ne rejoint pas un club dont on fait déjà partie", () => {
    expect(decideJoin(BASE, LEILA, "les-jasmins")).toEqual({ kind: "already-member" });
    expect(decideJoin(BASE, SAMI, "malouf-sfax")).toEqual({ kind: "already-member" });
  });

  it("le dernier animateur d'un club ne peut pas le quitter pour un autre", () => {
    const rim = { id: "u-rim", isAnimator: false };
    expect(decideJoin(BASE, rim, "les-jasmins")).toEqual({ kind: "blocked", reason: "last-animator", club: "nghanniw" });
  });

  it("un membre animateur de son club peut partir s'il reste un autre animateur", () => {
    const promoted = promoteToAnimator(BASE, "les-jasmins", "u-leila");
    expect(decideJoin(promoted, LEILA, "malouf-sfax")).toEqual({ kind: "switch", leaving: ["les-jasmins"] });
  });
});

describe("join : applique la règle", () => {
  it("un membre remplace son club par le nouveau, comme simple membre", () => {
    const result = join(BASE, LEILA, "malouf-sfax");
    expect(result).toMatchObject({ ok: true, left: ["les-jasmins"] });
    if (!result.ok) return;
    expect(clubsOf(result.memberships, "u-leila")).toEqual(["malouf-sfax"]);
    expect(result.memberships).toContainEqual({ clubSlug: "malouf-sfax", userId: "u-leila", role: "member" });
  });

  it("un membre sans club se retrouve dans un seul club", () => {
    const result = join(BASE, NOUR, "les-jasmins");
    expect(result).toMatchObject({ ok: true, left: [] });
    if (result.ok) expect(clubsOf(result.memberships, "u-nour")).toEqual(["les-jasmins"]);
  });

  it("un animateur ajoute le club à ses clubs", () => {
    const result = join(BASE, SAMI, "nghanniw");
    expect(result).toMatchObject({ ok: true, left: [] });
    if (result.ok) expect(clubsOf(result.memberships, "u-sami")).toEqual(["les-jasmins", "malouf-sfax", "nghanniw"]);
  });

  it("refuse le départ du dernier animateur et ne change rien", () => {
    const rim = { id: "u-rim", isAnimator: false };
    expect(join(BASE, rim, "les-jasmins")).toEqual({ ok: false, reason: "last-animator", club: "nghanniw" });
  });

  it("refuse de rejoindre deux fois le même club", () => {
    expect(join(BASE, LEILA, "les-jasmins")).toEqual({ ok: false, reason: "already-member" });
  });

  it("ne modifie pas la liste reçue", () => {
    const before = structuredClone(BASE);
    join(BASE, LEILA, "malouf-sfax");
    expect(BASE).toEqual(before);
  });
});

describe("promoteToAnimator", () => {
  it("donne le rôle d'animateur du club à un membre", () => {
    const result = promoteToAnimator(BASE, "les-jasmins", "u-leila");
    expect(result).toContainEqual({ clubSlug: "les-jasmins", userId: "u-leila", role: "animator" });
    expect(result).toHaveLength(BASE.length);
  });

  it("ne touche pas aux adhésions des autres clubs", () => {
    const result = promoteToAnimator(BASE, "malouf-sfax", "u-leila");
    expect(result).toEqual(BASE);
  });
});
