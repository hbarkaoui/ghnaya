import { describe, expect, it } from "vitest";
import { signInErrorKey } from "@/lib/auth/signInError";

describe("signInErrorKey", () => {
  it("rien : pas d'erreur", () => {
    expect(signInErrorKey(undefined)).toBeNull();
    expect(signInErrorKey("")).toBeNull();
    expect(signInErrorKey([])).toBeNull();
  });
  it("INVALID_TOKEN : lien invalide, seul ou parmi d'autres", () => {
    expect(signInErrorKey("INVALID_TOKEN")).toBe("linkInvalid");
    expect(signInErrorKey(["google", "INVALID_TOKEN"])).toBe("linkInvalid");
  });
  it("toute autre valeur : Google, en chaîne ou en tableau", () => {
    expect(signInErrorKey("google")).toBe("google");
    expect(signInErrorKey("access_denied")).toBe("google");
    expect(signInErrorKey(["google", "access_denied"])).toBe("google");
  });
});
