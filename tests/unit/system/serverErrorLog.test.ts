import { describe, expect, it } from "vitest";
import { serverErrorLogLine } from "@/lib/system/serverErrorLog";

const at = new Date("2026-11-24T10:00:00.000Z");
const context = { routePath: "/rejoindre/[code]", routeType: "render" };

describe("serverErrorLogLine", () => {
  it("écrit une ligne JSON avec la référence, la route et le message", () => {
    const err = Object.assign(new Error("la base ne répond pas"), { digest: "1234567890" });
    const line = serverErrorLogLine(err, { method: "GET" }, context, at);
    expect(line).not.toContain("\n");
    expect(JSON.parse(line)).toMatchObject({
      level: "error",
      event: "server_error",
      time: "2026-11-24T10:00:00.000Z",
      digest: "1234567890",
      route: "/rejoindre/[code]",
      routeType: "render",
      method: "GET",
      name: "Error",
      message: "la base ne répond pas",
    });
  });

  it("garde cinq lignes de pile au plus", () => {
    const err = new Error("x");
    err.stack = ["Error: x", ...Array.from({ length: 20 }, (_, i) => `    at f${i} (fichier.ts:${i}:1)`)].join("\n");
    const { stack } = JSON.parse(serverErrorLogLine(err, { method: "POST" }, context, at)) as { stack: string[] };
    expect(stack).toHaveLength(5);
    expect(stack[0]).toBe("Error: x");
  });

  it("accepte une valeur qui n'est pas une Error, sans référence", () => {
    const parsed = JSON.parse(serverErrorLogLine("boum", { method: "GET" }, context, at)) as Record<string, unknown>;
    expect(parsed.message).toBe("boum");
    expect(parsed.digest).toBeNull();
    expect(parsed.name).toBeNull();
  });

  it("n'écrit ni chemin réel, ni en-têtes, ni cookies", () => {
    const request = { method: "GET", path: "/rejoindre/ABCDEF1234", headers: { cookie: "session=secret" } };
    const line = serverErrorLogLine(new Error("x"), request, context, at);
    expect(line).not.toContain("ABCDEF1234");
    expect(line).not.toContain("session=secret");
  });
});
