// Plan 5, tâche 4 : en-têtes de sécurité et indexation fermée, sur le build de production.
import { expect, test } from "@playwright/test";

test("l'accueil porte les en-têtes de sécurité et n'est pas indexable", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
  expect(headers["permissions-policy"]).not.toContain("screen-wake-lock");
});

test("robots.txt interdit tout tant que le site n'est pas ouvert", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/Disallow: \/\s*$/m);
});
