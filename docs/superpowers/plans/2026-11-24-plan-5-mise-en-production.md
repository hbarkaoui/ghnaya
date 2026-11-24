# Plan 5 — Mise en production — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objectif** : mettre Ghnaya en ligne sur Vercel et Neon, avec le catalogue LRCLIB et le domaine public importés, des comptes qui reçoivent leurs liens, la translittération réelle, des sauvegardes qui tournent, et une vérification après chaque déploiement. Le site reste fermé aux moteurs de recherche tant que l'avis juridique demandé par la spec (§14) n'est pas rendu.

**Architecture** : le plan a deux parties.
- **Partie A, le code (tâches 1 à 7)**, faisable sans aucun compte externe :
  - une configuration de production vérifiée au démarrage (`src/instrumentation.ts`) : une variable manquante ou dangereuse fait échouer le démarrage, au lieu de se découvrir à la première connexion ;
  - un journal JSON des erreurs serveur, avec la référence (`digest`) déjà affichée sur la page d'erreur : c'est l'identifiant de corrélation de la spec §12 ;
  - le pool PostgreSQL attaché au cycle de vie des fonctions Vercel, la région des fonctions près de la base, et une durée maximale explicite pour les pages qui génèrent une translittération ;
  - des en-têtes de sécurité et un `robots.txt`, fermés à l'indexation par défaut ;
  - une route de santé `GET /api/sante`, qui dit si la base répond et si toutes les migrations sont appliquées ;
  - `pnpm smoke <url>`, qui vérifie un déploiement de l'extérieur ;
  - un guide d'exploitation pas à pas (`docs/exploitation/mise-en-production.md`).
- **Partie B, la mise en ligne (tâche 8)**, faite avec l'utilisateur : lui seul crée les comptes (Neon, Vercel, fournisseur d'e-mails, Google, Anthropic, stockage objet), saisit les secrets et paie. L'agent prépare, lance les commandes que l'utilisateur autorise, et vérifie.

**Stack** : celle des plans 1 à 4, plus **`@vercel/functions`** (pour `attachDatabasePool`). Aucune autre dépendance.

**Spec** : `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md` (§1 critères de réussite, §6.3 benchmark, §11 import, §12 erreurs, sécurité et exploitation, §14 risques).

**Plans précédents**, tous terminés :
- `docs/superpowers/plans/2026-11-18-plan-1-catalogue-recherche.md` (21/11/2026) : import LRCLIB, benchmark, CI, Dockerfile, `backup.yml`, section « Déploiement (Vercel + Neon) » du README ;
- `docs/superpowers/plans/2026-11-21-plan-2-comptes-clubs-playlists.md` (22/11/2026) : Better Auth, SMTP, Google, `pnpm user:role` ;
- `docs/superpowers/plans/2026-11-23-plan-3-contributions-moderation.md` (23/11/2026) : `TRUSTED_PROXY_HOPS` ;
- `docs/superpowers/plans/2026-11-23-plan-4-translitteration.md` (23/11/2026, remarques traitées le 24/11/2026) : `ANTHROPIC_API_KEY`, `TRANSLIT_*`, `pnpm translit:try`.

Leurs conventions s'appliquent : tests, commits, base locale sur le port 5433, `pnpm exec vitest run --project integration <fichier>` pour lancer un seul fichier d'intégration.

**Base de test dédiée** : la base `ghanni_test` peut servir à d'autres sessions en même temps. Avant d'exécuter ce plan :

```bash
psql postgres://ghanni:ghanni@localhost:5433/postgres -c "CREATE DATABASE ghanni_test_plan5"
```

```bash
export DATABASE_URL_TEST=postgres://ghanni:ghanni@localhost:5433/ghanni_test_plan5
```

**Documentation de Next.js** : la version installée (16.4) diffère de ce que l'on connaît. Avant d'écrire `instrumentation.ts`, `robots.ts`, `headers()` ou `maxDuration`, lire :
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md` ;
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md` ;
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md` ;
- `node_modules/next/dist/docs/01-app/02-guides/production-checklist.md`.

## État des tâches

À remplir pendant l'exécution, sur le modèle des plans 3 et 4 : pour chaque tâche, la date, le commit, ce qui a été vérifié et les écarts constatés ; puis « Non couvert par les vérifications » et les totaux de tests.

| Tâche | État | Ce qui a été vérifié, et les écarts constatés |
|---|---|---|
| 1. Configuration vérifiée au démarrage | Fait le 25/11/2026 (7ebb84c) | Tests unitaires du contrôle et de `translitProvider`, `pnpm env:check --file .env.example` (code 1, nomme `BETTER_AUTH_SECRET` et `SMTP_URL`/`MAIL_FROM`, sans valeur), build, e2e. Écart : une configuration invalide n'arrête pas `next start`, qui journalise « Configuration de production invalide » et répond 500 à toutes les requêtes. Le second cas de l'étape 11 échoue aussi sans `MAIL_TRANSPORT=outbox` (pas de SMTP dans le `.env` local) ; avec, 200. |
| 2. Journal des erreurs serveur | Fait le 25/11/2026 (bb4cba2) | Tests unitaires de la ligne JSON ; appel direct de `onRequestError` : la ligne porte le motif de la route, ni chemin réel ni cookie. Non vérifié sur un serveur de développement. |
| 3. Exécution sur Vercel | Fait le 25/11/2026 (8df24de) | `@vercel/functions` 3.11.3, `attachDatabasePool` quand `VERCEL` est défini, `vercel.json` en `fra1`, `maxDuration = 60` : le manifeste du build le liste pour `/chanson/[id]`, `/chanson/[id]/lecture` et `/lecture/[playlistId]/[position]`. À observer au premier déploiement réel : le journal de build autour de `attachDatabasePool` et la durée de 60 s. |
| 4. En-têtes de sécurité et indexation | Fait le 25/11/2026 (d4b3eb9) | Tests unitaires (6), e2e (18, dont 2 sur les en-têtes), build. `/recherche`, `/a-propos`, `/artiste` et `/chanson` restent indexables une fois `SITE_INDEXABLE=true`. |
| 5. Route de santé | Fait le 25/11/2026 (ce5372b) | Tests d'intégration (5). `db_unreachable` couvre toute panne de base, y compris une base jamais migrée. |
| 6. Vérification après déploiement | Fait le 25/11/2026 (4c32574) | Tests unitaires (6) ; essai sur un serveur local : 7 contrôles verts, échec de `recherche` avec une requête absente, usage affiché pour une URL invalide. Passer l'adresse canonique (redirections non suivies) ; `recherche` demande le catalogue importé. |
| 7. Guide d'exploitation, README, spec | Fait le 25/11/2026 (288ea52) | Guide créé, README (déploiement, exploitation, translittération) et spec (§4.4, §12, §14) datés ; commandes documentées vérifiées dans `package.json`. Suites : unitaires 699/699 (70 fichiers), intégration 235/235 (32 fichiers), e2e 18/18, typecheck et lint propres. |
| 8. Mise en ligne avec l'utilisateur | À faire | |

## Contraintes globales

- TypeScript `strict: true`. Aucun `any` explicite.
- Les pages n'écrivent jamais de SQL. Elles passent par les modules de `src/lib`.
- Les modules lus par un script (`pnpm env:check`, `pnpm smoke`) n'importent pas `server-only`.
- **Aucun secret dans le dépôt**, ni dans un message de commit, ni dans la conversation. Les fichiers d'environnement locaux (`.env*`, sauf `.env.example`) sont ignorés par git : le vérifier avant chaque commit (`git status`).
- **Aucune donnée personnelle dans les journaux** : ni adresse e-mail, ni chemin réel (il contient des codes d'invitation et des identifiants), ni en-têtes, ni cookies. Le journal d'erreur porte le motif de la route (`/rejoindre/[code]`), jamais l'adresse visitée.
- **Spec §12** : les exceptions serveur sont journalisées avec un identifiant de corrélation ; une page d'erreur générique existe (déjà construite, elle affiche le `digest`).
- **Spec §12** : hébergement sur Vercel, PostgreSQL managé chez Neon (`pg_trgm`, sauvegardes, restauration à un instant donné) ; sauvegarde nocturne `pg_dump` par une GitHub Action vers un stockage objet.
- **Spec §11** : l'import LRCLIB se traite **en local**, jamais sur le serveur de production ; un `--dry-run` mesure le volume avant le premier import réel.
- **Spec §6.3** : benchmark sur la base importée, p95 inférieur à 300 ms.
- **Spec §14** : **ce design n'est pas un avis juridique ; il faut consulter un juriste avant l'ouverture publique.** Le site déployé n'est donc pas indexable tant que `SITE_INDEXABLE` ne vaut pas `true`.
- **Partie B** : l'agent ne crée aucun compte, ne saisit aucun secret, ne valide aucun paiement et n'accepte aucune condition d'utilisation. Il donne la marche à suivre, attend que l'utilisateur dise que c'est fait, puis vérifie.
- Les commits suivent Conventional Commits (`feat:`, `test:`, `chore:`, `docs:`…).

## Écarts assumés par rapport à la spec, à confirmer en revue

1. **Identifiant de corrélation = `digest` de Next.js.** Next calcule déjà une référence pour chaque erreur serveur et l'envoie à la page d'erreur, qui l'affiche (`ErrorView`). Le journal JSON de la tâche 2 la reprend. Pas d'identifiant maison, qu'il faudrait faire passer de la requête à la page.
2. **Indexation fermée par défaut** (`SITE_INDEXABLE`), par `robots.txt` et l'en-tête `X-Robots-Tag`. La spec ne dit rien de l'indexation, mais §14 demande un avis juridique avant l'ouverture publique : un site indexé est public, même sans annonce. La valeur est lue **au build** : la changer demande un redéploiement.
3. **Configuration invalide = démarrage refusé en production.** Cela règle aussi la remarque laissée en l'état par le plan 4 : `TRANSLIT_PROVIDER=fake` est refusé en production hors de localhost, comme `MAIL_TRANSPORT=outbox` (le build des tests de bout en bout, sur localhost, reste permis).
4. **Région** : base Neon à Francfort (AWS `eu-central-1`), fonctions Vercel à Francfort (`fra1`), par `vercel.json`. Sans ce réglage, Vercel place les fonctions à Washington (`iad1`), et chaque requête SQL traverse l'Atlantique.
5. **Import LRCLIB directement dans Neon**, par le réseau, depuis le poste (`DATABASE_URL=<url directe> pnpm import:lrclib`), comme le prévoit déjà le README. Pas de transfert par `pg_dump` : l'import est idempotent et testé, un transfert serait un second chemin à maintenir. Le premier import peut prendre de l'ordre d'une heure (environ 48 000 chansons, une à quelques requêtes chacune, 20 à 30 ms d'aller-retour).
6. **Pas de politique de sécurité du contenu pour les scripts** (nonces) : seulement `frame-ancestors`, `base-uri` et `object-src`. Une CSP de scripts demanderait des nonces dans toutes les pages, et Next ne les pose que sur des pages rendues dynamiquement ; c'est un chantier à part.
7. **Pas de service d'observabilité externe** (Sentry, Datadog) : les journaux de Vercel, filtrés sur `"event":"server_error"`, suffisent au lancement.

## Structure des fichiers

```text
src/instrumentation.ts                     # register : vérifie la configuration ; onRequestError : journal JSON
src/lib/system/productionEnv.ts            # productionEnvProblems, assertProductionEnv (pur)
src/lib/system/serverErrorLog.ts           # serverErrorLogLine (pur)
src/lib/system/securityHeaders.ts          # securityHeaders(env) pour next.config (pur, imports relatifs)
src/lib/system/robots.ts                   # robotsRules(env) (pur)
src/lib/system/health.ts                   # checkHealth(db, attendu)
src/lib/system/smoke.ts                    # runSmoke(base, { fetch, query }) (pur, sans server-only)
src/app/robots.ts                          # /robots.txt
src/app/api/sante/route.ts                 # GET /api/sante
scripts/env-check.ts                       # pnpm env:check [--file <chemin>]
scripts/smoke.ts                           # pnpm smoke <url> [--query "<requête>"]
vercel.json                                # région des fonctions
docs/exploitation/mise-en-production.md    # guide pas à pas (partie B)

