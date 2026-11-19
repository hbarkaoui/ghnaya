import { describe, expect, it } from "vitest";
import { DEMO_SESSIONS, clubPlaylistsFor, demoUserFor } from "@/mocks/session";

describe("sessions de démonstration et règle des clubs", () => {
  it("un utilisateur qui n'est pas animateur appartient à un club au plus", () => {
    for (const session of DEMO_SESSIONS) {
      const user = demoUserFor(session);
      if (user && !user.isAnimator) expect(user.clubSlugs.length).toBeLessThanOrEqual(1);
    }
  });

  it("le membre n'a qu'un club, dont il voit les playlists", () => {
    const member = demoUserFor("member");
    expect(member?.isAnimator).toBe(false);
    expect(member?.clubSlugs).toEqual(["les-jasmins"]);
    expect(member && clubPlaylistsFor(member).every((p) => p.club?.slug === "les-jasmins")).toBe(true);
  });

  it("l'animateur anime plusieurs clubs", () => {
    const animator = demoUserFor("animator");
    expect(animator?.isAnimator).toBe(true);
    expect(animator?.clubSlugs.length).toBeGreaterThan(1);
  });
});
