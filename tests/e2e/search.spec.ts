// Plan 1, tâche 14 (adaptée à l'interface construite) : parcours sur un écran de téléphone (Pixel 7),
// contre la base de test remplie avec le catalogue fictif.
import { expect, test } from "@playwright/test";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

test("chercher en arabizi depuis l'accueil, ouvrir la chanson, puis l'artiste", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("sidi mansur");
  await page.getByRole("button", { name: "Chercher", exact: true }).click();
  await expect(page).toHaveURL(/\/recherche\?q=sidi\+mansur/);

  // La chanson vient de la base : son adresse porte un UUID, pas l'identifiant fictif.
  await page.getByRole("link", { name: /Sidi Mansour/ }).click();
  await expect(page).toHaveURL(new RegExp(`/chanson/${UUID}$`));
  const title = page.getByRole("heading", { level: 1 });
  await expect(title).toContainText("سيدي منصور");
  await expect(title).toContainText("Sidi Mansour");
  const lyrics = page.getByTestId("lyrics");
  await expect(lyrics).toHaveAttribute("dir", "rtl");
  await expect(lyrics).toContainText("خلّي الغناية تكمّل");

  await page.getByRole("link", { name: "Saber Rebai" }).click();
  await expect(page).toHaveURL(new RegExp(`/artiste/${UUID}$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("صابر الرباعي");
  await expect(page.getByRole("link", { name: /على نار/ })).toBeVisible();
});

test("chercher un passage des paroles affiche l'extrait, passage surligné", async ({ page }) => {
  await page.goto("/recherche?q=" + encodeURIComponent("يستجيب القدر"));
  await expect(page.getByText("Dans les paroles :")).toBeAttached();
  await expect(page.locator("mark", { hasText: "يستجيب القدر" })).toBeVisible();
});

test("une requête trop courte est expliquée", async ({ page }) => {
  await page.goto("/recherche?q=a");
  await expect(page.getByText("Tapez au moins 2 lettres pour lancer la recherche.")).toBeVisible();
});

test("basculer en arabe met l'interface de droite à gauche", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "ابحث" })).toBeVisible();
  await page.getByRole("button", { name: "Français" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("une chanson inconnue renvoie 404 avec un message clair", async ({ page }) => {
  const res = await page.goto("/chanson/6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("introuvable ou a été retirée")).toBeVisible();
});

test("une chanson trouvée en base s'ajoute à une playlist et se lit dans le lecteur", async ({ page }) => {
  await page.goto("/recherche?q=habaytak");
  await page.getByRole("button", { name: /Ajouter .*Habaytak Bel Saif.* à une playlist/ }).click();
  await page.getByRole("button", { name: /À apprendre/ }).click();
  // \s : le message français met une espace insécable dans les guillemets (« … »).
  await expect(page.getByText(/Ajoutée à «\s.*À apprendre.*\s»/)).toBeVisible();

  // « À apprendre » compte 3 chansons fictives : celle de la base devient la 4e du lecteur.
  await page.goto("/playlists/a-apprendre");
  await expect(page.getByText("Personnelle · 4 chansons")).toBeVisible();
  await page.locator('a[href="/lecture/a-apprendre/4"]').click();
  await expect(page).toHaveURL(/\/lecture\/a-apprendre\/4$/);
  await expect(page.getByText("4 / 4")).toBeVisible();
  await expect(page.getByTestId("lyrics")).toContainText("على البحر كنا نغنّي");
});
