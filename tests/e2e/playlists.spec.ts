import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("ajouter une chanson à une playlist de club, ouvrir le lecteur et naviguer (spec §13, parcours a)", async ({ page }) => {
  await signIn(page, "sami@example.com", "/recherche?q=habaytak");
  await page.getByRole("button", { name: /Ajouter .*Habaytak Bel Saif.* à une playlist/ }).click();
  await page.getByRole("button", { name: /Classiques égyptiens/ }).click();
  await expect(page.getByText(/Ajoutée à «\s.*Classiques égyptiens.*\s»/)).toBeVisible();

  await page.goto("/clubs/malouf-sfax");
  await page.getByRole("link", { name: /Classiques égyptiens/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Classiques égyptiens" })).toBeVisible();
  // \s : le nombre et « chansons » sont séparés par une espace insécable (playlists.songCount).
  await expect(page.getByText(/Malouf Sfax · 5\schansons/)).toBeVisible();
  await page.getByRole("link", { name: /Habaytak/ }).click();
  await expect(page.getByText("5 / 5")).toBeVisible();
  await expect(page.getByTestId("lyrics")).toContainText("على البحر كنا نغنّي");

  await page.getByRole("button", { name: "Chanson précédente" }).click();
  await expect(page.getByText("4 / 5")).toBeVisible();
});

test("un membre lit la playlist de son club et la copie dans ses playlists", async ({ page }) => {
  await signIn(page, "rania@example.com", "/");
  await page.getByRole("link", { name: /Séance du jeudi/ }).first().click();
  await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);
  await page.getByRole("button", { name: "Copier dans mes playlists" }).click();
  // Attendre la fin de la copie avant de quitter la page (playlistPage.copied).
  await expect(page.getByText("Copiée dans vos playlists.")).toBeVisible();
  await page.goto("/playlists");
  await expect(page.getByRole("link", { name: "Séance du jeudi", exact: true })).toBeVisible();
});
