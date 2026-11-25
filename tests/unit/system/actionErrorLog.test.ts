import { describe, expect, it } from "vitest";
import { actionErrorLogLine } from "@/lib/system/serverErrorLog";

const NOW = new Date("2026-11-25T10:00:00.000Z");

describe("actionErrorLogLine", () => {
  it("ne reprend ni le message ni les paramètres d'une requête échouée", () => {
    const cause = Object.assign(new Error("duplicate key"), { code: "23505" });
    const err = Object.assign(new Error("Failed query: insert into verification values ($1)\nparams: lina@example.com"), {
      query: "insert into verification values ($1)",
      params: ["lina@example.com"],
      cause,
    });
    const line = actionErrorLogLine("requestMagicLink", err, NOW);
    expect(line).not.toContain("lina@example.com");
    expect(line).not.toContain("Failed query");
    expect(JSON.parse(line)).toEqual({
      level: "error",
      event: "action_error",
      time: "2026-11-25T10:00:00.000Z",
      action: "requestMagicLink",
      name: "Error",
      code: "23505",
      causeName: "Error",
    });
  });

  it("ne reprend pas le message d'une erreur d'envoi, qui peut citer le destinataire", () => {
    const err = Object.assign(new Error("Can't send mail - all recipients were rejected: 550 <lina@example.com>"), { code: "EENVELOPE" });
    const line = actionErrorLogLine("requestMagicLink", err, NOW);
    expect(line).not.toContain("lina@example.com");
    expect(JSON.parse(line)).toMatchObject({ action: "requestMagicLink", code: "EENVELOPE" });
  });

  it("accepte une valeur qui n'est pas une Error", () => {
    expect(JSON.parse(actionErrorLogLine("continueWithGoogle", "boom", NOW))).toMatchObject({
      action: "continueWithGoogle",
      name: null,
      code: null,
    });
  });
});