Modifiés :
src/lib/mail/transport.ts                  # exporte isLocalUrl
src/lib/ratelimit/clientIp.ts              # exporte trustedProxyHops
src/lib/translit/config.ts                 # translitProvider, utilisé par translitGenerator
src/lib/db/client.ts                       # attachDatabasePool sur Vercel, idleTimeoutMillis
src/app/chanson/[id]/page.tsx              # maxDuration = 60
src/app/chanson/[id]/lecture/page.tsx      # maxDuration = 60
src/app/lecture/[playlistId]/[position]/page.tsx  # maxDuration = 60
next.config.ts                             # headers()
.github/workflows/ci.yml                   # le job docker passe une configuration valide
package.json                               # env:check, smoke, @vercel/functions
.env.example, README.md, docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md

Tests :
tests/unit/system/productionEnv.test.ts
tests/unit/system/serverErrorLog.test.ts
tests/unit/system/securityHeaders.test.ts
tests/unit/system/robots.test.ts
tests/unit/system/smoke.test.ts
tests/unit/translit/config.test.ts         # translitProvider
tests/integration/health.test.ts
tests/e2e/headers.spec.ts
```

---

## Partie A — Le code

### Tâche 1 : configuration de production vérifiée au démarrage

**Files:**
- Create: `src/lib/system/productionEnv.ts`, `src/instrumentation.ts`, `scripts/env-check.ts`
- Modify: `src/lib/mail/transport.ts` (exporter `isLocalUrl`), `src/lib/ratelimit/clientIp.ts` (exporter `trustedProxyHops`), `src/lib/translit/config.ts` (`translitProvider`), `package.json` (`env:check`), `.github/workflows/ci.yml` (job `docker`), `README.md` (exemple `docker run`)
- Test: `tests/unit/system/productionEnv.test.ts`, `tests/unit/translit/config.test.ts`

**Interfaces:**
- Consumes: `mailTransport(env)` (`src/lib/mail/transport.ts`), `translitDailyLimit(env)` (`src/lib/translit/config.ts`).
- Produces:
  - `isLocalUrl(url: string | undefined): boolean` exporté par `src/lib/mail/transport.ts` ;
  - `trustedProxyHops(env: NodeJS.ProcessEnv): number` exporté par `src/lib/ratelimit/clientIp.ts` ;
  - `type TranslitProvider = "anthropic" | "fake" | "none"` et `translitProvider(env?: NodeJS.ProcessEnv): TranslitProvider` dans `src/lib/translit/config.ts` ;
  - `productionEnvProblems(env: NodeJS.ProcessEnv): string[]` et `assertProductionEnv(env: NodeJS.ProcessEnv): void` dans `src/lib/system/productionEnv.ts` ;
  - `src/instrumentation.ts` avec `register()` (la tâche 2 y ajoute `onRequestError`).

- [ ] **Étape 1 : tests de `translitProvider`**

Ajouter à `tests/unit/translit/config.test.ts` (l'aide `env` y existe déjà) :

```ts
import { translitProvider } from "@/lib/translit/config";

describe("translitProvider", () => {
  it("lit TRANSLIT_PROVIDER, sans espaces", () => {
    expect(translitProvider(env({ TRANSLIT_PROVIDER: " fake " }))).toBe("fake");
    expect(translitProvider(env({ TRANSLIT_PROVIDER: "none", ANTHROPIC_API_KEY: "sk-test" }))).toBe("none");
  });
  it("sans valeur : Claude avec une clé, factice hors production, aucun en production", () => {
    expect(translitProvider(env({ ANTHROPIC_API_KEY: "sk-test" }))).toBe("anthropic");
    expect(translitProvider(env({ NODE_ENV: "development" }))).toBe("fake");
    expect(translitProvider(env({ NODE_ENV: "production" }))).toBe("none");
  });
  it("refuse une valeur inconnue en la nommant", () => {
    expect(() => translitProvider(env({ TRANSLIT_PROVIDER: "openai" }))).toThrow(/TRANSLIT_PROVIDER invalide : « openai »/);
  });
});
```

Ajouter `translitProvider` à l'import existant plutôt que d'ajouter une seconde ligne `import`.

- [ ] **Étape 2 : vérifier l'échec**

Lancer : `pnpm exec vitest run --project unit tests/unit/translit/config.test.ts`
Attendu : échec, `translitProvider` n'est pas exporté.

- [ ] **Étape 3 : `translitProvider`**

Dans `src/lib/translit/config.ts`, remplacer `translitGenerator` par :

```ts
export type TranslitProvider = "anthropic" | "fake" | "none";

/**
 * `TRANSLIT_PROVIDER` : `anthropic`, `fake` ou `none`. Sans valeur : Claude si `ANTHROPIC_API_KEY` est là,
 * sinon le générateur factice hors production et aucun générateur en production (réponse « failed »).
 * Lu aussi par la vérification de la configuration au démarrage (plan 5, tâche 1).
 */
export function translitProvider(env: NodeJS.ProcessEnv = process.env): TranslitProvider {
  const provider =
    env.TRANSLIT_PROVIDER?.trim() || (env.ANTHROPIC_API_KEY ? "anthropic" : env.NODE_ENV === "production" ? "none" : "fake");
  if (provider === "anthropic" || provider === "fake" || provider === "none") return provider;
  throw new Error(`TRANSLIT_PROVIDER invalide : « ${provider} ». Valeurs possibles : anthropic, fake, none.`);
}

