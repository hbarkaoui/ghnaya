import { describe, expect, it } from "vitest";
import { DEMO_LATENCY_MAX_MS, parseDemoLatency } from "@/mocks/demoPreviews";

describe("parseDemoLatency", () => {
  it("lit un délai en millisecondes", () => {
    expect(parseDemoLatency("1500", false)).toBe(1500);
  });

  it("vaut 0 sans cookie ou avec une valeur illisible", () => {
    expect(parseDemoLatency(undefined, false)).toBe(0);
    expect(parseDemoLatency("", false)).toBe(0);
    expect(parseDemoLatency("lent", false)).toBe(0);
    expect(parseDemoLatency("-200", false)).toBe(0);
  });

  it("borne le délai pour ne jamais bloquer une page", () => {
    expect(parseDemoLatency("999999", false)).toBe(DEMO_LATENCY_MAX_MS);
  });

  it("est toujours nul en production", () => {
    expect(parseDemoLatency("1500", true)).toBe(0);
  });
});
