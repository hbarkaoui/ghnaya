import { expect, type Page } from "@playwright/test";

/**
 * Connexion par lien magique, comme un utilisateur : le formulaire, « Vérifiez vos e-mails », puis le lien,
 * ouvert depuis l'aperçu de la boîte locale. Revient à `retour`.
 */
export async function signIn(page: Page, email: string, retour = "/"): Promise<void> {
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
  await expect(page.getByRole("heading", { name: "Vérifiez vos e-mails" })).toBeVisible();
  await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
  await page.waitForURL((url) => `${url.pathname}${url.search}` === retour);
}
