import { describe, expect, it } from "vitest";
import { fakeGenerator } from "@/lib/translit/fake";
import { DEFAULT_TRANSLIT_DAILY_LIMIT, translitDailyLimit, translitGenerator } from "@/lib/translit/config";

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe("translitGenerator", () => {
  it("prend le générateur factice quand on le demande", () => {
    expect(translitGenerator(env({ TRANSLIT_PROVIDER: "fake", ANTHROPIC_API_KEY: "sk-test" }))).toBe(fakeGenerator);
  });

  it("appelle le modèle quand une clé est là", () => {
    const generator = translitGenerator(env({ ANTHROPIC_API_KEY: "sk-test", NODE_ENV: "production" }));
    expect(generator).not.toBeNull();
    expect(generator).not.toBe(fakeGenerator);
  });

  it("sans clé : factice hors production, indisponible en production", () => {
    expect(translitGenerator(env({ NODE_ENV: "development" }))).toBe(fakeGenerator);
    expect(translitGenerator(env({ NODE_ENV: "production" }))).toBeNull();
    expect(translitGenerator(env({ TRANSLIT_PROVIDER: "none" }))).toBeNull();
  });

  it("refuse un fournisseur inconnu en le nommant", () => {
    expect(() => translitGenerator(env({ TRANSLIT_PROVIDER: "openai" }))).toThrow("TRANSLIT_PROVIDER");
  });
});

describe("translitDailyLimit", () => {
  it("vaut 300 par défaut, vide compris", () => {
    expect(DEFAULT_TRANSLIT_DAILY_LIMIT).toBe(300);
    expect(translitDailyLimit(env({}))).toBe(300);
    expect(translitDailyLimit(env({ TRANSLIT_DAILY_LIMIT: " " }))).toBe(300);
  });

  it("lit un entier positif ou nul", () => {
    expect(translitDailyLimit(env({ TRANSLIT_DAILY_LIMIT: "50" }))).toBe(50);
    expect(translitDailyLimit(env({ TRANSLIT_DAILY_LIMIT: "0" }))).toBe(0);
  });

  it("refuse une valeur invalide au lieu de l'ignorer", () => {
    for (const value of ["cent", "-1", "1.5", "10 par jour"]) {
      expect(() => translitDailyLimit(env({ TRANSLIT_DAILY_LIMIT: value }))).toThrow("TRANSLIT_DAILY_LIMIT");
    }
  });
});
