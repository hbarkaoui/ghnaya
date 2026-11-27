import { describe, expect, it } from "vitest";
import { cronAuthorization } from "@/lib/retention/cronAuth";

const SECRET = "s".repeat(32);

describe("cronAuthorization", () => {
  it("accepte l'en-tête que Vercel envoie avec le bon secret", () => {
    expect(cronAuthorization(`Bearer ${SECRET}`, SECRET)).toBe("ok");
  });

  it("refuse un en-tête absent, mal formé ou un autre secret", () => {
    expect(cronAuthorization(null, SECRET)).toBe("denied");
    expect(cronAuthorization(SECRET, SECRET)).toBe("denied");
    expect(cronAuthorization(`Bearer ${"t".repeat(32)}`, SECRET)).toBe("denied");
    expect(cronAuthorization(`Bearer ${SECRET}x`, SECRET)).toBe("denied");
  });

  it("refuse de tourner sans secret, ou avec un secret trop court", () => {
    expect(cronAuthorization("Bearer ", undefined)).toBe("unconfigured");
    expect(cronAuthorization("Bearer court", "court")).toBe("unconfigured");
  });
});
