// Plan 5, tâche 6 : vérifier un déploiement de l'extérieur (pnpm smoke). Pur : le fetch est fourni.
// Pas de `server-only` : un script le lit.
export interface SmokeCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

const MISSING_SONG = "00000000-0000-4000-8000-000000000000";

interface Step {
  name: string;
  path: string;
  verify: (response: Response, body: string, base: URL) => string | null;
}

const expectStatus = (response: Response, status: number) =>
  response.status === status ? null : `statut ${response.status}, attendu ${status}`;

function steps(query: string, indexable: boolean): Step[] {
  return [
    {
      name: "santé",
      path: "/api/sante",
      verify: (r, body) => (r.status === 200 && body.includes('"status":"ok"') ? null : `statut ${r.status} : ${body.slice(0, 200)}`),
    },
    {
      name: "accueil",
      path: "/",
      verify: (r, body) => expectStatus(r, 200) ?? (body.includes("<html lang=") ? null : "pas de <html lang=…>"),
    },
    {
      name: "en-têtes",
      path: "/",
      verify: (r, _body, base) => {
        const missing: string[] = [];
        if (r.headers.get("x-content-type-options") !== "nosniff") missing.push("x-content-type-options");
        if (r.headers.get("x-frame-options") !== "DENY") missing.push("x-frame-options");
        const preview = base.hostname.endsWith(".vercel.app");
        if (base.protocol === "https:" && !preview && !r.headers.get("strict-transport-security")) {
          missing.push("strict-transport-security");
        }
        if (missing.length > 0) return `manquants : ${missing.join(", ")}`;
        const noindex = /noindex/i.test(r.headers.get("x-robots-tag") ?? "");
        if (indexable && noindex) return "x-robots-tag noindex sur /, alors que le site doit être indexable";
        if (!indexable && !noindex) return "pas de x-robots-tag noindex sur / : le site est ouvert aux moteurs (SITE_INDEXABLE ?)";
        return null;
      },
    },
    {
      name: "recherche",
      path: `/recherche?q=${encodeURIComponent(query)}`,
      verify: (r, body) =>
        expectStatus(r, 200) ?? (body.includes('href="/chanson/') ? null : `aucun résultat pour « ${query} »`),
    },
    { name: "introuvable", path: `/chanson/${MISSING_SONG}`, verify: (r) => expectStatus(r, 404) },
    { name: "manifeste", path: "/manifest.webmanifest", verify: (r) => expectStatus(r, 200) },
    {
      name: "robots",
      path: "/robots.txt",
      verify: (r, body) => {
        const status = expectStatus(r, 200);
        if (status) return status;
        const closed = /^disallow:\s*\/\s*$/im.test(body);
        if (indexable && closed) return "robots.txt ferme tout le site (Disallow: /), alors qu'il doit être indexable";
        if (!indexable && !closed) return "robots.txt sans « Disallow: / » : le site est ouvert aux moteurs (SITE_INDEXABLE ?)";
        return null;
      },
    },
  ];
}

export async function runSmoke(baseUrl: string, opts: { fetch: Fetcher; query?: string; indexable?: boolean }): Promise<SmokeCheck[]> {
  const root = baseUrl.replace(/\/+$/, "");
  const base = new URL(root);
  const checks: SmokeCheck[] = [];
  for (const step of steps(opts.query ?? "sidi mansour", opts.indexable ?? false)) {
    try {
      const response = await opts.fetch(root + step.path, {
        headers: { "user-agent": "ghnaya-smoke" }, redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      const body = await response.text();
      const problem = step.verify(response, body, base);
      checks.push({ name: step.name, ok: problem === null, detail: problem ?? `${response.status}` });
    } catch (e) {
      checks.push({ name: step.name, ok: false, detail: e instanceof Error ? e.message : String(e) });
    }
  }
  return checks;
}
