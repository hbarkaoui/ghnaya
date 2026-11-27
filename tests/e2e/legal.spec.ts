// Plan 5, tâche 8 : pages juridiques publiques, demandées par Google pour publier la connexion Google.
import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/a-propos/confidentialite", title: "Politique de confidentialité" },
  { path: "/a-propos/conditions", title: "Conditions d'utilisation" },
];

for (const { path, title } of PAGES) {
  test(`${path} s'ouvre sans compte, avec son titre et ses points à valider`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    // Tant que la relecture juridique n'est pas faite, les points ouverts restent visibles.
    expect(await page.locator("[data-a-valider]").count()).toBeGreaterThan(0);
  });
}

test("Moi mène aux deux pages, pour un visiteur", async ({ page }) => {
  await page.goto("/moi");
  await page.getByRole("link", { name: "Politique de confidentialité" }).click();
  await expect(page).toHaveURL(/\/a-propos\/confidentialite$/);
  await page.goto("/moi");
  await page.getByRole("link", { name: "Conditions d'utilisation" }).click();
  await expect(page).toHaveURL(/\/a-propos\/conditions$/);
});

test("la connexion annonce l'acceptation des conditions, avec les deux liens", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("link", { name: "conditions d'utilisation" }).click();
  await expect(page).toHaveURL(/\/a-propos\/conditions$/);
  await page.goto("/connexion");
  await page.getByRole("link", { name: "politique de confidentialité" }).click();
  await expect(page).toHaveURL(/\/a-propos\/confidentialite$/);
});
