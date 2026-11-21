import { beforeEach, describe, expect, it } from "vitest";
import { MAGIC_LINK_LIMITS, allowMagicLinkRequest } from "@/lib/auth/magicLinkLimit";
import { resetDb } from "./helpers";

describe("allowMagicLinkRequest", () => {
  beforeEach(resetDb);

  it("accepte 5 demandes pour une adresse, puis refuse la 6e", async () => {
    for (let i = 0; i < MAGIC_LINK_LIMITS.perEmail.limit; i += 1) {
      expect(await allowMagicLinkRequest("leila@example.com", `10.0.0.${i}`)).toBe(true);
    }
    expect(await allowMagicLinkRequest("leila@example.com", "10.0.0.99")).toBe(false);
    expect(await allowMagicLinkRequest("sami@example.com", "10.0.0.99")).toBe(true);
  });

  it("refuse au-delà de 20 demandes par IP, quelles que soient les adresses", async () => {
    for (let i = 0; i < MAGIC_LINK_LIMITS.perIp.limit; i += 1) {
      expect(await allowMagicLinkRequest(`p${i}@example.com`, "10.1.1.1")).toBe(true);
    }
    expect(await allowMagicLinkRequest("autre@example.com", "10.1.1.1")).toBe(false);
  });
});
