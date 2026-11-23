import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/ratelimit/clientIp";

const env = (hops?: string): NodeJS.ProcessEnv => ({ NODE_ENV: "test", TRUSTED_PROXY_HOPS: hops });
const xff = (value: string) => new Headers({ "x-forwarded-for": value });

describe("clientIp", () => {
  it("prend la première adresse de x-forwarded-for, réécrit par le proxy de bord (Vercel)", () => {
    expect(clientIp(xff("203.0.113.5, 10.0.0.1"), env())).toBe("203.0.113.5");
    expect(clientIp(xff("203.0.113.5, 10.0.0.1"), env("0"))).toBe("203.0.113.5");
  });
  it("se replie sur x-real-ip puis sur unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.7" }), env())).toBe("198.51.100.7");
    expect(clientIp(new Headers(), env())).toBe("unknown");
  });
  it("derrière des proxies qui ajoutent à l'en-tête, compte TRUSTED_PROXY_HOPS adresses depuis la droite", () => {
    // Le client a posé « 1.2.3.4 » lui-même ; le proxy de confiance a ajouté l'adresse qu'il a vue.
    expect(clientIp(xff("1.2.3.4, 203.0.113.5"), env("1"))).toBe("203.0.113.5");
    expect(clientIp(xff("1.2.3.4, 203.0.113.5, 10.0.0.1"), env("2"))).toBe("203.0.113.5");
    expect(clientIp(xff("203.0.113.5"), env("2"))).toBe("203.0.113.5");
  });
  it("ignore les segments vides et prend la première adresse si l'en-tête en a moins que de proxies", () => {
    expect(clientIp(xff("1.2.3.4, , 203.0.113.5"), env("1"))).toBe("203.0.113.5");
    expect(clientIp(xff("a, b"), env("5"))).toBe("a");
  });
  it("refuse une valeur de TRUSTED_PROXY_HOPS qui n'est pas un entier positif ou nul", () => {
    for (const value of ["one", "1 proxy", "-1", "1.0"]) {
      expect(() => clientIp(xff("203.0.113.5, 10.0.0.1"), env(value))).toThrow(/TRUSTED_PROXY_HOPS/);
      expect(() => clientIp(new Headers(), env(value))).toThrow(/TRUSTED_PROXY_HOPS/);
    }
    expect(clientIp(xff("203.0.113.5, 10.0.0.1"), env(""))).toBe("203.0.113.5");
  });
});
