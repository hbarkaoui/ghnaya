import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "@/lib/db/errors";

describe("isUniqueViolation", () => {
  it("reconnaît le code 23505, directement ou dans la cause (erreur Drizzle)", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ message: "Failed query", cause: { code: "23505" } })).toBe(true);
  });

  it("ignore les autres erreurs", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
