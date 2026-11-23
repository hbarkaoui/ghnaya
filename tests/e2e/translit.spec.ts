import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

/** Ouvre la fiche d'une chanson du jeu de test depuis la recherche. */
async function openSong(page: import("@playwright/test").Page, query: string, name: RegExp) {
  await page.goto(`/recherche?q=${encodeURIComponent(query)}`);
  await page.getByRole("link", { name }).first().click();
  await expect(page.getByTestId("lyrics")).toBeVisible();
}

test("un visiteur est invité à se connecter pour obtenir la translittération (spec §7)", async ({ page }) => {
  await openSong(page, "انت عمري", /انت عمري/);
  await page.locator("label", { hasText: "Arabe + latin" }).click();
  await expect(page.getByText("Connectez-vous pour obtenir la translittération")).toBeVisible();
  await expect(page.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", /^\/connexion\?retour=\/chanson\//);
  // L'arabe reste affiché.
  await expect(page.getByTestId("lyrics")).toContainText("رجعت أغنّي من تاني");
});

test("un membre obtient une translittération automatique, gardée pour les visites suivantes (spec §7)", async ({ page }) => {
  await signIn(page, "leila@example.com", "/");
  await openSong(page, "Ana Wel 3azab", /Ana Wel 3azab/);
  await page.locator("label", { hasText: "Arabe + latin" }).click();
  await expect(page.getByText("Translittération automatique, peut contenir des erreurs")).toBeVisible();
  // Générateur factice : « الليل والذكريات » devient « allil oualdhkriat ».
  await expect(page.locator('[lang="ar-Latn"]').first()).toContainText("allil oualdhkriat");

  // Enregistrée en base : un visiteur la voit aussi, sans invitation à se connecter.
  await page.context().clearCookies();
  await page.reload();
  await expect(page.getByText("Translittération automatique, peut contenir des erreurs")).toBeVisible();
  await expect(page.getByText("Connectez-vous pour obtenir la translittération")).toHaveCount(0);
});
