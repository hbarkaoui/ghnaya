import { describe, expect, it } from "vitest";
import { canCreateClub, canModerate } from "@/lib/auth/permissions";
import { userWith } from "./support";

describe("permissions de base", () => {
  it("seuls les modérateurs et les admins modèrent", () => {
    expect(canModerate(null)).toBe(false);
    expect(canModerate(userWith())).toBe(false);
    expect(canModerate(userWith({ globalRole: "moderator" }))).toBe(true);
    expect(canModerate(userWith({ globalRole: "admin" }))).toBe(true);
  });

  it("seuls les animateurs créent un club", () => {
    expect(canCreateClub(null)).toBe(false);
    expect(canCreateClub(userWith())).toBe(false);
    expect(canCreateClub(userWith({ globalRole: "admin" }))).toBe(false);
    expect(canCreateClub(userWith({ isAnimator: true }))).toBe(true);
  });
});