export function translitGenerator(env: NodeJS.ProcessEnv = process.env): TranslitGenerator | null {
  const provider = translitProvider(env);
  if (provider === "fake") return fakeGenerator;
  if (provider === "none") return null;
  return anthropicGenerator({ model: env.TRANSLIT_MODEL?.trim() || undefined });
}
```

Lancer : `pnpm exec vitest run --project unit tests/unit/translit/config.test.ts`
Attendu : tous les tests passent, y compris les anciens de `translitGenerator`.

- [ ] **Étape 4 : exporter `isLocalUrl` et `trustedProxyHops`**

Dans `src/lib/mail/transport.ts`, `const isLocalUrl = …` devient `export const isLocalUrl = …` (le corps ne change pas). Dans `src/lib/ratelimit/clientIp.ts`, `function trustedProxyHops` devient `export function trustedProxyHops` (le corps ne change pas).

- [ ] **Étape 5 : tests de `productionEnvProblems`**

Créer `tests/unit/system/productionEnv.test.ts` :

```ts
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
```

- [ ] **Étape 6 : vérifier l'échec**

Lancer : `pnpm exec vitest run --project unit tests/unit/system/productionEnv.test.ts`
Attendu : échec, le module `@/lib/system/productionEnv` n'existe pas.

- [ ] **Étape 7 : `productionEnv.ts`**

Créer `src/lib/system/productionEnv.ts` :

```ts
// Plan 5, tâche 1 : la configuration de production, vérifiée au démarrage (src/instrumentation.ts) et par
// `pnpm env:check`. Une variable manquante ou dangereuse doit empêcher le démarrage, au lieu de se découvrir
// à la première connexion. Les messages nomment les variables, jamais leurs valeurs : ils vont au journal.
// Pas de `server-only` : `pnpm env:check` lit ce module.
import { isLocalUrl, mailTransport } from "@/lib/mail/transport";
import { trustedProxyHops } from "@/lib/ratelimit/clientIp";
import { translitDailyLimit, translitProvider } from "@/lib/translit/config";

/** Valeur d'exemple de `.env.example` : une configuration recopiée sans être changée. */
export const EXAMPLE_AUTH_SECRET = "remplacer-par-un-secret-de-32-caracteres-au-moins";

const reason = (e: unknown) => (e instanceof Error ? e.message : String(e));
const filled = (value: string | undefined) => Boolean(value?.trim());

/** Problèmes de la configuration, en français, un par ligne ; vide hors production ou si tout va bien. */
export function productionEnvProblems(env: NodeJS.ProcessEnv): string[] {
  if (env.NODE_ENV !== "production") return [];
  const problems: string[] = [];

  if (!filled(env.DATABASE_URL)) problems.push("DATABASE_URL manque : l'URL poolée de la base.");

  const secret = env.BETTER_AUTH_SECRET?.trim() ?? "";
  if (secret.length < 32 || secret === EXAMPLE_AUTH_SECRET) {
    problems.push("BETTER_AUTH_SECRET manque, fait moins de 32 caractères ou reprend l'exemple : openssl rand -base64 32.");
  }

  const authUrl = env.BETTER_AUTH_URL?.trim();
  const local = isLocalUrl(authUrl);
  if (!authUrl) {
    problems.push("BETTER_AUTH_URL manque : l'adresse publique du site (https://…).");
  } else {
    let protocol: string | null = null;
    try {
      protocol = new URL(authUrl).protocol;
    } catch {
      problems.push("BETTER_AUTH_URL invalide : une adresse complète est attendue (https://…).");
    }
    if (protocol !== null && protocol !== "https:" && !local) {
      problems.push("BETTER_AUTH_URL doit être en https hors de localhost : les cookies de session sont « secure ».");
    }
  }

  try {
    if (mailTransport(env) === "smtp" && (!filled(env.SMTP_URL) || !filled(env.MAIL_FROM))) {
      problems.push("SMTP_URL et MAIL_FROM sont nécessaires pour envoyer les liens de connexion.");
    }
  } catch (e) {
    problems.push(reason(e));
  }

  try {
    const provider = translitProvider(env);
    if (provider === "fake" && !local) {
      problems.push("TRANSLIT_PROVIDER=fake est refusé en production hors de localhost : le texte factice serait servi aux lecteurs.");
    }
    if (provider === "anthropic" && !filled(env.ANTHROPIC_API_KEY)) {
      problems.push("TRANSLIT_PROVIDER=anthropic demande ANTHROPIC_API_KEY.");
    }
  } catch (e) {
    problems.push(reason(e));
  }

  for (const check of [() => translitDailyLimit(env), () => trustedProxyHops(env)]) {
    try {
      check();
    } catch (e) {
      problems.push(reason(e));
    }
  }

  if (filled(env.GOOGLE_CLIENT_ID) !== filled(env.GOOGLE_CLIENT_SECRET)) {
    problems.push("GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET vont ensemble : définir les deux, ou aucun.");
  }

  return problems;
}

/** Lève une erreur qui liste tous les problèmes, s'il y en a. */
export function assertProductionEnv(env: NodeJS.ProcessEnv): void {
  const problems = productionEnvProblems(env);
  if (problems.length > 0) throw new Error(`Configuration de production invalide :\n- ${problems.join("\n- ")}`);
}
```

Attention : le message de `trustedProxyHops` cite la valeur (`TRUSTED_PROXY_HOPS="one"`). Ce n'est pas un secret, on le garde.

Lancer : `pnpm exec vitest run --project unit tests/unit/system/productionEnv.test.ts`
Attendu : tous les tests passent.

- [ ] **Étape 8 : `instrumentation.ts`**

Créer `src/instrumentation.ts` (dans `src/`, à côté de `app/`, comme le veut la documentation de Next pour un projet avec dossier `src`) :

```ts
// Plan 5, tâche 1 : au démarrage d'un serveur Next (une instance de fonction sur Vercel), vérifier la
// configuration de production. Une erreur ici empêche le serveur de répondre : c'est voulu, une configuration
// incomplète ne doit pas servir de pages (liens de connexion jamais envoyés, texte factice enregistré…).
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Par prudence : pendant `next build`, l'environnement de production n'est pas forcément complet.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { assertProductionEnv } = await import("@/lib/system/productionEnv");
  assertProductionEnv(process.env);
}
```

- [ ] **Étape 9 : `pnpm env:check`**

Créer `scripts/env-check.ts` :

```ts
// Plan 5, tâche 1 : vérifier une configuration de production avant de la saisir chez l'hébergeur.
//   pnpm env:check --file .env.production.local   (fichier ignoré par git, à supprimer ensuite)
//   pnpm env:check                                 (variables du shell)
// Les valeurs ne sont jamais affichées.
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { productionEnvProblems } from "@/lib/system/productionEnv";

function main(argv: string[]): number {
  const at = argv.indexOf("--file");
  const file = at >= 0 ? argv[at + 1] : undefined;
  if (at >= 0 && !file) {
    console.error("Usage : pnpm env:check [--file <chemin>]");
    return 1;
  }
  const source = file ? parse(readFileSync(file)) : process.env;
  const problems = productionEnvProblems({ ...source, NODE_ENV: "production" } as NodeJS.ProcessEnv);
  if (problems.length === 0) {
    console.log("Configuration de production valide.");
    return 0;
  }
  console.error(`Configuration de production invalide :\n- ${problems.join("\n- ")}`);
  return 1;
}

process.exitCode = main(process.argv.slice(2));
```

Dans `package.json`, ajouter après `"translit:try"` : `"env:check": "tsx scripts/env-check.ts"`.

Vérifier : `pnpm env:check --file .env.example`
Attendu : code de sortie 1, « Configuration de production invalide », avec au moins `BETTER_AUTH_SECRET` (valeur d'exemple) et `SMTP_URL et MAIL_FROM`. Aucune valeur affichée.

- [ ] **Étape 10 : le job `docker` de la CI passe une configuration valide**

Sans cela, l'image lancée par la CI avec la seule `DATABASE_URL` refuse désormais de démarrer. Dans `.github/workflows/ci.yml`, job `docker`, étape « Vérifier que l'image sert l'accueil », remplacer la ligne `docker run` par :

```yaml
          # Configuration minimale valide en production (plan 5, tâche 1) : localhost permet la boîte locale.
          docker run -d --name ghanni -p 3000:3000 \
            -e DATABASE_URL=postgres://ghanni:ghanni@localhost:5433/ghanni \
            -e BETTER_AUTH_SECRET=ci-secret-ci-secret-ci-secret-0123 \
            -e BETTER_AUTH_URL=http://localhost:3000 \
            -e MAIL_TRANSPORT=outbox \
            ghanni
```

Dans `README.md`, section « Image Docker », compléter l'exemple `docker run` de la même façon (`-e BETTER_AUTH_SECRET=… -e BETTER_AUTH_URL=http://localhost:3000 -e MAIL_TRANSPORT=outbox`), avec une phrase : « En production, l'application refuse de démarrer si sa configuration est incomplète (voir `pnpm env:check`). »

- [ ] **Étape 11 : vérifier le démarrage, en échec puis en réussite**

```bash
pnpm build
```

Le fichier `.env` local est lu par `next start`. On le contredit par des variables explicites :

```bash
BETTER_AUTH_URL=https://ghnaya.example pnpm start -p 3200
```

Attendu : le serveur affiche « Configuration de production invalide » avec au moins `SMTP_URL et MAIL_FROM`, et ne sert pas de page (une requête `curl -sI http://localhost:3200/` échoue ou répond 500). Arrêter le serveur.

```bash
BETTER_AUTH_SECRET=$(openssl rand -base64 32) BETTER_AUTH_URL=http://localhost:3200 pnpm start -p 3200
```

Attendu : `curl -sI http://localhost:3200/` répond `200`. Arrêter le serveur. Noter dans « État des tâches » le comportement exact observé dans le premier cas (processus arrêté, ou réponses 500).

- [ ] **Étape 12 : suites complètes**

Lancer : `pnpm test`, `pnpm typecheck`, `pnpm lint`, puis `pnpm test:e2e` (le build des parcours est une production sur localhost : il doit démarrer).
Attendu : tout passe.

