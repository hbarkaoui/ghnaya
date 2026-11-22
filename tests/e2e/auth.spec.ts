import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("se connecter par lien magique, se déconnecter, et un lien ne sert qu'une fois", async ({ page }) => {
  await page.goto("/connexion?retour=/moi");
  await page.getByLabel("Adresse e-mail").fill("nouvelle@example.com");
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
  const link = await page.getByRole("link", { name: "Ouvrir le lien reçu" }).getAttribute("href");
  await page.goto(link!);
  await expect(page).toHaveURL(/\/moi$/);
  await expect(page.getByRole("heading", { level: 1, name: "nouvelle" })).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto(link!);
  // `filter` : l'annonceur de route de Next.js est aussi un `role="alert"`.
  await expect(page.getByRole("alert").filter({ hasText: "a expiré ou a déjà servi" })).toBeVisible();
});

test("une page réservée renvoie un visiteur à la connexion, puis le ramène", async ({ page }) => {
  await page.goto("/playlists/00000000-0000-4000-8000-000000000000");
  await expect(page).toHaveURL(/\/connexion\?retour=/);
  await signIn(page, "leila@example.com", "/moi");
  await expect(page.getByRole("heading", { level: 1, name: "Leïla" })).toBeVisible();
});
