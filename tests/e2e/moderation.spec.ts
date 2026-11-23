import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("signaler une chanson, la retirer en modératrice, puis la rétablir", async ({ page }) => {
  // Un visiteur signale une chanson pour droits d'auteur, avec son adresse.
  await page.goto("/recherche?q=taht+el+yasmina");
  await page.getByRole("link", { name: /Taht el Yasmina/ }).first().click();
  await expect(page).toHaveURL(/\/chanson\/[0-9a-f-]{36}$/);
  const songUrl = page.url();
  await page.getByRole("link", { name: "Signaler", exact: true }).click();
  await page.getByRole("radio", { name: /Droits d'auteur/ }).check({ force: true });
  await page.getByLabel("Détails").fill("Nous représentons les ayants droit de cette chanson.");
  await page.getByLabel("Votre adresse e-mail").fill("ayants-droit@example.com");
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(page.getByRole("status").getByText("Signalement envoyé")).toBeVisible();

  // Rania le traite : retrait doux, avec le motif en note.
  await signIn(page, "rania@example.com", "/moderation/signalements");
  await page.getByRole("link", { name: /Taht el Yasmina/ }).first().click();
  await expect(page).toHaveURL(/\/moderation\/signalements\/[0-9a-f-]{36}$/);
  const reportUrl = page.url();
  await page.getByLabel("Note de traitement").fill("Retrait demandé par les ayants droit.");
  await page.getByRole("button", { name: "Retirer la chanson" }).click();
  await expect(page.getByText("Chanson retirée")).toBeVisible();

  const gone = await page.goto(songUrl);
  expect(gone?.status()).toBe(404);
  await expect(page.getByText("introuvable ou a été retirée")).toBeVisible();

  // Le retrait est réversible : la chanson revient, fiche comprise.
  await page.goto(reportUrl);
  await page.getByRole("button", { name: "Rétablir la chanson" }).click();
  await expect(page.getByText("Chanson rétablie")).toBeVisible();
  const back = await page.goto(songUrl);
  expect(back?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Taht el Yasmina");
});

test("un membre qui n'est pas modérateur ne voit pas la modération", async ({ page }) => {
  await signIn(page, "nour@example.com", "/moderation");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});
