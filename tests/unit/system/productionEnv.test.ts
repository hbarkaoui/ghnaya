import { describe, expect, it } from "vitest";
import { assertProductionEnv, EXAMPLE_AUTH_SECRET, productionEnvProblems } from "@/lib/system/productionEnv";

/** Une configuration de production complète et valide, que chaque test abîme d'un point. */
const valid = (overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv =>
  ({
    NODE_ENV: "production",
    DATABASE_URL: "postgres://u:p@ep-exemple-pooler.eu-central-1.aws.neon.tech/ghanni?sslmode=require",
    BETTER_AUTH_SECRET: "x".repeat(44),
    BETTER_AUTH_URL: "https://ghnaya.example",
    SMTP_URL: "smtps://u:p@smtp.example:465",
    MAIL_FROM: "Ghnaya <connexion@ghnaya.example>",
    ANTHROPIC_API_KEY: "sk-ant-test",
    ...overrides,
  }) as unknown as NodeJS.ProcessEnv;

describe("productionEnvProblems", () => {
  it("accepte une configuration complète", () => {
    expect(productionEnvProblems(valid())).toEqual([]);
  });

  it("ne vérifie rien hors production", () => {
    expect(productionEnvProblems({ NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv)).toEqual([]);
  });

  it("accepte le build des tests de bout en bout (localhost, boîte locale, générateur factice)", () => {
    const e2e = valid({
      BETTER_AUTH_URL: "http://localhost:3100",
      MAIL_TRANSPORT: "outbox",
      SMTP_URL: undefined,
      MAIL_FROM: undefined,
      TRANSLIT_PROVIDER: "fake",
      ANTHROPIC_API_KEY: undefined,
    });
    expect(productionEnvProblems(e2e)).toEqual([]);
  });

  it("exige DATABASE_URL", () => {
    expect(productionEnvProblems(valid({ DATABASE_URL: " " }))).toEqual([expect.stringMatching(/^DATABASE_URL/)]);
  });

  it("refuse un secret absent, court ou recopié de l'exemple", () => {
    for (const secret of [undefined, "court", EXAMPLE_AUTH_SECRET]) {
      expect(productionEnvProblems(valid({ BETTER_AUTH_SECRET: secret }))).toEqual([expect.stringMatching(/^BETTER_AUTH_SECRET/)]);
    }
  });

  it("exige une BETTER_AUTH_URL en https hors de localhost", () => {
    expect(productionEnvProblems(valid({ BETTER_AUTH_URL: undefined }))).toEqual([expect.stringMatching(/^BETTER_AUTH_URL manque/)]);
    expect(productionEnvProblems(valid({ BETTER_AUTH_URL: "pas une adresse" }))).toEqual([expect.stringMatching(/^BETTER_AUTH_URL invalide/)]);
    expect(productionEnvProblems(valid({ BETTER_AUTH_URL: "http://ghnaya.example" }))).toEqual([expect.stringMatching(/https/)]);
  });

  it("exige SMTP_URL et MAIL_FROM pour envoyer les liens", () => {
    expect(productionEnvProblems(valid({ SMTP_URL: undefined }))).toEqual([expect.stringMatching(/SMTP_URL et MAIL_FROM/)]);
    expect(productionEnvProblems(valid({ MAIL_FROM: "" }))).toEqual([expect.stringMatching(/SMTP_URL et MAIL_FROM/)]);
  });

  it("refuse la boîte locale et le générateur factice hors de localhost", () => {
    expect(productionEnvProblems(valid({ MAIL_TRANSPORT: "outbox" }))).toEqual([expect.stringMatching(/MAIL_TRANSPORT=outbox/)]);
    expect(productionEnvProblems(valid({ TRANSLIT_PROVIDER: "fake" }))).toEqual([expect.stringMatching(/TRANSLIT_PROVIDER=fake/)]);
  });

  it("exige la clé quand Claude est demandé, et nomme les valeurs invalides", () => {
    expect(productionEnvProblems(valid({ TRANSLIT_PROVIDER: "anthropic", ANTHROPIC_API_KEY: undefined }))).toEqual([
      expect.stringMatching(/ANTHROPIC_API_KEY/),
    ]);
    expect(productionEnvProblems(valid({ TRANSLIT_PROVIDER: "openai" }))).toEqual([expect.stringMatching(/TRANSLIT_PROVIDER invalide/)]);
    expect(productionEnvProblems(valid({ TRANSLIT_DAILY_LIMIT: "beaucoup" }))).toEqual([expect.stringMatching(/TRANSLIT_DAILY_LIMIT/)]);
    expect(productionEnvProblems(valid({ TRUSTED_PROXY_HOPS: "one" }))).toEqual([expect.stringMatching(/TRUSTED_PROXY_HOPS/)]);
  });

  it("accepte la production sans translittération (aucune clé, aucun fournisseur)", () => {
    expect(productionEnvProblems(valid({ ANTHROPIC_API_KEY: undefined }))).toEqual([]);
  });

  it("veut les deux identifiants Google, ou aucun", () => {
    expect(productionEnvProblems(valid({ GOOGLE_CLIENT_ID: "id" }))).toEqual([expect.stringMatching(/GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET/)]);
    expect(productionEnvProblems(valid({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" }))).toEqual([]);
  });

  it("liste tous les problèmes à la fois", () => {
    expect(productionEnvProblems(valid({ DATABASE_URL: undefined, BETTER_AUTH_SECRET: undefined }))).toHaveLength(2);
  });
});

describe("assertProductionEnv", () => {
  it("lève une erreur qui liste les problèmes, sans valeur secrète", () => {
    expect(() => assertProductionEnv(valid({ DATABASE_URL: undefined, BETTER_AUTH_SECRET: "court" }))).toThrow(
      /Configuration de production invalide :\n- DATABASE_URL[^]*\n- BETTER_AUTH_SECRET/,
    );
    try {
      assertProductionEnv(valid({ BETTER_AUTH_SECRET: "court" }));
    } catch (e) {
      expect(String(e)).not.toContain("court");
    }
  });
  it("ne dit rien d'une configuration valide", () => {
    expect(() => assertProductionEnv(valid())).not.toThrow();
  });
});