- [ ] **Étape 13 : commit**

```bash
git add src/lib/system/productionEnv.ts src/instrumentation.ts scripts/env-check.ts src/lib/mail/transport.ts src/lib/ratelimit/clientIp.ts src/lib/translit/config.ts package.json .github/workflows/ci.yml README.md tests/unit/system/productionEnv.test.ts tests/unit/translit/config.test.ts
git commit -m "feat(exploitation): configuration de production vérifiée au démarrage, pnpm env:check"
```

---

### Tâche 2 : journal des erreurs serveur

**Files:**
- Create: `src/lib/system/serverErrorLog.ts`
- Modify: `src/instrumentation.ts`
- Test: `tests/unit/system/serverErrorLog.test.ts`

**Interfaces:**
- Consumes: `src/instrumentation.ts` (tâche 1).
- Produces:
  - `interface ErrorRequest { method: string }` et `interface ErrorContext { routePath: string; routeType: string }` ;
  - `serverErrorLogLine(err: unknown, request: ErrorRequest, context: ErrorContext, now?: Date): string` : une ligne JSON ;
  - `onRequestError` exporté par `src/instrumentation.ts`.

- [ ] **Étape 1 : tests**

Créer `tests/unit/system/serverErrorLog.test.ts` :

```ts
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
```

- [ ] **Étape 2 : vérifier l'échec**

Lancer : `pnpm exec vitest run --project unit tests/unit/system/serverErrorLog.test.ts`
Attendu : échec, le module n'existe pas.

- [ ] **Étape 3 : `serverErrorLog.ts`**

Créer `src/lib/system/serverErrorLog.ts` :

```ts
// Plan 5, tâche 2 : une erreur serveur = une ligne JSON dans le journal (spec §12, identifiant de corrélation).
// La référence est le `digest` que Next envoie à la page d'erreur, qui l'affiche (ErrorView) : une personne qui
// la donne au support permet de retrouver la ligne (filtre Vercel : "event":"server_error").
// Ni chemin réel (codes d'invitation, identifiants), ni en-têtes, ni cookies : seulement le motif de la route.
import { errorDigest } from "./actionFailure";

export interface ErrorRequest {
  method: string;
}

export interface ErrorContext {
  /** Motif de la route, par exemple `/chanson/[id]`. */
  routePath: string;
  /** `render`, `route`, `action` ou `proxy`. */
  routeType: string;
}

const STACK_LINES = 5;

export function serverErrorLogLine(err: unknown, request: ErrorRequest, context: ErrorContext, now = new Date()): string {
  const error = err instanceof Error ? err : null;
  return JSON.stringify({
    level: "error",
    event: "server_error",
    time: now.toISOString(),
    digest: errorDigest(err),
    route: context.routePath,
    routeType: context.routeType,
    method: request.method,
    name: error?.name ?? null,
    message: error ? error.message : String(err),
    stack: error?.stack?.split("\n").slice(0, STACK_LINES) ?? [],
  });
}
```

`errorDigest` existe déjà dans `src/lib/system/actionFailure.ts` (pur, sans React) : on le réutilise.

Lancer : `pnpm exec vitest run --project unit tests/unit/system/serverErrorLog.test.ts`
Attendu : tous les tests passent.

- [ ] **Étape 4 : `onRequestError`**

Ajouter à `src/instrumentation.ts` :

```ts
import type { Instrumentation } from "next";

// Plan 5, tâche 2 : chaque erreur serveur capturée par Next (rendu, route, action) devient une ligne JSON.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { serverErrorLogLine } = await import("@/lib/system/serverErrorLog");
  console.error(serverErrorLogLine(err, request, context));
};
```

Si `pnpm typecheck` signale que le type `Instrumentation` n'existe pas sous ce nom, lire `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md` (section `onRequestError`, paramètres) et typer d'après la documentation installée. Noter l'écart.

- [ ] **Étape 5 : vérifier dans le serveur de développement**

```bash
pnpm dev
```

Ouvrir `http://localhost:3000/apercu/etats/erreur` (page de développement qui lève une erreur, plan 1). Attendu, dans la sortie du serveur : une ligne qui commence par `{"level":"error","event":"server_error"` avec `"route":"/apercu/etats/erreur"`. Si la page d'erreur affiche une référence, elle doit être égale au `digest` de la ligne. Si `onRequestError` ne se déclenche pas en développement, le vérifier sur le build de production : `pnpm build`, puis `BETTER_AUTH_SECRET=$(openssl rand -base64 32) BETTER_AUTH_URL=http://localhost:3200 pnpm start -p 3200`, et provoquer une erreur en demandant une chanson pendant que la base est arrêtée (`brew services stop postgresql@16`, puis `curl -s http://localhost:3200/chanson/00000000-0000-4000-8000-000000000000`, puis `brew services start postgresql@16`). Noter ce qui a été fait.

- [ ] **Étape 6 : suites et commit**

Lancer : `pnpm test`, `pnpm typecheck`, `pnpm lint`.

```bash
git add src/lib/system/serverErrorLog.ts src/instrumentation.ts tests/unit/system/serverErrorLog.test.ts
git commit -m "feat(exploitation): erreurs serveur journalisées en JSON avec leur référence"
```

---

### Tâche 3 : exécution sur Vercel

**Files:**
- Create: `vercel.json`
- Modify: `src/lib/db/client.ts`, `src/app/chanson/[id]/page.tsx`, `src/app/chanson/[id]/lecture/page.tsx`, `src/app/lecture/[playlistId]/[position]/page.tsx`, `package.json` (dépendance)

**Interfaces:**
- Consumes: rien des tâches précédentes.
- Produces: `pool` et `db` gardent leurs noms et leurs types (`src/lib/db/client.ts`).

Pourquoi :
- **Pool** : avec Fluid Compute, une instance de fonction sert plusieurs requêtes puis est suspendue. Des connexions restées ouvertes au moment de la suspension sont perdues sans être rendues, et Neon finit par en refuser de nouvelles. `attachDatabasePool` (paquet `@vercel/functions`) ferme les connexions inactives avant la suspension. `idleTimeoutMillis` court réduit aussi ce risque ailleurs.
- **Région** : `vercel.json` place les fonctions à Francfort, près de la base Neon (écart 4).
- **Durée** : une génération de translittération dure jusqu'à 30 s, l'attente d'une génération en cours jusqu'à 35 s (plan 4). `maxDuration = 60` sur les trois pages qui appellent l'action de translittération (`useTranslit`, utilisé par `SongLyrics` et `ReaderShell`) rend la règle explicite, au lieu de dépendre du réglage par défaut du compte Vercel.

- [ ] **Étape 1 : dépendance**

```bash
pnpm add @vercel/functions
```

Puis lire la déclaration installée pour confirmer le nom et la signature :

```bash
grep -rn "attachDatabasePool" node_modules/@vercel/functions/*.d.ts node_modules/@vercel/functions/**/*.d.ts | head
```

Attendu : une fonction `attachDatabasePool(pool)` exportée. Si le nom diffère, suivre la déclaration installée et noter l'écart.

- [ ] **Étape 2 : `client.ts`**

Dans `src/lib/db/client.ts` :

```ts
// Plan 1, tâche 5 : pool PostgreSQL et instance Drizzle, partagés par l'app, les scripts et les tests.
// Plan 5, tâche 3 : sur Vercel, le pool est attaché au cycle de vie des fonctions (Fluid Compute) : les
// connexions inactives sont fermées avant la suspension d'une instance, au lieu d'être perdues ouvertes.
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// En développement, le rechargement à chaud réévalue ce module : on garde le même pool.
const globalForDb = globalThis as unknown as { ghanniPool?: Pool };

export const pool =
  globalForDb.ghanniPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 5_000 });
if (process.env.NODE_ENV !== "production") globalForDb.ghanniPool = pool;
if (process.env.VERCEL) attachDatabasePool(pool);
```

Le reste du fichier (`db`, `Db`, `Tx`, `Executor`) ne change pas.

- [ ] **Étape 3 : `maxDuration`**

En tête des trois pages, après les imports :

```ts
// Plan 5, tâche 3 : l'action de translittération appelée depuis cette page peut durer 30 s (génération) ou
// 35 s (attente d'une génération en cours). Valable pour toutes les actions serveur de la page.
export const maxDuration = 60;
```

Fichiers : `src/app/chanson/[id]/page.tsx`, `src/app/chanson/[id]/lecture/page.tsx`, `src/app/lecture/[playlistId]/[position]/page.tsx`. Vérifier d'abord, avec `grep -rn "useTranslit\|SongLyrics\|ReaderShell" src/app`, qu'aucune autre page n'affiche ces composants ; s'il y en a, y ajouter la même ligne.

- [ ] **Étape 4 : `vercel.json`**

