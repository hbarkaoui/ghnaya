import { describe, expect, it } from "vitest";
import { securityHeaders } from "@/lib/system/securityHeaders";

const env = (values: Record<string, string> = {}) => values as unknown as NodeJS.ProcessEnv;
const headersOf = (e: NodeJS.ProcessEnv) => {
  const rules = securityHeaders(e);
  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");
  return Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]));
};

describe("securityHeaders", () => {
  it("pose les protections de base partout", () => {
    const h = headersOf(env());
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Content-Security-Policy"]).toBe("frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  });

  it("laisse le verrou d'écran au lecteur", () => {
    expect(headersOf(env())["Permissions-Policy"]).not.toContain("screen-wake-lock");
  });

  it("ferme l'indexation sauf si SITE_INDEXABLE=true", () => {
    expect(headersOf(env())["X-Robots-Tag"]).toBe("noindex, nofollow");
    expect(headersOf(env({ SITE_INDEXABLE: "oui" }))["X-Robots-Tag"]).toBe("noindex, nofollow");
    expect(headersOf(env({ SITE_INDEXABLE: "true" }))["X-Robots-Tag"]).toBeUndefined();
  });

  it("n'impose HTTPS que sur la production Vercel", () => {
    expect(headersOf(env())["Strict-Transport-Security"]).toBeUndefined();
    expect(headersOf(env({ VERCEL_ENV: "preview" }))["Strict-Transport-Security"]).toBeUndefined();
    expect(headersOf(env({ VERCEL_ENV: "production" }))["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains");
  });
});
