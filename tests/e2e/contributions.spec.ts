import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("proposer une chanson, la faire approuver par une modératrice, puis la retrouver (spec §13, parcours b)", async ({ page }) => {
  // Leïla propose une chanson, avec un artiste connu choisi dans la liste.
  await signIn(page, "leila@example.com", "/contribuer");
  await page.getByLabel("Titre en lettres latines").fill("Lamma Bada Yatathanna");
  await page.getByRole("combobox", { name: "Artiste 1" }).fill("hedi jou");
  await page.getByRole("option", { name: /Hedi Jouini/ }).click();
  await page.getByLabel("Paroles", { exact: true }).fill("يا نسيم الليل سلّم\nعلى الحبايب في الدار");
  await page.getByLabel("Dialecte").selectOption({ label: "Maghreb" });
  await page.getByRole("checkbox", { name: /domaine public/ }).check();
  await page.getByRole("button", { name: "Envoyer la proposition" }).click();
  await expect(page).toHaveURL(/\/mes-contributions/); // la page retire ensuite ?envoyee= de l'adresse
  await expect(page.getByText("votre proposition sera relue")).toBeVisible();
  await expect(page.getByText("En attente").first()).toBeVisible();

  // Rania la relit et l'approuve.
  await page.context().clearCookies();
  await signIn(page, "rania@example.com", "/moderation");
  // La démo contient déjà une proposition du même titre : la nouvelle est la dernière de la file (la plus ancienne en tête).
  await page.getByRole("link", { name: /Lamma Bada Yatathanna/ }).last().click();
  await expect(page.getByText("يا نسيم الليل سلّم")).toBeVisible();
  await page.getByRole("button", { name: "Approuver" }).click();
  await expect(page.getByText("Proposition approuvée")).toBeVisible();

  // La chanson est publiée : cherchable, lisible, avec sa source.
  await page.goto(`/recherche?q=${encodeURIComponent("Lamma Bada Yatathanna")}`);
  await page.getByRole("link", { name: /Lamma Bada Yatathanna/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lamma Bada Yatathanna");
  await expect(page.getByTestId("lyrics")).toContainText("يا نسيم الليل سلّم");
  await expect(page.getByText("Proposition", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hedi Jouini" })).toBeVisible();
});
