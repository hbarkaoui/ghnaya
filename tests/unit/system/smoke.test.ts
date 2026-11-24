import { describe, expect, it } from "vitest";
import { runSmoke, type Fetcher } from "@/lib/system/smoke";

const SECURE = { "x-content-type-options": "nosniff", "x-frame-options": "DENY", "x-robots-tag": "noindex, nofollow" };
const HSTS = { "strict-transport-security": "max-age=63072000; includeSubDomains" };

/** Un site en bonne santé ; `overrides` remplace la réponse d'un chemin. */
function site(overrides: Record<string, () => Response> = {}, headers: Record<string, string> = SECURE): Fetcher {
  const routes: Record<string, () => Response> = {
    "/api/sante": () => Response.json({ status: "ok" }),
    "/": () => new Response('<!DOCTYPE html><html lang="fr" dir="ltr">…', { headers }),
    "/recherche?q=sidi%20mansour": () => new Response('<a href="/chanson/0b6f…">Sidi Mansour</a>'),
    "/chanson/00000000-0000-4000-8000-000000000000": () => new Response("introuvable", { status: 404 }),
    "/manifest.webmanifest": () => Response.json({ name: "Ghnaya" }),
    "/robots.txt": () => new Response("User-Agent: *\nDisallow: /\n"),
    ...overrides,
  };
  return async (url) => {
    const { pathname, search } = new URL(url);
    const route = routes[pathname + search];
    return route ? route() : new Response("?", { status: 404 });
  };
}

const failed = (checks: { name: string; ok: boolean }[]) => checks.filter((c) => !c.ok).map((c) => c.name);

describe("runSmoke", () => {
  it("passe sur un site en bonne santé, en local sans HSTS", async () => {
    const checks = await runSmoke("http://localhost:3200", { fetch: site() });
    expect(checks.map((c) => c.name)).toEqual(["santé", "accueil", "en-têtes", "recherche", "introuvable", "manifeste", "robots"]);
    expect(failed(checks)).toEqual([]);
  });

  it("exige HSTS sur un domaine en https, pas sur une prévisualisation vercel.app", async () => {
    expect(failed(await runSmoke("https://ghnaya.example", { fetch: site() }))).toEqual(["en-têtes"]);
    expect(failed(await runSmoke("https://ghnaya.example", { fetch: site({}, { ...SECURE, ...HSTS }) }))).toEqual([]);
    expect(failed(await runSmoke("https://ghnaya-git-main-x.vercel.app", { fetch: site() }))).toEqual([]);
  });

  it("signale des migrations en attente", async () => {
    const fetch = site({ "/api/sante": () => Response.json({ status: "migrations_pending" }, { status: 503 }) });
    const checks = await runSmoke("http://localhost:3200", { fetch });
    expect(failed(checks)).toEqual(["santé"]);
    expect(checks[0].detail).toContain("migrations_pending");
  });

  it("signale une recherche sans résultat, avec la requête choisie", async () => {
    const fetch = site({ "/recherche?q=fairuz": () => new Response("<p>Aucun résultat</p>") });
    expect(failed(await runSmoke("http://localhost:3200", { fetch, query: "fairuz" }))).toEqual(["recherche"]);
  });

  it("signale une chanson inconnue qui ne répond pas 404", async () => {
    const fetch = site({ "/chanson/00000000-0000-4000-8000-000000000000": () => new Response("oups", { status: 500 }) });
    expect(failed(await runSmoke("http://localhost:3200", { fetch }))).toEqual(["introuvable"]);
  });

  it("continue après une erreur réseau", async () => {
    const healthy = site();
    const fetch: Fetcher = async (url, init) => {
      if (url.endsWith("/manifest.webmanifest")) throw new TypeError("fetch failed");
      return healthy(url, init);
    };
    const checks = await runSmoke("http://localhost:3200/", { fetch });
    expect(failed(checks)).toEqual(["manifeste"]);
    expect(checks.find((c) => c.name === "manifeste")?.detail).toContain("fetch failed");
  });

  it("signale un site ouvert aux moteurs sans --indexable, et l'inverse avec", async () => {
    const open = { ...SECURE, "x-robots-tag": "index, follow" };
    const openSite = site({ "/robots.txt": () => new Response("User-Agent: *\nAllow: /\nDisallow: /moi\n") }, open);
    expect(failed(await runSmoke("http://localhost:3200", { fetch: openSite }))).toEqual(["en-têtes", "robots"]);
    expect(failed(await runSmoke("http://localhost:3200", { fetch: openSite, indexable: true }))).toEqual([]);
    expect(failed(await runSmoke("http://localhost:3200", { fetch: site(), indexable: true }))).toEqual(["en-têtes", "robots"]);
  });

  it("donne un délai de 30 s à chaque requête", async () => {
    const healthy = site();
    const signals: (AbortSignal | null | undefined)[] = [];
    const fetch: Fetcher = async (url, init) => {
      signals.push(init?.signal);
      return healthy(url, init);
    };
    await runSmoke("http://localhost:3200", { fetch });
    expect(signals).toHaveLength(7);
    expect(signals.every((s) => s instanceof AbortSignal)).toBe(true);
  });
});
