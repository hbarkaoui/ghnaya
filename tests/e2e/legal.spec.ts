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

const PAGES_AR = [
  { path: "/a-propos/confidentialite", title: "سياسة الخصوصية" },
  { path: "/a-propos/conditions", title: "شروط الاستخدام" },
];

for (const { path, title } of PAGES_AR) {
  test(`${path} s'affiche en arabe, de droite à gauche`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "locale", value: "ar", url: baseURL! }]);
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveTitle(new RegExp(title));
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    // L'adresse de contact garde son ordre de gauche à droite dans la phrase arabe.
    await expect(page.getByRole("link", { name: "ghnaya-support@googlegroups.com" }).first()).toHaveAttribute("dir", "ltr");
  });
}