Créer `vercel.json` :

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["fra1"]
}
```

- [ ] **Étape 5 : vérifier le build**

```bash
pnpm build
```

Puis :

```bash
grep -o '"maxDuration":[0-9]*' .next/server/functions-config-manifest.json | sort | uniq -c
```

Attendu : le build réussit, et le manifeste porte `"maxDuration":60` pour trois routes (ou plus, si l'étape 3 en a trouvé d'autres). Si le fichier n'existe pas sous ce nom, chercher `maxDuration` dans `.next/server/*.json` et noter où il se trouve.

- [ ] **Étape 6 : suites et commit**

Lancer : `pnpm test`, `pnpm test:integration` (avec `DATABASE_URL_TEST` du plan, le pool est utilisé par tous les tests), `pnpm typecheck`, `pnpm lint`.
Attendu : tout passe. Hors Vercel, `attachDatabasePool` n'est pas appelé.

```bash
git add vercel.json src/lib/db/client.ts "src/app/chanson/[id]/page.tsx" "src/app/chanson/[id]/lecture/page.tsx" "src/app/lecture/[playlistId]/[position]/page.tsx" package.json pnpm-lock.yaml
git commit -m "feat(exploitation): pool attaché aux fonctions Vercel, région fra1, durée des pages de translittération"
```

---

### Tâche 4 : en-têtes de sécurité et indexation

**Files:**
- Create: `src/lib/system/securityHeaders.ts`, `src/lib/system/robots.ts`, `src/app/robots.ts`
- Modify: `next.config.ts`, `.env.example`
- Test: `tests/unit/system/securityHeaders.test.ts`, `tests/unit/system/robots.test.ts`, `tests/e2e/headers.spec.ts`

**Interfaces:**
- Produces:
  - `interface HeaderRule { source: string; headers: { key: string; value: string }[] }` et `securityHeaders(env: NodeJS.ProcessEnv): HeaderRule[]` ;
  - `isIndexable(env: NodeJS.ProcessEnv): boolean` et `robotsRules(env: NodeJS.ProcessEnv): MetadataRoute.Robots` ;
  - `/robots.txt`. La tâche 6 vérifie ces en-têtes de l'extérieur.

Règles :
- sur toutes les réponses : `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`. **Ne pas** couper `screen-wake-lock` : le lecteur en a besoin (spec §10) ;
- `Strict-Transport-Security: max-age=63072000; includeSubDomains` seulement quand `VERCEL_ENV === "production"` (sur l'image Docker, c'est au proxy TLS de le poser) ;
- `X-Robots-Tag: noindex, nofollow` tant que `SITE_INDEXABLE` ne vaut pas `true` ;
- `robots.txt` : tout interdit tant que le site n'est pas indexable ; ensuite, tout permis sauf les espaces privés et techniques.

Ces valeurs sont calculées **au build** (`next.config.ts`, `robots.ts` statique) : changer `SITE_INDEXABLE` demande un redéploiement.

- [ ] **Étape 1 : tests**

Créer `tests/unit/system/securityHeaders.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { securityHeaders } from "@/lib/system/securityHeaders";

const env = (values: Record<string, string> = {}) => values as unknown as NodeJS.ProcessEnv;
const headersOf = (e: NodeJS.ProcessEnv) => {
  const rules = securityHeaders(e);
  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");
  return Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]));
};

describe("securityHeaders", () => {
  it("pose les protections de base partout", () => {
    const h = headersOf(env());
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Content-Security-Policy"]).toBe("frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  });

  it("laisse le verrou d'écran au lecteur", () => {
    expect(headersOf(env())["Permissions-Policy"]).not.toContain("screen-wake-lock");
  });

  it("ferme l'indexation sauf si SITE_INDEXABLE=true", () => {
    expect(headersOf(env())["X-Robots-Tag"]).toBe("noindex, nofollow");
    expect(headersOf(env({ SITE_INDEXABLE: "oui" }))["X-Robots-Tag"]).toBe("noindex, nofollow");
    expect(headersOf(env({ SITE_INDEXABLE: "true" }))["X-Robots-Tag"]).toBeUndefined();
  });

  it("n'impose HTTPS que sur la production Vercel", () => {
    expect(headersOf(env())["Strict-Transport-Security"]).toBeUndefined();
    expect(headersOf(env({ VERCEL_ENV: "preview" }))["Strict-Transport-Security"]).toBeUndefined();
    expect(headersOf(env({ VERCEL_ENV: "production" }))["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains");
  });
});
```

Créer `tests/unit/system/robots.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { isIndexable, robotsRules } from "@/lib/system/robots";

const env = (values: Record<string, string> = {}) => values as unknown as NodeJS.ProcessEnv;

describe("robotsRules", () => {
  it("interdit tout tant que le site n'est pas ouvert", () => {
    expect(isIndexable(env())).toBe(false);
    expect(robotsRules(env())).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("une fois ouvert, permet le catalogue et garde les espaces privés", () => {
    expect(isIndexable(env({ SITE_INDEXABLE: " true " }))).toBe(true);
    const { rules } = robotsRules(env({ SITE_INDEXABLE: "true" }));
    expect(rules).toMatchObject({ userAgent: "*", allow: "/" });
    const disallow = (rules as { disallow: string[] }).disallow;
    for (const path of ["/api/", "/moderation", "/moi", "/connexion", "/rejoindre/", "/playlists", "/clubs", "/lecture/", "/apercu/"]) {
      expect(disallow).toContain(path);
    }
    expect(disallow).not.toContain("/chanson/");
  });
});
```

- [ ] **Étape 2 : vérifier l'échec**

Lancer : `pnpm exec vitest run --project unit tests/unit/system/securityHeaders.test.ts tests/unit/system/robots.test.ts`
Attendu : échec, les modules n'existent pas.

- [ ] **Étape 3 : les deux modules**

Créer `src/lib/system/robots.ts` :

```ts
// Plan 5, tâche 4 : indexation fermée tant que l'avis juridique n'est pas rendu (spec §14, écart 2).
// Lu au build (robots.txt statique, en-têtes de next.config.ts) : changer SITE_INDEXABLE demande un redéploiement.
// Imports relatifs ou de types seulement : next.config.ts lit securityHeaders.ts, qui importe ce module.
import type { MetadataRoute } from "next";

export function isIndexable(env: NodeJS.ProcessEnv): boolean {
  return env.SITE_INDEXABLE?.trim() === "true";
}

/** Espaces privés ou techniques, jamais indexés : comptes, clubs, playlists, modération, lecteur, aperçus. */
const PRIVATE_PATHS = [
  "/api/",
  "/apercu/",
  "/clubs",
  "/connexion",
  "/contribuer",
  "/lecture/",
  "/mes-contributions",
  "/moderation",
  "/moi",
  "/playlists",
  "/rejoindre/",
  "/signaler/",
];

export function robotsRules(env: NodeJS.ProcessEnv): MetadataRoute.Robots {
  if (!isIndexable(env)) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS } };
}
```

Avant d'écrire la liste, vérifier qu'elle correspond aux dossiers de `src/app` (`ls src/app`) : un espace privé absent de la liste serait indexable à l'ouverture. Ajouter ce qui manque et noter l'écart.

Créer `src/lib/system/securityHeaders.ts` :

```ts
// Plan 5, tâche 4 : en-têtes de sécurité de toutes les réponses, lus par next.config.ts au build.
// Imports relatifs seulement : next.config.ts ne résout pas l'alias « @/ ».
import { isIndexable } from "./robots";

export interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

export function securityHeaders(env: NodeJS.ProcessEnv): HeaderRule[] {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    // Pas de règle de scripts (nonces) : écart 6. Ces trois-là ne gênent ni Next ni Google.
    { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
    // screen-wake-lock reste permis : le lecteur garde l'écran allumé (spec §10).
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ];
  if (env.VERCEL_ENV === "production") {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  }
  if (!isIndexable(env)) headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
  return [{ source: "/:path*", headers }];
}
```

Lancer : `pnpm exec vitest run --project unit tests/unit/system/securityHeaders.test.ts tests/unit/system/robots.test.ts`
Attendu : tous les tests passent.

- [ ] **Étape 4 : brancher**

Créer `src/app/robots.ts` :

```ts
// Plan 5, tâche 4 : /robots.txt, calculé au build (écart 2).
import type { MetadataRoute } from "next";
import { robotsRules } from "@/lib/system/robots";

export default function robots(): MetadataRoute.Robots {
  return robotsRules(process.env);
}
```

Dans `next.config.ts`, ajouter l'import `import { securityHeaders } from "./src/lib/system/securityHeaders";` et, dans `nextConfig` :

```ts
  // Plan 5, tâche 4 : en-têtes de sécurité et indexation, calculés au build.
  async headers() {
    return securityHeaders(process.env);
  },
```

Dans `.env.example`, ajouter :

```bash
# Indexation par les moteurs de recherche (plan 5). Vide : fermée (robots.txt et X-Robots-Tag). Ne mettre
# « true » qu'après l'avis juridique (spec §14). Lu au build : redéployer après l'avoir changé.
SITE_INDEXABLE=
```

- [ ] **Étape 5 : parcours de bout en bout**

Créer `tests/e2e/headers.spec.ts` :

```ts
// Plan 5, tâche 4 : en-têtes de sécurité et indexation fermée, sur le build de production.
import { expect, test } from "@playwright/test";

test("l'accueil porte les en-têtes de sécurité et n'est pas indexable", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-robots-tag"]).toBe("noindex, nofollow");
  expect(headers["permissions-policy"]).not.toContain("screen-wake-lock");
});

