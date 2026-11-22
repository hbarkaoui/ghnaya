import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("rejoindre un club par son lien d'invitation (spec §13, parcours c)", async ({ page }) => {
  await page.goto("/rejoindre/nghw5ntz7a");
  await expect(page.getByRole("heading", { level: 1, name: "Nghanniw" })).toBeVisible();
  await page.getByRole("link", { name: "Se connecter pour rejoindre" }).click();

  await page.getByLabel("Adresse e-mail").fill("nour@example.com");
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
  await expect(page).toHaveURL(/\/rejoindre\/nghw5ntz7a$/);

  await page.getByRole("button", { name: "Rejoindre" }).click();
  // `StatusNotice` retire `?statut=rejoint` de l'adresse une fois le message affiché : on vérifie le message.
  await expect(page).toHaveURL(/\/clubs\/nghanniw(\?statut=rejoint)?$/);
  await expect(page.getByRole("status").filter({ hasText: /Vous avez rejoint .*Nghanniw/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Nghanniw" })).toBeVisible();
});

test("un membre qui change de club doit confirmer, et quitte le premier", async ({ page }) => {
  await signIn(page, "leila@example.com", "/rejoindre/h4ttzr8wpc");
  await expect(page.getByText(/Rejoindre .*Malouf Sfax.* vous fera quitter .*Les Jasmins/)).toBeVisible();
  await page.getByRole("button", { name: "Changer de club" }).click();
  await expect(page).toHaveURL(/\/clubs\/malouf-sfax(\?statut=rejoint)?$/);
  await expect(page.getByRole("status").filter({ hasText: /Vous avez rejoint .*Malouf Sfax/ })).toBeVisible();

  // Leïla n'est plus membre des Jasmins : le club lui est caché (clubs.notFound.title).
  await page.goto("/clubs/les-jasmins");
  await expect(page.getByRole("heading", { name: "Ce club est introuvable" })).toBeVisible();
});
