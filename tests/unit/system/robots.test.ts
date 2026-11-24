import { describe, expect, it } from "vitest";
import { isIndexable, robotsRules } from "@/lib/system/robots";

const env = (values: Record<string, string> = {}) => values as unknown as NodeJS.ProcessEnv;

describe("robotsRules", () => {
  it("interdit tout tant que le site n'est pas ouvert", () => {
    expect(isIndexable(env())).toBe(false);
    expect(robotsRules(env())).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("une fois ouvert, permet le catalogue et garde les espaces privés", () => {
    expect(isIndexable(env({ SITE_INDEXABLE: " true " }))).toBe(true);
    const { rules } = robotsRules(env({ SITE_INDEXABLE: "true" }));
    expect(rules).toMatchObject({ userAgent: "*", allow: "/" });
    const disallow = (rules as { disallow: string[] }).disallow;
    for (const path of ["/api/", "/moderation", "/moi", "/connexion", "/rejoindre/", "/playlists", "/clubs", "/lecture/", "/apercu/"]) {
      expect(disallow).toContain(path);
    }
    expect(disallow).not.toContain("/chanson/");
  });
});