test("robots.txt interdit tout tant que le site n'est pas ouvert", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/Disallow: \/\s*$/m);
});
```

Lancer : `pnpm test:e2e`
Attendu : tous les parcours passent, dont les deux nouveaux. Les parcours existants vérifient que l'application marche encore avec ces en-têtes (connexion, lecteur, translittération).

- [ ] **Étape 6 : suites et commit**

Lancer : `pnpm test`, `pnpm typecheck`, `pnpm lint`.

```bash
git add src/lib/system/securityHeaders.ts src/lib/system/robots.ts src/app/robots.ts next.config.ts .env.example tests/unit/system/securityHeaders.test.ts tests/unit/system/robots.test.ts tests/e2e/headers.spec.ts
git commit -m "feat(exploitation): en-têtes de sécurité, indexation fermée jusqu'à SITE_INDEXABLE"
```

---

### Tâche 5 : route de santé

**Files:**
- Create: `src/lib/system/health.ts`, `src/app/api/sante/route.ts`
- Test: `tests/integration/health.test.ts`

**Interfaces:**
- Consumes: `db`, `type Db` (`src/lib/db/client.ts`).
- Produces:
  - `type Health = { status: "ok" } | { status: "migrations_pending"; applied: number; expected: number } | { status: "db_unreachable" }` ;
  - `EXPECTED_MIGRATIONS: number` (nombre d'entrées de `drizzle/meta/_journal.json`) ;
  - `checkHealth(db: Db, expected?: number): Promise<Health>` ;
  - `GET /api/sante` : 200 et `{ "status": "ok" }`, sinon 503 avec le statut. La tâche 6 l'appelle.

Les migrations appliquées sont lues dans `drizzle.__drizzle_migrations`, la table du migrateur de Drizzle (`pnpm db:migrate`). Un déploiement dont le code attend une migration que la base n'a pas reçue répond `migrations_pending` : c'est l'oubli le plus probable d'une mise en ligne.

- [ ] **Étape 1 : tests**

Créer `tests/integration/health.test.ts` :

```ts
// Plan 5, tâche 5 : santé de la base et des migrations.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { checkHealth, EXPECTED_MIGRATIONS } from "@/lib/system/health";

const { GET } = await import("@/app/api/sante/route");

describe("checkHealth", () => {
  it("compte les migrations du journal", () => {
    expect(EXPECTED_MIGRATIONS).toBeGreaterThanOrEqual(6);
  });

  it("répond ok sur une base migrée", async () => {
    await expect(checkHealth(db)).resolves.toEqual({ status: "ok" });
  });

  it("signale une migration attendue et absente", async () => {
    await expect(checkHealth(db, EXPECTED_MIGRATIONS + 1)).resolves.toEqual({
      status: "migrations_pending",
      applied: EXPECTED_MIGRATIONS,
      expected: EXPECTED_MIGRATIONS + 1,
    });
  });

  it("signale une base injoignable, sans lever", async () => {
    const pool = new Pool({ connectionString: "postgres://x:y@127.0.0.1:1/z", connectionTimeoutMillis: 1_000 });
    try {
      await expect(checkHealth(drizzle(pool, { schema }))).resolves.toEqual({ status: "db_unreachable" });
    } finally {
      await pool.end();
    }
  });
});

