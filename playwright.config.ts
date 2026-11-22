// Plan 1, tâche 14 : parcours de bout en bout sur écran de téléphone, contre un build de production
// servi sur le port 3100 avec la base de test (vidée puis remplie par tests/e2e/globalSetup.ts).
import { defineConfig, devices } from "@playwright/test";

const DATABASE_URL = process.env.DATABASE_URL_TEST ?? "postgres://ghanni:ghanni@localhost:5433/ghanni_test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  globalSetup: "./tests/e2e/globalSetup.ts",
  use: { baseURL: "http://localhost:3100", trace: "on-first-retry" },
  projects: [{ name: "mobile", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "pnpm build && pnpm start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_URL,
      BETTER_AUTH_SECRET: "secret-de-bout-en-bout-0123456789abcdef",
      BETTER_AUTH_URL: "http://localhost:3100",
      MAIL_TRANSPORT: "outbox",
      OUTBOX_DIR: ".outbox-e2e",
      // Les parcours ouvrent plus de 5 liens par minute depuis la même adresse.
      BETTER_AUTH_RATE_LIMIT: "off",
    },
  },
});