describe("GET /api/sante", () => {
  it("répond 200, sans cache", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
```

Si la base de test a été migrée avec moins d'entrées que le journal (base ancienne), `globalSetup` la remet à jour : ne pas contourner un échec de « répond ok », le comprendre.

- [ ] **Étape 2 : vérifier l'échec**

Lancer : `pnpm exec vitest run --project integration tests/integration/health.test.ts`
Attendu : échec, les modules n'existent pas.

- [ ] **Étape 3 : `health.ts` et la route**

Créer `src/lib/system/health.ts` :

```ts
// Plan 5, tâche 5 : la base répond-elle, et toutes les migrations du code y sont-elles appliquées ?
import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import journal from "../../../drizzle/meta/_journal.json";

export type Health =
  | { status: "ok" }
  | { status: "migrations_pending"; applied: number; expected: number }
  | { status: "db_unreachable" };

/** Migrations que ce code attend : les entrées du journal de drizzle-kit. */
export const EXPECTED_MIGRATIONS = journal.entries.length;

export async function checkHealth(db: Db, expected = EXPECTED_MIGRATIONS): Promise<Health> {
  let applied: number;
  try {
    const result = await db.execute<{ n: number }>(sql`select count(*)::int as n from drizzle.__drizzle_migrations`);
    applied = result.rows[0]?.n ?? 0;
  } catch (e) {
    console.error(JSON.stringify({ level: "error", event: "health_db_unreachable", message: e instanceof Error ? e.message : String(e) }));
    return { status: "db_unreachable" };
  }
  return applied >= expected ? { status: "ok" } : { status: "migrations_pending", applied, expected };
}
```

Si `db.execute` ne renvoie pas `{ rows }` avec le pilote `node-postgres` de la version installée de Drizzle, regarder comment un autre module du projet lit un `db.execute` (`grep -rn "db.execute\|\.execute(" src/lib | head`) et faire de même.

Créer `src/app/api/sante/route.ts` :

```ts
// Plan 5, tâche 5 : GET /api/sante, pour la vérification après déploiement (pnpm smoke) et une surveillance
// externe. Ne dit rien d'autre que l'état : ni version, ni nom de base, ni message d'erreur.
import { db } from "@/lib/db/client";
import { checkHealth } from "@/lib/system/health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const health = await checkHealth(db);
  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
```

Lancer : `pnpm exec vitest run --project integration tests/integration/health.test.ts`
Attendu : tous les tests passent.

- [ ] **Étape 4 : suites et commit**

Lancer : `pnpm test:integration`, `pnpm typecheck`, `pnpm lint`.

```bash
git add src/lib/system/health.ts src/app/api/sante/route.ts tests/integration/health.test.ts
git commit -m "feat(exploitation): route de santé, base et migrations"
```

---

### Tâche 6 : vérification après déploiement

**Files:**
- Create: `src/lib/system/smoke.ts`, `scripts/smoke.ts`
- Modify: `package.json` (`smoke`)
- Test: `tests/unit/system/smoke.test.ts`

**Interfaces:**
- Consumes: `GET /api/sante` (tâche 5), les en-têtes (tâche 4).
- Produces:
  - `interface SmokeCheck { name: string; ok: boolean; detail: string }` ;
  - `type Fetcher = (url: string, init?: RequestInit) => Promise<Response>` ;
  - `runSmoke(baseUrl: string, opts: { fetch: Fetcher; query?: string }): Promise<SmokeCheck[]>` ;
  - `pnpm smoke <url> [--query "<requête>"]`, code de sortie 1 si une vérification échoue.

Vérifications, dans l'ordre :
1. **santé** : `/api/sante` répond 200 avec `{"status":"ok"}` ;
2. **accueil** : `/` répond 200 avec `<html lang=` ;
3. **en-têtes** : `/` porte `x-content-type-options: nosniff` et `x-frame-options: DENY` ; et `strict-transport-security` si l'adresse est en `https:` et pas sur un domaine `*.vercel.app` de prévisualisation ;
4. **recherche** : `/recherche?q=<requête>` (par défaut « sidi mansour ») répond 200 avec au moins un lien `href="/chanson/` ;
5. **introuvable** : `/chanson/00000000-0000-4000-8000-000000000000` répond 404 ;
6. **manifeste** : `/manifest.webmanifest` répond 200 ;
7. **robots** : `/robots.txt` répond 200.

Une exception réseau sur une vérification la marque en échec avec son message, sans arrêter les suivantes.

- [ ] **Étape 1 : tests**

Créer `tests/unit/system/smoke.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { runSmoke, type Fetcher } from "@/lib/system/smoke";

const SECURE = { "x-content-type-options": "nosniff", "x-frame-options": "DENY" };
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
});
```

Le dernier test passe une adresse avec une barre finale : `runSmoke` doit la retirer.

- [ ] **Étape 2 : vérifier l'échec**

Lancer : `pnpm exec vitest run --project unit tests/unit/system/smoke.test.ts`
Attendu : échec, le module n'existe pas.

- [ ] **Étape 3 : `smoke.ts`**

Créer `src/lib/system/smoke.ts` :

```ts
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

function steps(query: string): Step[] {
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
        return missing.length === 0 ? null : `manquants : ${missing.join(", ")}`;
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
    { name: "robots", path: "/robots.txt", verify: (r) => expectStatus(r, 200) },
  ];
}

export async function runSmoke(baseUrl: string, opts: { fetch: Fetcher; query?: string }): Promise<SmokeCheck[]> {
  const root = baseUrl.replace(/\/+$/, "");
  const base = new URL(root);
  const checks: SmokeCheck[] = [];
  for (const step of steps(opts.query ?? "sidi mansour")) {
    try {
      const response = await opts.fetch(root + step.path, { headers: { "user-agent": "ghnaya-smoke" }, redirect: "manual" });
      const body = await response.text();
      const problem = step.verify(response, body, base);
      checks.push({ name: step.name, ok: problem === null, detail: problem ?? `${response.status}` });
    } catch (e) {
      checks.push({ name: step.name, ok: false, detail: e instanceof Error ? e.message : String(e) });
    }
  }
  return checks;
}
```

Les tests encodent l'espace de « sidi mansour » en `%20` : c'est ce que fait `encodeURIComponent`.

Lancer : `pnpm exec vitest run --project unit tests/unit/system/smoke.test.ts`
Attendu : tous les tests passent.

- [ ] **Étape 4 : le script**

Créer `scripts/smoke.ts` :

```ts
// Plan 5, tâche 6 : pnpm smoke <url> [--query "<requête>"] — vérifie un déploiement de l'extérieur.
import { runSmoke } from "@/lib/system/smoke";

async function main(argv: string[]): Promise<number> {
  const at = argv.indexOf("--query");
  const query = at >= 0 ? argv[at + 1] : undefined;
  const url = argv.find((arg, i) => !arg.startsWith("--") && (at < 0 || i !== at + 1));
  if (!url || !/^https?:\/\//.test(url) || (at >= 0 && !query)) {
    console.error('Usage : pnpm smoke <url> [--query "<requête>"]');
    return 1;
  }
  const checks = await runSmoke(url, { fetch, query });
  for (const check of checks) console.log(`${check.ok ? "✓" : "✗"} ${check.name} — ${check.detail}`);
  const failures = checks.filter((c) => !c.ok).length;
  console.log(failures === 0 ? "Déploiement vérifié." : `${failures} vérification(s) en échec.`);
  return failures === 0 ? 0 : 1;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  },
);
```

Dans `package.json`, ajouter : `"smoke": "tsx scripts/smoke.ts"`.

- [ ] **Étape 5 : essai sur un build local**

La base de développement doit contenir le catalogue de développement (`pnpm seed:fixtures` puis `pnpm seed:demo` si besoin) :

```bash
pnpm build
```

```bash
BETTER_AUTH_SECRET=$(openssl rand -base64 32) BETTER_AUTH_URL=http://localhost:3200 pnpm start -p 3200
```

Dans un autre terminal :

```bash
pnpm smoke http://localhost:3200
```

Attendu : sept lignes `✓`, puis « Déploiement vérifié. », code de sortie 0. Puis `pnpm smoke http://localhost:3200 --query "zzzzqqq"` : `✗ recherche`, code de sortie 1. Puis `pnpm smoke pas-une-url` : l'usage, code 1. Arrêter le serveur.

- [ ] **Étape 6 : suites et commit**

Lancer : `pnpm test`, `pnpm typecheck`, `pnpm lint`.

```bash
git add src/lib/system/smoke.ts scripts/smoke.ts package.json tests/unit/system/smoke.test.ts
git commit -m "feat(exploitation): pnpm smoke vérifie un déploiement de l'extérieur"
```

---

### Tâche 7 : guide d'exploitation, README, spec

**Files:**
- Create: `docs/exploitation/mise-en-production.md`
- Modify: `README.md`, `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md`, ce plan (« État des tâches »)

**Interfaces:**
- Consumes: `pnpm env:check` (tâche 1), `vercel.json` (tâche 3), `SITE_INDEXABLE` (tâche 4), `/api/sante` (tâche 5), `pnpm smoke` (tâche 6).
- Produces: le guide que suit la tâche 8, section par section.

- [ ] **Étape 1 : le guide**

Créer `docs/exploitation/mise-en-production.md` avec ce contenu (le compléter si les tâches 1 à 6 ont noté des écarts) :

````markdown
# Mise en production

Guide pas à pas de la première mise en ligne sur Vercel et Neon (plan 5). Chaque étape dit qui la fait, quoi
vérifier, et ce qui doit en sortir. Les comptes, les secrets et les paiements restent entre les mains de la
personne qui exploite le site : ne jamais coller un secret dans une conversation, un ticket ou un commit.

## 0. Décisions à prendre avant de commencer

- **Nom de domaine** : l'adresse publique (`https://…`), qui sera `BETTER_AUTH_URL`.
- **Fournisseur d'e-mails** : Resend, Brevo, Mailjet ou Postmark, en SMTP. Il faut pouvoir modifier les DNS
  du domaine (SPF, DKIM).
- **Stockage objet des sauvegardes** : Cloudflare R2, Backblaze B2, Scaleway ou AWS S3.
- **Plan Neon** : la base fait environ 275 Mo après l'import LRCLIB de novembre 2026 (48 000 chansons, mesure
  du plan 1). Mesurer la taille réelle avec le dry-run (section 3) avant de choisir le plan : l'offre gratuite
  peut être trop petite, avec les index de recherche.
- **Google** : facultatif. Sans lui, la connexion se fait par lien e-mail seulement.

## 1. Neon

1. Créer un projet PostgreSQL 17, région **AWS Europe Central 1 (Frankfurt)**, la même que les fonctions
   Vercel (`vercel.json`, `fra1`).
2. Récupérer deux URL : l'URL **directe** (migrations, imports, sauvegarde, scripts) et l'URL **poolée**
   (`-pooler` dans le nom d'hôte, pour l'application).
3. Vérifier la locale : `psql "<url directe>" -c "SELECT show_trgm('سيدي');"` renvoie des trigrammes.
   Sinon, `pg_trgm` ignore les lettres arabes : ne pas continuer.

## 2. Migrations

```bash
DATABASE_URL="<url directe>" pnpm db:migrate
```

Attendu : « Migrations appliquées. » À relancer avant chaque déploiement qui ajoute un fichier dans `drizzle/`.

## 3. Catalogue

1. Domaine public : `DATABASE_URL="<url directe>" pnpm import:public-domain`.
2. LRCLIB : suivre « Import LRCLIB » du README, `--dry-run` d'abord, en local (jamais sur le serveur), avec
   `DATABASE_URL="<url directe>"`. Le premier import réel prend de l'ordre d'une heure par le réseau.
3. `psql "<url directe>" -c "VACUUM ANALYZE songs; VACUUM ANALYZE artists;"`
4. Benchmark sur la production : `DATABASE_URL="<url directe>" pnpm bench:search --sample 1000`.
   Attendu : p95 inférieur à 300 ms et toutes les requêtes de référence trouvées (spec §6.3). Ce benchmark
   mesure depuis le poste : ajouter la latence réseau du poste vers Francfort à l'interprétation, ou relancer
   la mesure depuis une machine en Europe.

## 4. E-mails

1. Créer le compte chez le fournisseur, vérifier le domaine d'envoi (SPF, DKIM, et DMARC si possible).
2. Noter `SMTP_URL=smtps://utilisateur:motdepasse@smtp.fournisseur:465` et
   `MAIL_FROM="Ghnaya <connexion@domaine>"`.

## 5. Google (facultatif)

Identifiant OAuth « Application Web » dans Google Cloud Console, redirection
`https://<domaine>/api/auth/callback/google`. Noter `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`, ou n'en
mettre aucun des deux.

## 6. Translittération

1. Créer une clé dans la console Anthropic, avec un plafond de dépense mensuel (README, « Translittération » :
   4 à 7 $ par jour au plafond de 300 générations).
2. Essai avant activation, sur une chanson courte puis sur une chanson de 80 à 100 lignes :
   `ANTHROPIC_API_KEY=… DATABASE_URL="<url directe>" pnpm translit:try <id>`.
   Attendu : moins de 30 s, autant de lignes latines que de lignes arabes, conventions 3, 7, 9, ch, kh, gh.
   Sinon, laisser `TRANSLIT_PROVIDER=none` en production et ouvrir un ticket.

## 7. Configuration de production

1. Écrire les variables dans un fichier local **ignoré par git**, par exemple `.env.production.local` :
   `DATABASE_URL` (poolée), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL`,
   `SMTP_URL`, `MAIL_FROM`, `ANTHROPIC_API_KEY` (ou `TRANSLIT_PROVIDER=none`), `GOOGLE_CLIENT_ID` et
   `GOOGLE_CLIENT_SECRET` (ou aucun). Ne pas définir `TRUSTED_PROXY_HOPS`, `MAIL_TRANSPORT`, ni
   `SITE_INDEXABLE` (section 12).
2. `pnpm env:check --file .env.production.local` → « Configuration de production valide. »
3. `git status` ne montre pas le fichier.

## 8. Vercel

1. Importer le dépôt GitHub. Vérifier que Fluid Compute est actif (réglages du projet, « Functions »).
2. Coller les variables de la section 7 dans l'environnement **Production**, en « Sensitive » pour les secrets.
   Supprimer ensuite `.env.production.local`.
3. **Prévisualisations** : soit les désactiver pour l'instant, soit leur donner une branche Neon à part
   (jamais la base de production) et leur propre `BETTER_AUTH_URL`, comme le dit le README (« Comptes »).
4. Domaine : l'ajouter au projet, et rediriger `www.` et l'alias `*.vercel.app` vers l'adresse canonique.
5. Déployer.

## 9. Vérifier le déploiement

```bash
pnpm smoke https://<domaine>
```

Attendu : sept `✓` et « Déploiement vérifié. ». Si `santé` échoue sur `migrations_pending`, refaire la
section 2. Si le site répond 500 partout, lire les journaux Vercel : « Configuration de production invalide »
nomme les variables à corriger. Une erreur serveur se retrouve par sa référence, affichée sur la page d'erreur,
en filtrant les journaux sur `"event":"server_error"`.

Puis, sur un téléphone : se connecter par lien e-mail (le lien arrive, hors courrier indésirable), chercher
« sidi mansour » et « سيدي منصور », ouvrir une chanson, activer « Arabe + latin ».

## 10. Premier admin

Se connecter une fois sur le site, puis :

```bash
DATABASE_URL="<url directe>" pnpm user:role <adresse> --role admin --animator
```

## 11. Sauvegardes

1. Créer le bucket et une clé d'accès limitée à ce bucket, avec une règle de cycle de vie (par exemple
   30 jours).
2. Dans GitHub, définir les secrets `BACKUP_DATABASE_URL` (URL directe), `BACKUP_S3_BUCKET`,
   `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`, `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`.
3. Lancer « Sauvegarde nocturne » à la main (onglet Actions, « Run workflow ») : le run doit être vert et le
   fichier `ghanni-<date>.dump` présent dans le bucket.
4. Tester la restauration sur une branche Neon jetable : `pg_restore --clean --no-owner -d "<url de la branche>" ghanni-<date>.dump`,
   puis `DATABASE_URL="<url de la branche>" pnpm bench:search` ; supprimer la branche ensuite. À refaire une fois
   par trimestre.

## 12. Ouverture publique

Tant que `SITE_INDEXABLE` n'est pas défini, le site est en ligne mais fermé aux moteurs de recherche
(`robots.txt` et `X-Robots-Tag`). **Avant l'ouverture**, faire relire par un juriste la procédure de retrait
(`/a-propos/droits`) et l'usage des paroles importées (spec §14). Ensuite seulement, définir
`SITE_INDEXABLE=true` dans Vercel et **redéployer** (la valeur est lue au build), puis vérifier :
`curl -sI https://<domaine>/ | grep -i x-robots-tag` ne renvoie rien.

## À chaque déploiement suivant

1. S'il y a une nouvelle migration : section 2, **avant** de déployer le code.
2. Déployer (push sur `main`).
3. `pnpm smoke https://<domaine>`.
````

- [ ] **Étape 2 : README**

- Section « Déploiement (Vercel + Neon) » : remplacer les étapes par un renvoi au guide (« Suivre `docs/exploitation/mise-en-production.md` »), en gardant un résumé de trois lignes (Neon à Francfort, Vercel en `fra1`, vérification par `pnpm smoke`).
- Nouvelle section « Exploitation » : `pnpm env:check [--file <chemin>]`, `GET /api/sante` (200 ou 503, statuts `ok`, `migrations_pending`, `db_unreachable`), `pnpm smoke <url> [--query "<requête>"]`, journal JSON des erreurs (`"event":"server_error"`, référence affichée sur la page d'erreur), `SITE_INDEXABLE` (lu au build).
- Section « Translittération » : retirer « Ne jamais mettre `TRANSLIT_PROVIDER=fake` en production » au profit de « refusé au démarrage en production hors de localhost (plan 5) ».

- [ ] **Étape 3 : spec**

Dans `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md`, ajouter des mentions datées, sans réécrire le texte d'origine :
- §4.4 Pages : une ligne `GET /api/sante` « État de la base et des migrations, pour la vérification après déploiement *(ajoutée le 24/11/2026, plan 5)* » ;
- §12 **Erreurs** : *(24/11/2026, plan 5 : l'identifiant de corrélation est la référence `digest` de Next, affichée sur la page d'erreur et écrite dans une ligne JSON `"event":"server_error"` ; une configuration de production incomplète empêche le démarrage.)* ;
- §12 **Hébergement retenu** : *(24/11/2026, plan 5 : Neon et les fonctions Vercel à Francfort ; en-têtes de sécurité ; guide `docs/exploitation/mise-en-production.md`.)* ;
- §14 **Droits d'auteur** : *(24/11/2026, plan 5 : le site reste fermé aux moteurs de recherche tant que `SITE_INDEXABLE` ne vaut pas `true`, à définir après l'avis juridique.)*

- [ ] **Étape 4 : état du plan, vérification finale de la partie A**

Lancer : `pnpm test`, `pnpm test:integration`, `pnpm typecheck`, `pnpm lint`, `pnpm test:e2e`.
Remplir les lignes 1 à 7 d'« État des tâches » : date, commit, vérifications, écarts ; et les totaux de tests.

- [ ] **Étape 5 : commit**

```bash
git add docs/exploitation/mise-en-production.md README.md docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md docs/superpowers/plans/2026-11-24-plan-5-mise-en-production.md
git commit -m "docs(exploitation): guide de mise en production, README et spec datés"
```

Pousser la branche et vérifier que la CI passe sur GitHub (jobs `test` et `docker`) : le job `docker` démarre désormais l'image avec la configuration de la tâche 1.

---

## Partie B — La mise en ligne

### Tâche 8 : mise en ligne avec l'utilisateur

**Files:**
- Modify: ce plan (« État des tâches », ligne 8, et « Non couvert par les vérifications »)

**Interfaces:**
- Consumes: `docs/exploitation/mise-en-production.md` (tâche 7), et la partie A fusionnée dans `main`.

Cette tâche ne s'exécute pas en sous-agent : elle demande l'utilisateur à chaque section. Pour chacune des sections 0 à 12 du guide :

- [ ] **Étape 1 : annoncer la section**, dire ce que l'utilisateur doit faire lui-même (créer un compte, saisir un secret, choisir une offre payante, accepter des conditions) et ce que l'agent fera ensuite (lancer une commande, vérifier).
- [ ] **Étape 2 : attendre** que l'utilisateur dise que sa part est faite. Ne jamais lui demander de coller un secret dans la conversation : les commandes qui en ont besoin, il les lance lui-même dans son terminal, ou il définit la variable dans son shell avant que l'agent lance la commande.
- [ ] **Étape 3 : vérifier** par la commande de la section, et comparer au résultat attendu du guide. En cas d'écart, s'arrêter, diagnostiquer (`superpowers:systematic-debugging`), corriger le code ou le guide par un commit à part, et reprendre la section.
- [ ] **Étape 4 : noter** dans « État des tâches » ce qui a été fait et constaté : taille de la base après import, durée de l'import, p95 du benchmark, durée de `pnpm translit:try` sur la chanson courte et la longue, résultat de `pnpm smoke`, premier run de la sauvegarde, restauration testée. Aucune valeur secrète, aucune adresse e-mail.

Ordre imposé :
- la section 2 (migrations) avant tout déploiement ;
- la section 6 (essai de la translittération) avant de mettre `ANTHROPIC_API_KEY` en production ;
- la section 12 (ouverture) **seulement** après que l'utilisateur a confirmé l'avis juridique. Sans cette confirmation, la tâche 8 se termine avec le site en ligne et fermé à l'indexation, ce qui est un état final valide de ce plan.

- [ ] **Étape 5 : fin**

Remplir la ligne 8 d'« État des tâches » et « Non couvert par les vérifications » (par exemple : la connexion Google si elle n'est pas activée, le parcours sur iPhone si seul Android a été essayé, l'ouverture publique si elle n'a pas eu lieu).

```bash
git add docs/superpowers/plans/2026-11-24-plan-5-mise-en-production.md
git commit -m "docs(plan-5): mise en ligne, état du plan"
```

---

## Couverture de la spec

| Exigence | Tâche |
|---|---|
| §1 Recherche en moins de 300 ms au p95, côté serveur, sur la base réelle | 3 (région), 8 (benchmark sur la production) |
| §6.3 Benchmark sur la base importée | 7 (guide), 8 |
| §11 Import LRCLIB en local, `--dry-run` avant le premier import réel ; domaine public | 7 (guide), 8 |
| §12 Exceptions serveur journalisées avec un identifiant de corrélation ; page d'erreur générique | 2 (la page existe depuis le plan 1) |
| §12 Hébergement Vercel et Neon | 3, 7, 8 |
| §12 Sauvegarde nocturne `pg_dump` vers un stockage objet | 7 (guide), 8 (secrets, premier run, restauration) |
| §12 CI à chaque pull request | 1 (job `docker`), 7 (CI vérifiée sur GitHub) |
| §12 Limites par IP derrière le proxy de Vercel | 1 (`TRUSTED_PROXY_HOPS` vérifiée au démarrage) |
| §7 Translittération réelle, coût maîtrisé | 1 (fournisseur vérifié), 3 (durée), 8 (essai avec une clé) |
| §14 Avis juridique avant l'ouverture publique | 4 (`SITE_INDEXABLE`), 8 (section 12) |
| §10 Écran allumé (Wake Lock) | 4 (`Permissions-Policy` ne le coupe pas, vérifié en bout en bout) |

**Hors de ce plan** :

| Sujet | Raison |
|---|---|
| Page intermédiaire du lien magique, contre les antivirus de messagerie qui l'ouvrent avant la personne (plans 2 et 3) | Dette, plan à part |
| Politique de sécurité du contenu pour les scripts, avec nonces | Écart 6 |
| Service d'observabilité externe (Sentry…) et alertes | Écart 7 ; `/api/sante` permet d'y brancher une surveillance plus tard |
| Prévisualisations Vercel avec comptes (une `BETTER_AUTH_URL` par déploiement) | Désactivées ou sur une branche Neon (guide, section 8) |
| Hébergement sur l'image Docker | Prévu pour plus tard (spec §12) ; la tâche 1 garde son job de CI vert |
| Fonctions hors MVP (spec §3) | Plans suivants |
