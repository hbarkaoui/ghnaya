# Plan 1 — Catalogue consultable et recherche — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objectif** : une application web, utilisable sur mobile, où l'on cherche une chanson arabe ou tunisienne par titre, paroles ou artiste, en écriture arabe comme en arabizi, et où l'on consulte la page de la chanson et celle de l'artiste. Le catalogue est rempli par l'import LRCLIB et par les fichiers du domaine public.

**Architecture** : une seule application Next.js (App Router, TypeScript strict) appuyée sur PostgreSQL via Drizzle.
- `src/lib/text` contient des fonctions pures de normalisation, dont la clé de consonnes commune à l'arabe et à l'arabizi.
- `src/lib/search` expose une seule fonction, `searchSongs`, implémentée en SQL avec `pg_trgm`.
- Les imports sont des scripts en ligne de commande (`tsx`) qui réutilisent `lib/text` et `lib/catalog`.

**Stack** : Node 22 LTS, pnpm, Next.js (dernière version stable), React, Tailwind CSS, next-intl, Drizzle ORM avec drizzle-kit et le pilote `pg`, PostgreSQL 16, zod, yaml, better-sqlite3, Vitest, Playwright, GitHub Actions.

**Spec** : `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md`

**Plans suivants**, hors de ce plan :
- Plan 2 : comptes, playlists, clubs et lecteur ;
- Plan 3 : contributions, modération et signalements ;
- Plan 4 : translittération.

Ce plan crée déjà les colonnes `lyrics_translit`, `translit_status` et `import_locked`, dont ces plans auront besoin.

## Contraintes globales

- TypeScript `strict: true`. Aucun `any` explicite.
- PostgreSQL 16 ou plus récent, avec les extensions `pg_trgm` et `unaccent`. La base doit être créée avec une locale UTF-8 (`en_US.utf8` ou `C.UTF-8`), sinon `pg_trgm` ignore les lettres arabes. Un test le vérifie.
- Les paroles et les notes sont toujours rendues en texte brut, jamais en HTML : pas de `dangerouslySetInnerHTML`.
- Les paroles arabes sont toujours affichées dans un élément `dir="rtl" lang="ar"`.
- L'interface est en français et en arabe. Pour l'arabe, `<html dir="rtl">`. La langue est choisie par le cookie `locale` (`fr` ou `ar`) ; à défaut, par l'en-tête `Accept-Language` ; à défaut, le français.
- **Recherche** :
  - pages de 20 résultats ;
  - une requête de moins de 2 caractères significatifs (lettres ou chiffres) ne lance pas de recherche ;
  - objectif de latence : p95 inférieur à 300 ms sur 200 000 chansons ;
  - limite : 60 requêtes par minute et par IP.
- **Import LRCLIB** :
  - garder une chanson seulement si les lettres arabes représentent au moins 50 % des lettres de `plain_lyrics` ;
  - exclure les morceaux `instrumental` ;
  - le script est idempotent et propose une option `--dry-run`.
- **Domaine public** : accepté si `traditional: true`, ou si `author_death_year <= année courante − 51`.
- **Aucun import n'écrase une chanson verrouillée** (`import_locked = true`) et aucun import ne modifie `status`.
- Les commits suivent Conventional Commits (`feat:`, `test:`, `chore:`…).

## Écarts assumés par rapport à la spec, à confirmer en revue

1. **Seuil de similarité.** La recherche utilise `word_similarity`, l'opérateur `<%`, avec un seuil de 0,5, au lieu de `similarity` avec 0,3. La requête est en effet presque toujours plus courte que le texte indexé (titre et artistes), et `similarity` pénalise fortement cet écart de longueur. Le seuil sera ajusté par le benchmark de la tâche 15.
2. **Dédoublonnage.** En plus de `unique(source, source_ref)`, une contrainte unique partielle porte sur `(source, dedupe_key)`. L'import met à jour une chanson existante (upsert) sur cette clé, ce qui reste idempotent même si LRCLIB publie une meilleure version d'une chanson sous un autre identifiant.
3. **Chanson retirée.** Une chanson retirée renvoie une page « introuvable ou retirée » avec le statut **404**, et non 410 : l'App Router de Next.js ne sait pas renvoyer 410 depuis une page.

## Adaptation au code existant (21/11/2026)

L'interface a été construite avant ce plan, sur des données fictives (`.design/ghnaya/TASKS.md`, 22 tâches, fusionnées dans `main`). Ce plan reste la référence du back-end. Cette section dit ce qui change. Elle l'emporte sur le texte des tâches quand les deux divergent.

### État des tâches

| Tâche | État | Ce qui reste, ou ce qui change |
|---|---|---|
| 1. Socle | Faite le 21/11/2026 | Next.js, Tailwind, next-intl, Vitest et les scripts `test`, `typecheck` et `lint` existent. Reste : les dépendances de la base, `.env`, les projets Vitest `unit` et `integration` (dans `vitest.config.mts`), les scripts `db:*` et `tsconfig` en ES2022. pnpm 12 autorise les scripts de compilation par `allowBuilds` dans `pnpm-workspace.yaml`, et non par `onlyBuiltDependencies`. |
| 2. Normalisation | Faite | `src/lib/text`, `tests/unit/text/normalize.test.ts`. |
| 3. Clé de consonnes | Faite | `searchKey.ts`, `searchKeyMap.ts` et leurs tests. |
| 4. Titres | Faite le 21/11/2026 | Sans changement. |
| 5. Schéma | Faite le 21/11/2026 | `DIALECTS` et `Dialect` restent dans `@/types/catalog`, et le schéma les importe : une seule liste. |
| 6. Écriture du catalogue | Faite le 21/11/2026 | Sans changement. |
| 7. Recherche | Faite le 21/11/2026 | Les types, `prepareQuery` et `findSnippet` existent (`src/lib/search/query.ts`). Reste : la requête SQL dans `searchSongs`. Voir aussi « Jeu de test » et l'écart 4 ci-dessous. |
| 8. Lecture du catalogue | Faite le 21/11/2026, adaptée | `getSongById` renvoie le type `Song` des écrans. La page artiste est paginée par 50 (IA, « Croissance du contenu ») : `getArtistPage(id, page)` renvoie la forme `ArtistPage` déjà utilisée par l'écran, à la place de `getArtistWithSongs`. |
| 9. Limite de débit | Faite le 21/11/2026 | Branchée dans `/recherche`. L'aperçu `?apercu=limite` reste pour le développement. |
| 10. Import LRCLIB | Faite le 21/11/2026, sauf le passage sur l'export réel | Le code et ses tests n'ont pas besoin de l'export réel. Le premier passage sur l'export (plusieurs dizaines de Go à télécharger) se fait à part, avec l'accord de l'utilisateur : voir « Import LRCLIB » dans le README. |
| 11. Domaine public | Faite le 21/11/2026 | Sans changement. `pnpm import:public-domain --dry-run` : 1 chanson, aucun refus. |
| 12. Interface, accueil, recherche | Remplacée | Déjà construite : langue, messages, mise en page, manifeste, page d'erreur, `SearchBar`, `SongResultItem`, `/recherche`. Reste seulement le branchement, dans la tâche 13 adaptée. |
| 13. Fiche chanson, page artiste | Faite le 21/11/2026 (branchement) | Les pages existent. On les branche sur la base par la passerelle décrite plus bas. |
| 14. Bout en bout | À faire (le script `seed-fixtures` de l'étape 1 est écrit) | Demande de télécharger les navigateurs de Playwright, avec accord. |
| 15. Benchmark | À faire | Après le premier import réel. |
| 16. CI, Docker, déploiement | À faire | Le dépôt n'a pas encore de remote GitHub. |

### Base locale

En local, PostgreSQL 16 est installé par Homebrew (`postgresql@16`) et écoute sur le port **5433**, avec le rôle `ghanni` et les bases `ghanni` et `ghanni_test` en `en_US.UTF-8`. Les URL de `.env.example` sont donc les mêmes qu'avec Docker. Le `docker-compose.yml` de la tâche 1 est écrit quand même, pour la CI et pour un autre poste.

### Jeu de test

Le jeu de test est le **catalogue fictif** (`src/mocks/catalog.ts`), et non `FIXTURE_SONGS`. Ses paroles sont déjà inventées, sauf Chebbi (domaine public). Ses requêtes de référence sont déjà adaptées (`tests/unit/search/searchSongs.test.ts`). Et c'est le jeu que montrent les écrans. `seedFixtures(db)` l'écrit en base et renvoie la correspondance entre l'identifiant fictif (`s-sidi-mansour`) et l'UUID en base. Les requêtes de référence passent dans `tests/fixtures/search-golden.ts`.

### Passerelle entre le catalogue fictif et la base

Les identifiants fictifs sont des slugs (`s-sidi-mansour`, `a-saber`), ceux de la base sont des UUID. Les playlists, les clubs, les propositions et les signalements restent fictifs jusqu'aux plans 2 et 3, et ils citent des chansons fictives. Pourtant, une chanson trouvée par la recherche doit pouvoir être ouverte, lue, ajoutée à une playlist, signalée ou corrigée.

`src/lib/catalog/read.ts` (`server-only`) est donc la seule porte de lecture du catalogue pour les écrans :
- `getSong(id)` : un UUID est lu en base (`getSongById`) ; sinon, dans le catalogue fictif ;
- `getArtistPage(id, page)` : même règle.

Tous les appels actuels de `getSong` du catalogue fictif passent par elle, et deviennent asynchrones. Les plans 2 et 3 retireront la branche fictive en déplaçant les playlists, les propositions et les signalements en base.

Limites connues jusque-là :
- la modération (`songStore`) ne modifie que le catalogue fictif ;
- l'encadré « existe peut-être déjà » de `/contribuer` cherche dans le catalogue fictif ;
- l'aperçu `?apercu=pagination` de `/recherche` cherche dans le catalogue fictif.

### Écart 4 : clé de consonnes courte

Repris de la maquette (`src/mocks/search.ts`) : la clé de consonnes n'est pas comparée aux titres et aux artistes en dessous de 3 consonnes. Sinon, « ya lella » (clé `l`) ressort presque tout le catalogue, car `l` figure dans la plupart des clés.

## Structure des fichiers

```text
package.json, tsconfig.json, next.config.ts, drizzle.config.ts, vitest.config.ts, playwright.config.ts
docker-compose.yml, docker/initdb/01-test-db.sql, .env.example, Dockerfile, README.md
.github/workflows/ci.yml, .github/workflows/backup.yml
drizzle/                                 # migrations générées et migration SQL personnalisée
messages/fr.json, messages/ar.json
data/public-domain/*.yaml                # œuvres du domaine public, préparées à la main
data/search-golden.yaml                  # requêtes de référence sur les données réelles (tâche 15)
src/lib/text/normalizeArabic.ts          # normalisation de l'arabe pour search_ar
src/lib/text/normalizeLatin.ts           # normalisation du latin pour search_latin et identity_key
src/lib/text/detectScript.ts             # détecte l'écriture d'un texte et compte les caractères significatifs
src/lib/text/searchKeyMap.ts             # table de correspondance des consonnes, en un seul endroit
src/lib/text/searchKey.ts                # toSearchKey : squelette de consonnes commun
src/lib/text/titles.ts                   # cleanImportedTitle, splitArtists, splitTitleScripts
src/lib/text/arabicRatio.ts              # part de lettres arabes dans un texte
src/lib/db/schema.ts                     # schéma Drizzle
src/lib/db/client.ts                     # pool pg et instance drizzle
src/lib/catalog/searchColumns.ts         # calcule les colonnes de recherche des chansons et des artistes
src/lib/catalog/artists.ts               # upsertArtist, artistIdentityKey
src/lib/catalog/songs.ts                 # upsertSong
src/lib/catalog/queries.ts               # getSongById, getArtistWithSongs
src/lib/search/types.ts                  # SongHit, SearchResult, SearchOptions
src/lib/search/searchSongs.ts            # interface unique de recherche
src/lib/ratelimit/fixedWindow.ts         # limitation de débit dans PostgreSQL
src/i18n/request.ts                      # configuration next-intl, langue lue depuis le cookie
src/app/layout.tsx, src/app/page.tsx, src/app/actions/locale.ts
src/app/recherche/page.tsx
src/app/chanson/[id]/page.tsx, src/app/chanson/[id]/not-found.tsx
src/app/artiste/[id]/page.tsx
src/components/SearchBar.tsx, SongResultItem.tsx, LyricsView.tsx, LocaleSwitcher.tsx, ArtistNames.tsx
scripts/migrate.ts, scripts/seed-fixtures.ts, scripts/bench-search.ts
scripts/import/lrclibReader.ts           # lecture en flux de l'export SQLite
scripts/import/lrclibTransform.ts        # fonctions pures : filtre, nettoyage, dédoublonnage
scripts/import/artistAliases.ts, scripts/import/artist-aliases.yaml
scripts/import/lrclib.ts                 # commande d'import LRCLIB
scripts/import/publicDomainSchema.ts, scripts/import/publicDomain.ts
tests/unit/**, tests/integration/**, tests/e2e/**, tests/fixtures/songs.ts
```

---

### Tâche 1 : socle du projet

**Fichiers :**
- Créer : l'application Next.js à la racine, `docker-compose.yml`, `docker/initdb/01-test-db.sql`, `.env.example`, `vitest.config.ts`
- Modifier : `package.json` (scripts), `tsconfig.json`, `.gitignore`

**Interfaces :**
- Produit :
  - les scripts `pnpm test` (tests unitaires), `pnpm test:integration`, `pnpm typecheck` et `pnpm lint` ;
  - l'alias d'import `@/` vers `src/` ;
  - une base de développement `ghanni` et une base de test `ghanni_test`, toutes deux sur `localhost:5433`.

- [ ] **Étape 1 : créer l'application Next.js.** Le dossier contient déjà `docs/` : on la crée donc dans un sous-dossier temporaire, que l'on rapatrie ensuite.

```bash
pnpm create next-app@latest app-tmp --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
rsync -a app-tmp/ ./ && rm -rf app-tmp
git init && git add -A && git commit -m "chore: scaffold Next.js app"
```

- [ ] **Étape 2 : installer les dépendances.**

```bash
pnpm add drizzle-orm pg zod next-intl yaml dotenv
pnpm add -D drizzle-kit @types/pg better-sqlite3 @types/better-sqlite3 vitest tsx @playwright/test
```

`better-sqlite3` ne sert qu'aux scripts d'import ; c'est un module natif. pnpm 10 bloque par défaut les scripts de compilation des dépendances. Ajouter donc à `package.json` :

```json
{ "pnpm": { "onlyBuiltDependencies": ["better-sqlite3"] } }
```

puis relancer `pnpm install`.

- [ ] **Étape 3 : créer `docker-compose.yml`.**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ghanni
      POSTGRES_PASSWORD: ghanni
      POSTGRES_DB: ghanni
      LANG: en_US.utf8
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/initdb:/docker-entrypoint-initdb.d
volumes:
  pgdata:
```

- [ ] **Étape 4 : créer `docker/initdb/01-test-db.sql`.**

```sql
CREATE DATABASE ghanni_test;
```

- [ ] **Étape 5 : créer `.env.example`, puis le copier en `.env`.**

```bash
DATABASE_URL=postgres://ghanni:ghanni@localhost:5433/ghanni
DATABASE_URL_TEST=postgres://ghanni:ghanni@localhost:5433/ghanni_test
```

Lancer `cp .env.example .env`. Ajouter `.env` à `.gitignore` s'il n'y figure pas déjà.

- [ ] **Étape 6 : créer `vitest.config.ts`.**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['tests/integration/globalSetup.ts'],
          fileParallelism: false,
          env: {
            DATABASE_URL:
              process.env.DATABASE_URL_TEST ?? 'postgres://ghanni:ghanni@localhost:5433/ghanni_test',
          },
        },
      },
    ],
  },
});
```

- [ ] **Étape 7 : ajouter les scripts dans `package.json`.** Fusionner dans `"scripts"`, en gardant `dev`, `build`, `start` et `lint` déjà générés :

```json
{
  "test": "vitest run --project unit --passWithNoTests",
  "test:integration": "vitest run --project integration --passWithNoTests",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx scripts/migrate.ts",
  "seed:fixtures": "tsx scripts/seed-fixtures.ts",
  "import:lrclib": "tsx scripts/import/lrclib.ts",
  "import:public-domain": "tsx scripts/import/publicDomain.ts",
  "bench:search": "tsx scripts/bench-search.ts"
}
```

Dans `tsconfig.json`, vérifier que `"strict": true` est présent. Mettre `"target": "ES2022"`, nécessaire pour que TypeScript accepte les classes Unicode `\p{…}` des expressions régulières. Ajouter `"tests/**/*.ts"` et `"scripts/**/*.ts"` à `"include"`.

- [ ] **Étape 8 : vérifier.**

```bash
docker compose up -d db
pnpm typecheck && pnpm lint && pnpm test
docker compose exec db psql -U ghanni -c '\l' | grep ghanni_test
```

Attendu : les trois commandes `pnpm` réussissent, et la dernière affiche une ligne `ghanni_test`.

- [ ] **Étape 9 : commit.**

```bash
git add -A && git commit -m "chore: add tooling, docker postgres and vitest projects"
```

---

### Tâche 2 : normalisation de l'arabe et du latin, détection de l'écriture

**Fichiers :**
- Créer : `src/lib/text/normalizeArabic.ts`, `src/lib/text/normalizeLatin.ts`, `src/lib/text/detectScript.ts`
- Tester : `tests/unit/text/normalize.test.ts`

**Interfaces :**
- Produit :
  - `normalizeArabic(input: string): string`
  - `normalizeLatin(input: string): string`
  - `type Script = 'arabic' | 'latin' | 'mixed'`
  - `detectScript(input: string): Script`
  - `countSignificant(input: string): number`

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

```ts
// tests/unit/text/normalize.test.ts
import { describe, expect, it } from 'vitest';
import { normalizeArabic } from '@/lib/text/normalizeArabic';
import { normalizeLatin } from '@/lib/text/normalizeLatin';
import { countSignificant, detectScript } from '@/lib/text/detectScript';

describe('normalizeArabic', () => {
  it('supprime tashkeel et tatweel', () => {
    expect(normalizeArabic('غَنّـــي')).toBe('غني');
  });
  it('unifie les variantes de lettres', () => {
    expect(normalizeArabic('أإآٱ')).toBe('اااا');
    expect(normalizeArabic('على')).toBe('علي');
    expect(normalizeArabic('ليلة')).toBe('ليله');
    expect(normalizeArabic('مؤمن سائل')).toBe('مومن سايل');
    expect(normalizeArabic('کتاب ی')).toBe('كتاب ي');
  });
  it('convertit les chiffres arabo-indiens', () => {
    expect(normalizeArabic('٣ ۷')).toBe('3 7');
  });
  it('remplace la ponctuation et réduit les espaces', () => {
    expect(normalizeArabic('  يا  ليل،\n يا عين!  ')).toBe('يا ليل يا عين');
  });
});

describe('normalizeLatin', () => {
  it('minuscules, sans accents ni ponctuation', () => {
    expect(normalizeLatin('Saber Rebaï — (Live)')).toBe('saber rebai live');
  });
  it('garde les chiffres de l’arabizi', () => {
    expect(normalizeLatin('Ana wel 3azab')).toBe('ana wel 3azab');
  });
});

describe('detectScript / countSignificant', () => {
  it('détecte arabe, latin et mixte', () => {
    expect(detectScript('سيدي منصور')).toBe('arabic');
    expect(detectScript('sidi mansour')).toBe('latin');
    expect(detectScript('Habaytak حبيتك')).toBe('mixed');
    expect(detectScript('3')).toBe('latin');
  });
  it('compte lettres et chiffres', () => {
    expect(countSignificant(' a ! ')).toBe(1);
    expect(countSignificant('يا 3')).toBe(3);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.**

Lancer `pnpm test -- tests/unit/text/normalize.test.ts`. Attendu : FAIL, avec une erreur indiquant que les modules sont introuvables.

- [ ] **Étape 3 : implémenter.**

```ts
// src/lib/text/normalizeArabic.ts
const MARKS_AND_TATWEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const LETTER_MAP: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
  'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي',
  'ک': 'ك', 'ی': 'ي',
};
const LETTER_RE = /[أإآٱىةؤئکی]/g;
const EASTERN_DIGITS = /[٠-٩۰-۹]/g;

export function normalizeArabic(input: string): string {
  return input
    .normalize('NFC')
    .replace(MARKS_AND_TATWEEL, '')
    .replace(LETTER_RE, (c) => LETTER_MAP[c] ?? c)
    .replace(EASTERN_DIGITS, (d) => {
      const code = d.charCodeAt(0);
      return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
    })
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
```

```ts
// src/lib/text/normalizeLatin.ts
export function normalizeLatin(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
```

```ts
// src/lib/text/detectScript.ts
export type Script = 'arabic' | 'latin' | 'mixed';

export function detectScript(input: string): Script {
  const arabic = (input.match(/(?=\p{L})\p{Script=Arabic}/gu) ?? []).length;
  const latin = (input.match(/\p{Script=Latin}/gu) ?? []).length;
  if (arabic > 0 && latin > 0) return 'mixed';
  if (arabic > 0) return 'arabic';
  return 'latin';
}

export function countSignificant(input: string): number {
  return (input.match(/[\p{L}\p{N}]/gu) ?? []).length;
}
```

`(?=\p{L})\p{Script=Arabic}` ne compte que les lettres arabes : les signes diacritiques et les chiffres arabes sont exclus.

- [ ] **Étape 4 : relancer les tests.** Lancer `pnpm test -- tests/unit/text/normalize.test.ts`. Attendu : PASS.

- [ ] **Étape 5 : commit.**

```bash
git add src/lib/text tests/unit/text && git commit -m "feat(text): arabic/latin normalization and script detection"
```

---

### Tâche 3 : clé de consonnes commune à l'arabe et à l'arabizi

**Fichiers :**
- Créer : `src/lib/text/searchKeyMap.ts`, `src/lib/text/searchKey.ts`
- Tester : `tests/unit/text/searchKey.test.ts`

**Interfaces :**
- Produit : `toSearchKey(input: string): string`. La sortie ne contient que les caractères `b t j h x d z r s c 3 g f k l m n`, sans espace, avec les doublons consécutifs réduits.

**Correspondances**, telles que la spec §6.1 les définit :

| Classe de la clé | Lettres arabes | Latin et arabizi |
|---|---|---|
| `b` | ب پ | b p |
| `t` | ت ط ث | t, `th` |
| `j` | ج | j, `dj` |
| `h` | ح ه | h, 7 |
| `x` | خ | `kh`, 5 |
| `d` | د ض | d |
| `z` | ذ ظ ز | z, `dh` |
| `r` | ر | r |
| `s` | س ص | s |
| `c` | ش چ | `ch`, `sh` |
| `3` | ع | 3 |
| `g` | غ | `gh`, 8 |
| `f` | ف ڤ | f v |
| `k` | ق ك ڨ گ | k q g c, 9 |
| `l`, `m`, `n` | ل م ن | l m n |
| retirés | ا و ي ى ء ة, et les marques après décomposition NFD | a e i o u w y, 0 1 2 4 6 |

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

```ts
// tests/unit/text/searchKey.test.ts
import { describe, expect, it } from 'vitest';
import { toSearchKey } from '@/lib/text/searchKey';

const SAME_KEY: Array<[string, string, string]> = [
  ['سيدي منصور', 'Sidi Mansour', 'sdmnsr'],
  ['سيدى منصور', 'sidi mansur', 'sdmnsr'],
  ['ولا', 'wala', 'l'],
  ['غنّي', 'Ghanni', 'gn'],
  ['أنا والعذاب', 'Ana wel 3azab', 'nl3zb'],
  ['ڨلبي', 'galbi', 'klb'],
  ['حبيبي', 'habibi', 'hb'],
  ['حبي', '7obi', 'hb'],
  ['شمس', 'chams', 'cms'],
  ['خليها', 'khalliha', 'xlh'],
  ['قلبي', '9albi', 'klb'],
];

describe('toSearchKey', () => {
  it.each(SAME_KEY)('%s et %s donnent %s', (ar, lat, key) => {
    expect(toSearchKey(ar)).toBe(key);
    expect(toSearchKey(lat)).toBe(key);
  });
  it('ignore la ponctuation et les caractères inconnus', () => {
    expect(toSearchKey('Sidi-Mansour !!')).toBe('sdmnsr');
  });
  it('renvoie une chaîne vide pour une entrée sans consonne', () => {
    expect(toSearchKey('aïe ي')).toBe('');
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/text/searchKey.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter.**

```ts
// src/lib/text/searchKeyMap.ts
// Unique source de vérité de la clé de consonnes (spec §6.1).
// Valeur '' = caractère retiré. Caractère absent de la table = ignoré.
export const LATIN_DIGRAPHS: Readonly<Record<string, string>> = {
  ch: 'c', sh: 'c', kh: 'x', gh: 'g', th: 't', dh: 'z', dj: 'j',
};

export const CHAR_MAP: Readonly<Record<string, string>> = {
  // Arabe
  'ب': 'b', 'پ': 'b',
  'ت': 't', 'ط': 't', 'ث': 't',
  'ج': 'j',
  'ح': 'h', 'ه': 'h',
  'خ': 'x',
  'د': 'd', 'ض': 'd',
  'ذ': 'z', 'ظ': 'z', 'ز': 'z',
  'ر': 'r',
  'س': 's', 'ص': 's',
  'ش': 'c', 'چ': 'c',
  'ع': '3',
  'غ': 'g',
  'ف': 'f', 'ڤ': 'f',
  'ق': 'k', 'ك': 'k', 'ڨ': 'k', 'گ': 'k', 'ک': 'k',
  'ل': 'l', 'م': 'm', 'ن': 'n',
  'ا': '', 'و': '', 'ي': '', 'ى': '', 'ء': '', 'ة': '', 'ی': '',
  // Latin / arabizi
  b: 'b', p: 'b', t: 't', j: 'j', h: 'h', d: 'd', z: 'z', r: 'r', s: 's',
  f: 'f', v: 'f', k: 'k', q: 'k', g: 'k', c: 'k', x: 'ks', l: 'l', m: 'm', n: 'n',
  a: '', e: '', i: '', o: '', u: '', w: '', y: '',
  '3': '3', '5': 'x', '7': 'h', '8': 'g', '9': 'k',
  '0': '', '1': '', '2': '', '4': '', '6': '',
};
```

```ts
// src/lib/text/searchKey.ts
import { CHAR_MAP, LATIN_DIGRAPHS } from './searchKeyMap';

// Limite connue : « th » latin vaut ت/ث, alors que « Fethi » s'écrit فتحي (ت + ح).
// Ces cas sont rattrapés par la similarité trigramme (spec §6.1).
export function toSearchKey(input: string): string {
  const s = input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ـ/g, '')
    .toLowerCase();
  let out = '';
  for (let i = 0; i < s.length; ) {
    const digraph = LATIN_DIGRAPHS[s.slice(i, i + 2)];
    if (digraph !== undefined) {
      out += digraph;
      i += 2;
      continue;
    }
    const mapped = CHAR_MAP[s[i]];
    if (mapped !== undefined) out += mapped;
    i += 1;
  }
  return out.replace(/(.)\1+/g, '$1');
}
```

- [ ] **Étape 4 : relancer les tests.** Lancer `pnpm test -- tests/unit/text/searchKey.test.ts`. Attendu : PASS.

- [ ] **Étape 5 : commit.**

```bash
git add src/lib/text tests/unit/text && git commit -m "feat(text): shared consonant search key for arabic and arabizi"
```

---

### Tâche 4 : nettoyage des titres et des artistes, part d'écriture arabe

**Fichiers :**
- Créer : `src/lib/text/titles.ts`, `src/lib/text/arabicRatio.ts`
- Tester : `tests/unit/text/titles.test.ts`

**Interfaces :**
- Consomme : `detectScript` (tâche 2), `normalizeLatin` (tâche 2).
- Produit :
  - `splitArtists(raw: string): string[]`
  - `interface CleanTitle { title: string; featuring: string[] }`
  - `cleanImportedTitle(raw: string, artistNames: string[]): CleanTitle`
  - `splitTitleScripts(title: string): { titleAr?: string; titleLatin?: string }`
  - `arabicRatio(text: string): number`, qui renvoie une valeur entre 0 et 1

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

```ts
// tests/unit/text/titles.test.ts
import { describe, expect, it } from 'vitest';
import { cleanImportedTitle, splitArtists, splitTitleScripts } from '@/lib/text/titles';
import { arabicRatio } from '@/lib/text/arabicRatio';

describe('splitArtists', () => {
  it('découpe sur feat., ft., featuring, virgule et &', () => {
    expect(splitArtists('Balti feat. Hamouda')).toEqual(['Balti', 'Hamouda']);
    expect(splitArtists('A ft. B, C & D featuring E')).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
  it('dédoublonne sans tenir compte de la casse ni des accents', () => {
    expect(splitArtists('Saber Rebaï & saber rebai')).toEqual(['Saber Rebaï']);
  });
});

describe('cleanImportedTitle', () => {
  it('retire les numéros de piste', () => {
    expect(cleanImportedTitle('02. قديش كان في ناس', ['فيروز']).title).toBe('قديش كان في ناس');
  });
  it('retire le préfixe artiste et le bruit vidéo', () => {
    expect(cleanImportedTitle('Balti - Ena (Official Music Video)', ['Balti']).title).toBe('Ena');
    expect(cleanImportedTitle('Fairuz Habaytak Bel Saif حبيتك بالصيف', ['Fairuz']).title)
      .toBe('Habaytak Bel Saif حبيتك بالصيف');
  });
  it('extrait les invités du titre', () => {
    expect(cleanImportedTitle('Nebni (feat. EMP1RE, Lotfi Bouchnak & Allchestra)', ['Balti']))
      .toEqual({ title: 'Nebni', featuring: ['EMP1RE', 'Lotfi Bouchnak', 'Allchestra'] });
  });
  it('gère « Artiste feat. Invité - Titre »', () => {
    expect(cleanImportedTitle('Balti ft. Akram Mag - Regragi Style (Official Music Video)', ['Balti']))
      .toEqual({ title: 'Regragi Style', featuring: ['Akram Mag'] });
  });
  it('retire le bruit en arabe et après une barre verticale', () => {
    expect(cleanImportedTitle('على نار (فيديو كليب) | 2019', []).title).toBe('على نار');
  });
  it('ne vide jamais un titre', () => {
    expect(cleanImportedTitle('Fairuz', ['Fairuz']).title).toBe('Fairuz');
  });
});

describe('splitTitleScripts', () => {
  it('sépare les parties arabe et latine', () => {
    expect(splitTitleScripts('Habaytak Bel Saif حبيتك بالصيف'))
      .toEqual({ titleAr: 'حبيتك بالصيف', titleLatin: 'Habaytak Bel Saif' });
    expect(splitTitleScripts('Habaytak - حبيتك')).toEqual({ titleAr: 'حبيتك', titleLatin: 'Habaytak' });
    expect(splitTitleScripts('سيدي منصور')).toEqual({ titleAr: 'سيدي منصور' });
    expect(splitTitleScripts('Sidi Mansour')).toEqual({ titleLatin: 'Sidi Mansour' });
  });
});

describe('arabicRatio', () => {
  it('calcule la part de lettres arabes', () => {
    expect(arabicRatio('يا ليل')).toBe(1);
    expect(arabicRatio('ya lil')).toBe(0);
    expect(arabicRatio('يا ya')).toBe(0.5);
    expect(arabicRatio('123 !')).toBe(0);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/text/titles.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter.**

```ts
// src/lib/text/titles.ts
import { detectScript } from './detectScript';
import { normalizeLatin } from './normalizeLatin';

const NOISE =
  /\s*[(\[][^)\]]*(official|video|clip|lyric|audio|\bhd\b|\bhq\b|4k|visuali[sz]er|exclusive|كلمات|فيديو|كليب|حصري)[^)\]]*[)\]]/giu;
const FEAT_IN_TITLE = /\s*[(\[]\s*(?:feat\.?|ft\.?|featuring)\s+([^)\]]+)[)\]]/iu;
const TRACK_NUMBER = /^\s*\d{1,3}\s*[.\-)]\s*/u;
const ARTIST_SEP = /\s*(?:,|&|\bfeat\.?(?=\s)|\bft\.?(?=\s)|\bfeaturing\b)\s*/iu;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitArtists(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(ARTIST_SEP)) {
    const name = part.trim();
    const key = normalizeLatin(name);
    if (name && !seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

export interface CleanTitle {
  title: string;
  featuring: string[];
}

export function cleanImportedTitle(raw: string, artistNames: string[]): CleanTitle {
  let t = raw.trim();
  let featuring: string[] = [];
  const feat = t.match(FEAT_IN_TITLE);
  if (feat) {
    featuring = splitArtists(feat[1]);
    t = t.replace(FEAT_IN_TITLE, '');
  }
  t = t.replace(NOISE, '').replace(/\s*\|.*$/u, '').replace(TRACK_NUMBER, '');
  // « Artiste [feat. Invité] - Titre » : la partie gauche contient l'artiste du morceau.
  const artistKeys = new Set(artistNames.map(normalizeLatin));
  const dash = t.match(/^(.+?)\s+[-–—]\s+(.+)$/u);
  if (dash) {
    const left = splitArtists(dash[1]);
    if (left.some((n) => artistKeys.has(normalizeLatin(n)))) {
      featuring = [...featuring, ...left.filter((n) => !artistKeys.has(normalizeLatin(n)))];
      t = dash[2];
    }
  }
  for (const artist of artistNames) {
    const prefix = new RegExp(`^${escapeRegExp(artist)}\\s*(?:[-–—:]\\s*|\\s+)(?=\\S)`, 'iu');
    t = t.replace(prefix, '');
  }
  t = t.replace(/\s+/gu, ' ').trim();
  return { title: t || raw.trim(), featuring };
}

export function splitTitleScripts(title: string): { titleAr?: string; titleLatin?: string } {
  const script = detectScript(title);
  if (script === 'arabic') return { titleAr: title };
  if (script === 'latin') return { titleLatin: title };
  const words = title.split(/\s+/u);
  const ar = words.filter((w) => detectScript(w) === 'arabic').join(' ');
  const lat = words
    .filter((w) => detectScript(w) !== 'arabic')
    .join(' ')
    .replace(/[\s\-–—|:]+$/u, '')
    .trim();
  return { ...(ar ? { titleAr: ar } : {}), ...(lat ? { titleLatin: lat } : {}) };
}
```

```ts
// src/lib/text/arabicRatio.ts
export function arabicRatio(text: string): number {
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  if (letters === 0) return 0;
  const arabic = (text.match(/(?=\p{L})\p{Script=Arabic}/gu) ?? []).length;
  return arabic / letters;
}
```

- [ ] **Étape 4 : relancer les tests.** Lancer `pnpm test -- tests/unit/text/titles.test.ts`. Attendu : PASS.

- [ ] **Étape 5 : commit.**

```bash
git add src/lib/text tests/unit/text && git commit -m "feat(text): imported title cleaning, artist splitting, arabic ratio"
```

---

### Tâche 5 : schéma de la base, migrations et banc de tests d'intégration

**Fichiers :**
- Créer :
  - `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `drizzle.config.ts`, `scripts/migrate.ts`
  - `drizzle/*`, généré
  - `tests/integration/globalSetup.ts`, `tests/integration/setup.ts`, `tests/integration/helpers.ts`
- Modifier : `vitest.config.ts`, projet `integration`
- Tester : `tests/integration/schema.test.ts`

**Interfaces :**
- Produit :
  - les tables `artists`, `songs`, `song_artists` et `rate_limits`, avec les enums `dialect`, `song_source`, `song_status`, `translit_status` et `artist_role` ;
  - `db` et `pool`, exportés par `@/lib/db/client`, ainsi que le type `Db` ;
  - `type Dialect` et `type SongSource`, exportés par `@/lib/db/schema` ;
  - `resetDb(): Promise<void>`, exporté par `tests/integration/helpers.ts`.

- [ ] **Étape 1 : écrire le schéma.**

```ts
// src/lib/db/schema.ts
import { sql } from 'drizzle-orm';
import {
  boolean, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core';

export const DIALECTS = ['tn', 'eg', 'lev', 'gulf', 'maghreb_other', 'msa', 'other'] as const;
export type Dialect = (typeof DIALECTS)[number];
export const SONG_SOURCES = ['lrclib', 'public_domain', 'contribution'] as const;
export type SongSource = (typeof SONG_SOURCES)[number];

export const dialectEnum = pgEnum('dialect', DIALECTS);
export const songSourceEnum = pgEnum('song_source', SONG_SOURCES);
export const songStatusEnum = pgEnum('song_status', ['published', 'removed']);
export const translitStatusEnum = pgEnum('translit_status', ['none', 'generating', 'auto', 'reviewed']);
export const artistRoleEnum = pgEnum('artist_role', ['main', 'feat']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const artists = pgTable(
  'artists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nameAr: text('name_ar'),
    nameLatin: text('name_latin'),
    aliases: text('aliases').array().notNull().default(sql`'{}'::text[]`),
    identityKey: text('identity_key').notNull(),
    searchAr: text('search_ar').notNull().default(''),
    searchLatin: text('search_latin').notNull().default(''),
    searchKey: text('search_key').notNull().default(''),
    ...timestamps,
  },
  (t) => [uniqueIndex('artists_identity_key_uq').on(t.identityKey)],
);

export const songs = pgTable(
  'songs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    titleAr: text('title_ar'),
    titleLatin: text('title_latin'),
    lyrics: text('lyrics').notNull(),
    lyricsTranslit: text('lyrics_translit'),
    translitStatus: translitStatusEnum('translit_status').notNull().default('none'),
    dialect: dialectEnum('dialect').notNull().default('other'),
    source: songSourceEnum('source').notNull(),
    sourceRef: text('source_ref'),
    dedupeKey: text('dedupe_key').notNull(),
    importLocked: boolean('import_locked').notNull().default(false),
    status: songStatusEnum('status').notNull().default('published'),
    removedReason: text('removed_reason'),
    searchAr: text('search_ar').notNull().default(''),
    searchLatin: text('search_latin').notNull().default(''),
    searchKey: text('search_key').notNull().default(''),
    lyricsSearchAr: text('lyrics_search_ar').notNull().default(''),
    lyricsSearchKey: text('lyrics_search_key').notNull().default(''),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('songs_source_ref_uq').on(t.source, t.sourceRef),
    uniqueIndex('songs_source_dedupe_uq')
      .on(t.source, t.dedupeKey)
      .where(sql`source <> 'contribution'`),
  ],
);

export const songArtists = pgTable(
  'song_artists',
  {
    songId: uuid('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
    artistId: uuid('artist_id').notNull().references(() => artists.id),
    role: artistRoleEnum('role').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [primaryKey({ columns: [t.songId, t.artistId] })],
);

export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text('key').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull(),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);
```

- [ ] **Étape 2 : écrire le client, la configuration drizzle-kit et le script de migration.**

```ts
// src/lib/db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { ghanniPool?: Pool };

export const pool =
  globalForDb.ghanniPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
if (process.env.NODE_ENV !== 'production') globalForDb.ghanniPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
```

```ts
// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
```

```ts
// scripts/migrate.ts
import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from '@/lib/db/client';

async function main(): Promise<void> {
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations appliquées.');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

- [ ] **Étape 3 : générer la migration du schéma, puis la migration SQL personnalisée.**

```bash
pnpm db:generate --name init
pnpm drizzle-kit generate --custom --name search_indexes
```

Remplacer le contenu du fichier `drizzle/0001_search_indexes.sql` généré par :

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
ALTER TABLE songs ADD CONSTRAINT songs_title_present CHECK (title_ar IS NOT NULL OR title_latin IS NOT NULL);
--> statement-breakpoint
CREATE INDEX songs_search_ar_trgm ON songs USING gin (search_ar gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_search_latin_trgm ON songs USING gin (search_latin gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_search_key_trgm ON songs USING gin (search_key gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_lyrics_search_ar_trgm ON songs USING gin (lyrics_search_ar gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_lyrics_search_key_trgm ON songs USING gin (lyrics_search_key gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX artists_search_ar_trgm ON artists USING gin (search_ar gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX artists_search_latin_trgm ON artists USING gin (search_latin gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX artists_search_key_trgm ON artists USING gin (search_key gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX songs_status_idx ON songs (status);
--> statement-breakpoint
CREATE INDEX song_artists_artist_idx ON song_artists (artist_id);
```

Le nom exact du fichier généré peut différer (préfixe numérique) ; le remplacer, quel que soit son nom.

- [ ] **Étape 4 : écrire le banc d'intégration et ajouter `setupFiles` à la configuration.**

```ts
// tests/integration/globalSetup.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export default async function setup(): Promise<void> {
  const url = process.env.DATABASE_URL_TEST ?? 'postgres://ghanni:ghanni@localhost:5433/ghanni_test';
  const pool = new Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: 'drizzle' });
  await pool.end();
}
```

```ts
// tests/integration/setup.ts
import { afterAll } from 'vitest';
import { pool } from '@/lib/db/client';

afterAll(async () => {
  await pool.end();
});
```

```ts
// tests/integration/helpers.ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

export async function resetDb(): Promise<void> {
  await db.execute(sql`TRUNCATE song_artists, songs, artists, rate_limits CASCADE`);
}
```

Dans `vitest.config.ts`, ajouter `setupFiles: ['tests/integration/setup.ts'],` dans le bloc `test` du projet `integration`, juste après `globalSetup`.

- [ ] **Étape 5 : écrire les tests de schéma, qui doivent échouer avant la migration.**

```ts
// tests/integration/schema.test.ts
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { songs } from '@/lib/db/schema';
import { resetDb } from './helpers';

const base = { lyrics: 'يا ليل يا عين', source: 'lrclib' as const, dedupeKey: 'k1' };

describe('schéma', () => {
  beforeEach(resetDb);

  it('pg_trgm produit des trigrammes pour l’arabe (locale UTF-8)', async () => {
    const res = await db.execute<{ t: string[] }>(sql`SELECT show_trgm('سيدي') AS t`);
    expect(res.rows[0].t.length).toBeGreaterThan(0);
  });

  it('exige au moins un titre', async () => {
    await expect(db.insert(songs).values({ ...base })).rejects.toThrow();
  });

  it('interdit deux imports avec la même dedupe_key, autorise deux contributions', async () => {
    await db.insert(songs).values({ ...base, titleAr: 'أ', sourceRef: '1' });
    await expect(
      db.insert(songs).values({ ...base, titleAr: 'ب', sourceRef: '2' }),
    ).rejects.toThrow();
    const contribution = { ...base, source: 'contribution' as const, titleAr: 'ج' };
    await db.insert(songs).values({ ...contribution, sourceRef: null });
    await expect(db.insert(songs).values({ ...contribution, sourceRef: null })).resolves.toBeDefined();
  });
});
```

- [ ] **Étape 6 : appliquer les migrations et lancer les tests.**

```bash
pnpm db:migrate
pnpm test:integration -- tests/integration/schema.test.ts
```

Attendu : « Migrations appliquées. », puis les 3 tests PASS. Le global setup migre la base de test.

- [ ] **Étape 7 : commit.**

```bash
git add src/lib/db drizzle drizzle.config.ts scripts/migrate.ts tests/integration vitest.config.ts
git commit -m "feat(db): catalog schema, trigram indexes and integration test harness"
```

---

### Tâche 6 : écriture du catalogue (artistes, chansons et colonnes de recherche)

**Fichiers :**
- Créer : `src/lib/catalog/searchColumns.ts`, `src/lib/catalog/artists.ts`, `src/lib/catalog/songs.ts`
- Tester : `tests/unit/catalog/searchColumns.test.ts`, `tests/integration/catalog.test.ts`

**Interfaces :**
- Consomme :
  - `normalizeArabic`, `normalizeLatin`, `detectScript`, `toSearchKey` (tâches 2 et 3) ;
  - `db`, `Db`, `artists`, `songs`, `songArtists`, `Dialect` (tâche 5).
- Produit :
  - `interface ArtistNames { nameAr?: string | null; nameLatin?: string | null; aliases?: string[] }`
  - `interface SearchColumns { searchAr: string; searchLatin: string; searchKey: string }`
  - `artistSearchColumns(a: ArtistNames): SearchColumns`
  - `songSearchColumns(s: { titleAr?: string | null; titleLatin?: string | null; lyrics: string; artists: ArtistNames[] }): SearchColumns & { lyricsSearchAr: string; lyricsSearchKey: string }`
  - `artistIdentityKey(a: { nameAr?: string | null; nameLatin?: string | null }): string`
  - `interface ArtistInput { nameAr?: string; nameLatin?: string; aliases?: string[] }`
  - `interface UpsertedArtist { id: string; identityKey: string; names: ArtistNames }`
  - `upsertArtist(db: Db, input: ArtistInput): Promise<UpsertedArtist>`
  - `interface SongArtistRef extends UpsertedArtist { role: 'main' | 'feat' }`
  - `interface ImportSongInput { titleAr?: string; titleLatin?: string; lyrics: string; lyricsTranslit?: string; translitStatus?: 'none' | 'reviewed'; dialect: Dialect; source: 'lrclib' | 'public_domain'; sourceRef: string; artists: SongArtistRef[] }`. Le champ `artists[0]` est l'artiste principal.
  - `type UpsertOutcome = 'inserted' | 'updated' | 'locked'`
  - `songDedupeKey(mainIdentityKey: string, title: string): string`
  - `upsertSong(db: Db, input: ImportSongInput): Promise<{ id: string; outcome: UpsertOutcome }>`

- [ ] **Étape 1 : écrire le test unitaire des colonnes de recherche, qui doit échouer.**

```ts
// tests/unit/catalog/searchColumns.test.ts
import { describe, expect, it } from 'vitest';
import { artistSearchColumns, songSearchColumns } from '@/lib/catalog/searchColumns';

describe('searchColumns', () => {
  it('artiste : répartit arabe et latin, clé commune dédoublonnée', () => {
    expect(
      artistSearchColumns({ nameAr: 'صابر الرباعي', nameLatin: 'Saber Rebai', aliases: ['Saber Rebaï'] }),
    ).toEqual({ searchAr: 'صابر الرباعي', searchLatin: 'saber rebai', searchKey: 'sbrlrb3 sbrb' });
  });
  it('chanson : titre puis artistes, paroles normalisées', () => {
    const cols = songSearchColumns({
      titleAr: 'سيدي منصور',
      titleLatin: 'Sidi Mansour',
      lyrics: 'يَا لِيل\nيا عين',
      artists: [{ nameAr: 'صابر الرباعي', nameLatin: 'Saber Rebai' }],
    });
    expect(cols.searchAr).toBe('سيدي منصور صابر الرباعي');
    expect(cols.searchLatin).toBe('sidi mansour saber rebai');
    expect(cols.searchKey).toBe('sdmnsr sbrlrb3 sbrb');
    expect(cols.lyricsSearchAr).toBe('يا ليل يا عين');
    expect(cols.lyricsSearchKey).toBe('l3n');
  });
});
```

Explication de trois valeurs attendues :
- `sbrlrb3` vient de « صابر الرباعي » : s, b, r, l, r, b, ع.
- `sbrb` vient de « Saber Rebai » : la clé donne `sbrrb`, réduit à `sbrb` parce que les deux r se suivent.
- `l3n` vient de « يا ليل يا عين » : la clé donne `ll3n`, réduit à `l3n` parce que les consonnes doublées sont réduites à une seule.

- [ ] **Étape 2 : lancer le test et constater l'échec.** Lancer `pnpm test -- tests/unit/catalog`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter les colonnes de recherche.**

```ts
// src/lib/catalog/searchColumns.ts
import { detectScript } from '@/lib/text/detectScript';
import { normalizeArabic } from '@/lib/text/normalizeArabic';
import { normalizeLatin } from '@/lib/text/normalizeLatin';
import { toSearchKey } from '@/lib/text/searchKey';

export interface ArtistNames {
  nameAr?: string | null;
  nameLatin?: string | null;
  aliases?: string[];
}

export interface SearchColumns {
  searchAr: string;
  searchLatin: string;
  searchKey: string;
}

function uniqueJoin(parts: string[]): string {
  return [...new Set(parts.filter((p) => p.length > 0))].join(' ');
}

function columnsFor(texts: string[]): SearchColumns {
  return {
    searchAr: uniqueJoin(texts.filter((t) => detectScript(t) !== 'latin').map(normalizeArabic)),
    searchLatin: uniqueJoin(texts.filter((t) => detectScript(t) !== 'arabic').map(normalizeLatin)),
    searchKey: uniqueJoin(texts.map(toSearchKey)),
  };
}

function artistTexts(a: ArtistNames): string[] {
  return [a.nameAr, a.nameLatin, ...(a.aliases ?? [])].filter((t): t is string => !!t);
}

export function artistSearchColumns(a: ArtistNames): SearchColumns {
  return columnsFor(artistTexts(a));
}

export function songSearchColumns(s: {
  titleAr?: string | null;
  titleLatin?: string | null;
  lyrics: string;
  artists: ArtistNames[];
}): SearchColumns & { lyricsSearchAr: string; lyricsSearchKey: string } {
  const titles = [s.titleAr, s.titleLatin].filter((t): t is string => !!t);
  return {
    ...columnsFor([...titles, ...s.artists.flatMap(artistTexts)]),
    lyricsSearchAr: normalizeArabic(s.lyrics),
    lyricsSearchKey: toSearchKey(s.lyrics),
  };
}
```

- [ ] **Étape 4 : relancer le test unitaire.** Lancer `pnpm test -- tests/unit/catalog`. Attendu : PASS.

- [ ] **Étape 5 : écrire les tests d'intégration, qui doivent échouer.**

```ts
// tests/integration/catalog.test.ts
import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { songArtists, songs } from '@/lib/db/schema';
import { upsertArtist } from '@/lib/catalog/artists';
import { upsertSong, type ImportSongInput } from '@/lib/catalog/songs';
import { resetDb } from './helpers';

async function sampleInput(overrides: Partial<ImportSongInput> = {}): Promise<ImportSongInput> {
  const saber = await upsertArtist(db, { nameAr: 'صابر الرباعي', nameLatin: 'Saber Rebai' });
  return {
    titleAr: 'سيدي منصور',
    titleLatin: 'Sidi Mansour',
    lyrics: 'سطر تجريبي\nسطر ثاني',
    dialect: 'tn',
    source: 'lrclib',
    sourceRef: '100',
    artists: [{ ...saber, role: 'main' }],
    ...overrides,
  };
}

describe('upsertArtist', () => {
  beforeEach(resetDb);

  it('fusionne sur identity_key : garde les noms existants, unit les alias', async () => {
    const a = await upsertArtist(db, { nameLatin: 'Saber Rebai', aliases: ['Saber Rebaï'] });
    const b = await upsertArtist(db, { nameLatin: 'saber rebai', nameAr: 'صابر الرباعي', aliases: ['Saber Al Robaii'] });
    expect(b.id).toBe(a.id);
    expect(b.names.nameLatin).toBe('Saber Rebai');
    expect(b.names.nameAr).toBe('صابر الرباعي');
    expect([...(b.names.aliases ?? [])].sort()).toEqual(['Saber Al Robaii', 'Saber Rebaï']);
    const row = await db.execute<{ search_key: string }>(sql`SELECT search_key FROM artists WHERE id = ${a.id}`);
    expect(row.rows[0].search_key).toContain('sbrb');
  });
});

describe('upsertSong', () => {
  beforeEach(resetDb);

  it('insère puis met à jour la même chanson (idempotent)', async () => {
    const input = await sampleInput();
    const first = await upsertSong(db, input);
    expect(first.outcome).toBe('inserted');
    const second = await upsertSong(db, { ...input, sourceRef: '200', lyrics: 'سطر جديد' });
    expect(second).toEqual({ id: first.id, outcome: 'updated' });
    const [row] = await db.select().from(songs).where(eq(songs.id, first.id));
    expect(row.sourceRef).toBe('200');
    expect(row.searchKey).toBe('sdmnsr sbrlrb3 sbrb');
    const links = await db.select().from(songArtists).where(eq(songArtists.songId, first.id));
    expect(links).toHaveLength(1);
  });

  it('ne touche jamais une chanson verrouillée ni son statut', async () => {
    const input = await sampleInput();
    const { id } = await upsertSong(db, input);
    await db.update(songs).set({ importLocked: true, status: 'removed' }).where(eq(songs.id, id));
    const again = await upsertSong(db, { ...input, lyrics: 'تغيير' });
    expect(again).toEqual({ id, outcome: 'locked' });
    const [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.lyrics).toBe(input.lyrics);
    expect(row.status).toBe('removed');
  });

  it('ne ressuscite pas une chanson retirée non verrouillée', async () => {
    const input = await sampleInput();
    const { id } = await upsertSong(db, input);
    await db.update(songs).set({ status: 'removed' }).where(eq(songs.id, id));
    await upsertSong(db, input);
    const [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.status).toBe('removed');
  });

  it('garde la translittération si les paroles sont inchangées, la remet à zéro sinon', async () => {
    const input = await sampleInput();
    const { id } = await upsertSong(db, input);
    await db.update(songs).set({ lyricsTranslit: 'str\nstr', translitStatus: 'auto' }).where(eq(songs.id, id));
    await upsertSong(db, input);
    let [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.translitStatus).toBe('auto');
    await upsertSong(db, { ...input, lyrics: 'سطر مختلف\nسطر' });
    [row] = await db.select().from(songs).where(eq(songs.id, id));
    expect(row.translitStatus).toBe('none');
    expect(row.lyricsTranslit).toBeNull();
  });

  it('dédoublonne arabe et arabizi : même clé de titre', async () => {
    const input = await sampleInput();
    const a = await upsertSong(db, { ...input, titleLatin: undefined });
    const b = await upsertSong(db, { ...input, titleAr: undefined, sourceRef: '300' });
    expect(b.id).toBe(a.id);
  });
});
```

- [ ] **Étape 6 : lancer les tests et constater l'échec.** Lancer `pnpm test:integration -- tests/integration/catalog.test.ts`. Attendu : FAIL, modules introuvables.

- [ ] **Étape 7 : implémenter les artistes.**

```ts
// src/lib/catalog/artists.ts
import { eq, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { artists } from '@/lib/db/schema';
import { normalizeLatin } from '@/lib/text/normalizeLatin';
import { artistSearchColumns, type ArtistNames } from './searchColumns';

export interface ArtistInput {
  nameAr?: string;
  nameLatin?: string;
  aliases?: string[];
}

export interface UpsertedArtist {
  id: string;
  identityKey: string;
  names: ArtistNames;
}

export function artistIdentityKey(a: { nameAr?: string | null; nameLatin?: string | null }): string {
  const name = a.nameLatin ?? a.nameAr;
  if (!name) throw new Error('Un artiste doit avoir un nom arabe ou latin.');
  return normalizeLatin(name);
}

export async function upsertArtist(db: Db, input: ArtistInput): Promise<UpsertedArtist> {
  const identityKey = artistIdentityKey(input);
  const [row] = await db
    .insert(artists)
    .values({
      nameAr: input.nameAr ?? null,
      nameLatin: input.nameLatin ?? null,
      aliases: input.aliases ?? [],
      identityKey,
    })
    .onConflictDoUpdate({
      target: artists.identityKey,
      set: {
        nameAr: sql`COALESCE(${artists.nameAr}, excluded.name_ar)`,
        nameLatin: sql`COALESCE(${artists.nameLatin}, excluded.name_latin)`,
        aliases: sql`ARRAY(SELECT DISTINCT unnest(${artists.aliases} || excluded.aliases))`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  const names: ArtistNames = { nameAr: row.nameAr, nameLatin: row.nameLatin, aliases: row.aliases };
  await db.update(artists).set(artistSearchColumns(names)).where(eq(artists.id, row.id));
  return { id: row.id, identityKey, names };
}
```

- [ ] **Étape 8 : implémenter les chansons.**

```ts
// src/lib/catalog/songs.ts
import { eq, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db/client';
import { songArtists, type Dialect } from '@/lib/db/schema';
import { toSearchKey } from '@/lib/text/searchKey';
import type { UpsertedArtist } from './artists';
import { songSearchColumns } from './searchColumns';

export interface SongArtistRef extends UpsertedArtist {
  role: 'main' | 'feat';
}

export interface ImportSongInput {
  titleAr?: string;
  titleLatin?: string;
  lyrics: string;
  lyricsTranslit?: string;
  translitStatus?: 'none' | 'reviewed';
  dialect: Dialect;
  source: 'lrclib' | 'public_domain';
  sourceRef: string;
  /** artists[0] est l'artiste principal. */
  artists: SongArtistRef[];
}

export type UpsertOutcome = 'inserted' | 'updated' | 'locked';

export function songDedupeKey(mainIdentityKey: string, title: string): string {
  return `${mainIdentityKey}|${toSearchKey(title)}`;
}

export async function upsertSong(
  db: Db,
  input: ImportSongInput,
): Promise<{ id: string; outcome: UpsertOutcome }> {
  const title = input.titleAr ?? input.titleLatin;
  if (!title) throw new Error('Une chanson doit avoir un titre.');
  const uniqueArtists = input.artists.filter(
    (a, i, all) => all.findIndex((b) => b.id === a.id) === i,
  );
  if (uniqueArtists.length === 0) throw new Error('Une chanson doit avoir un artiste.');
  const dedupeKey = songDedupeKey(uniqueArtists[0].identityKey, title);
  const cols = songSearchColumns({
    titleAr: input.titleAr,
    titleLatin: input.titleLatin,
    lyrics: input.lyrics,
    artists: uniqueArtists.map((a) => a.names),
  });

  return db.transaction(async (tx) => {
    const res = await tx.execute<{ id: string; inserted: boolean }>(sql`
      INSERT INTO songs (title_ar, title_latin, lyrics, lyrics_translit, translit_status, dialect,
        source, source_ref, dedupe_key, search_ar, search_latin, search_key,
        lyrics_search_ar, lyrics_search_key)
      VALUES (${input.titleAr ?? null}, ${input.titleLatin ?? null}, ${input.lyrics},
        ${input.lyricsTranslit ?? null}, ${input.translitStatus ?? 'none'}, ${input.dialect},
        ${input.source}, ${input.sourceRef}, ${dedupeKey}, ${cols.searchAr}, ${cols.searchLatin},
        ${cols.searchKey}, ${cols.lyricsSearchAr}, ${cols.lyricsSearchKey})
      ON CONFLICT (source, dedupe_key) WHERE source <> 'contribution' DO UPDATE SET
        title_ar = EXCLUDED.title_ar,
        title_latin = EXCLUDED.title_latin,
        lyrics = EXCLUDED.lyrics,
        lyrics_translit = CASE
          WHEN EXCLUDED.lyrics_translit IS NULL AND songs.lyrics = EXCLUDED.lyrics THEN songs.lyrics_translit
          ELSE EXCLUDED.lyrics_translit END,
        translit_status = CASE
          WHEN EXCLUDED.lyrics_translit IS NULL AND songs.lyrics = EXCLUDED.lyrics THEN songs.translit_status
          ELSE EXCLUDED.translit_status END,
        dialect = EXCLUDED.dialect,
        source_ref = EXCLUDED.source_ref,
        search_ar = EXCLUDED.search_ar,
        search_latin = EXCLUDED.search_latin,
        search_key = EXCLUDED.search_key,
        lyrics_search_ar = EXCLUDED.lyrics_search_ar,
        lyrics_search_key = EXCLUDED.lyrics_search_key,
        updated_at = now()
      WHERE songs.import_locked = false
      RETURNING id, (xmax = 0) AS inserted`);

    if (res.rows.length === 0) {
      const existing = await tx.execute<{ id: string }>(
        sql`SELECT id FROM songs WHERE source = ${input.source} AND dedupe_key = ${dedupeKey}`,
      );
      return { id: existing.rows[0].id, outcome: 'locked' as const };
    }

    const { id, inserted } = res.rows[0];
    await tx.delete(songArtists).where(eq(songArtists.songId, id));
    await tx.insert(songArtists).values(
      uniqueArtists.map((a, position) => ({ songId: id, artistId: a.id, role: a.role, position })),
    );
    return { id, outcome: inserted ? ('inserted' as const) : ('updated' as const) };
  });
}
```

`status` n'apparaît pas dans le `DO UPDATE` : un import ne modifie donc jamais le statut d'une chanson, conformément aux contraintes globales.

- [ ] **Étape 9 : relancer les tests.**

```bash
pnpm test -- tests/unit/catalog
pnpm test:integration -- tests/integration/catalog.test.ts
```

Attendu : PASS pour les deux.

- [ ] **Étape 10 : commit.**

```bash
git add src/lib/catalog tests/unit/catalog tests/integration/catalog.test.ts
git commit -m "feat(catalog): idempotent artist and song upserts with search columns"
```

---

### Tâche 7 : recherche (`searchSongs`), avec jeu de données de test et requêtes de référence

**Fichiers :**
- Créer :
  - `src/lib/search/types.ts`, `src/lib/search/searchSongs.ts`
  - `tests/fixtures/songs.ts`, `tests/fixtures/seed.ts`, `tests/fixtures/search-golden.ts`
- Tester : `tests/unit/search/prepareQuery.test.ts`, `tests/integration/search.test.ts`

**Interfaces :**
- Consomme :
  - `db` (tâche 5) ;
  - `upsertArtist` et `upsertSong` (tâche 6) ;
  - les fonctions de `lib/text` (tâches 2 et 3).
- Produit :
  - `PAGE_SIZE = 20`
  - `interface ArtistRef { id: string; nameAr: string | null; nameLatin: string | null; role: 'main' | 'feat' }`
  - `interface SongHit { id: string; titleAr: string | null; titleLatin: string | null; dialect: Dialect; artists: ArtistRef[]; snippet: string | null }`
  - `interface SearchOptions { artistId?: string; dialect?: Dialect; page?: number }`
  - `interface SearchResult { items: SongHit[]; total: number; page: number; tooShort: boolean }`
  - `interface PreparedQuery { significant: number; ar: string; lat: string; key: string }`
  - `prepareQuery(raw: string): PreparedQuery`
  - `findSnippet(lyrics: string, q: PreparedQuery): string | null`
  - `searchSongs(raw: string, opts?: SearchOptions): Promise<SearchResult>`
  - `seedFixtures(db: Db): Promise<Map<string, string>>`, qui associe la référence de chaque chanson du jeu de test à son identifiant en base. Elle est réutilisée par les tests de bout en bout.

**Barème du score**, défini par la spec §6.2 :
- titre ou artiste qui commence par la requête : 10 points ;
- similarité `word_similarity`, la plus forte des trois colonnes : jusqu'à 6 points ;
- passage trouvé dans les paroles : 3 points.

Les résultats sont triés par score décroissant, puis par titre.

- [ ] **Étape 1 : écrire le test unitaire de préparation de la requête, qui doit échouer.**

```ts
// tests/unit/search/prepareQuery.test.ts
import { describe, expect, it } from 'vitest';
import { findSnippet, prepareQuery } from '@/lib/search/searchSongs';

describe('prepareQuery', () => {
  it('requête arabe : pas de partie latine', () => {
    expect(prepareQuery(' سيدى منصور ')).toEqual({ significant: 9, ar: 'سيدي منصور', lat: '', key: 'sdmnsr' });
  });
  it('requête latine : pas de partie arabe', () => {
    expect(prepareQuery('Sidi Mansour')).toEqual({ significant: 11, ar: '', lat: 'sidi mansour', key: 'sdmnsr' });
  });
});

describe('findSnippet', () => {
  it('renvoie la première ligne qui correspond', () => {
    const lyrics = 'إذا الشعب يوما أراد الحياة\nفلا بد أن يستجيب القدر';
    expect(findSnippet(lyrics, prepareQuery('يستجيب القدر'))).toBe('فلا بد أن يستجيب القدر');
    expect(findSnippet(lyrics, prepareQuery('zzzz'))).toBeNull();
  });
});
```

- [ ] **Étape 2 : lancer le test et constater l'échec.** Lancer `pnpm test -- tests/unit/search`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : écrire les types et `searchSongs`.**

```ts
// src/lib/search/types.ts
import type { Dialect } from '@/lib/db/schema';

export const PAGE_SIZE = 20;

export interface ArtistRef {
  id: string;
  nameAr: string | null;
  nameLatin: string | null;
  role: 'main' | 'feat';
}

export interface SongHit {
  id: string;
  titleAr: string | null;
  titleLatin: string | null;
  dialect: Dialect;
  artists: ArtistRef[];
  snippet: string | null;
}

export interface SearchOptions {
  artistId?: string;
  dialect?: Dialect;
  page?: number;
}

export interface SearchResult {
  items: SongHit[];
  /** Nombre total de résultats ; vaut 0 au-delà de la dernière page. */
  total: number;
  page: number;
  tooShort: boolean;
}
```

```ts
// src/lib/search/searchSongs.ts
import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import type { Dialect } from '@/lib/db/schema';
import { countSignificant, detectScript } from '@/lib/text/detectScript';
import { normalizeArabic } from '@/lib/text/normalizeArabic';
import { normalizeLatin } from '@/lib/text/normalizeLatin';
import { toSearchKey } from '@/lib/text/searchKey';
import { PAGE_SIZE, type ArtistRef, type SearchOptions, type SearchResult } from './types';

/** Seuil de word_similarity (opérateur <%). À ajuster avec `pnpm bench:search`. */
export const WORD_SIMILARITY_THRESHOLD = 0.5;
const LYRICS_KEY_MIN_LENGTH = 4;
const MAX_QUERY_LENGTH = 200;

const COL = {
  searchAr: sql.raw('s.search_ar'),
  searchLatin: sql.raw('s.search_latin'),
  searchKey: sql.raw('s.search_key'),
  lyricsSearchAr: sql.raw('s.lyrics_search_ar'),
  lyricsSearchKey: sql.raw('s.lyrics_search_key'),
};

export interface PreparedQuery {
  significant: number;
  ar: string;
  lat: string;
  key: string;
}

export function prepareQuery(raw: string): PreparedQuery {
  const q = raw.trim().slice(0, MAX_QUERY_LENGTH);
  const script = detectScript(q);
  return {
    significant: countSignificant(q),
    ar: script === 'latin' ? '' : normalizeArabic(q),
    lat: script === 'arabic' ? '' : normalizeLatin(q),
    key: toSearchKey(q),
  };
}

export function findSnippet(lyrics: string, q: PreparedQuery): string | null {
  for (const line of lyrics.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (q.ar && normalizeArabic(trimmed).includes(q.ar)) return trimmed;
    if (q.key.length >= LYRICS_KEY_MIN_LENGTH && toSearchKey(trimmed).includes(q.key)) return trimmed;
  }
  return null;
}

// Les chaînes normalisées ne contiennent que des lettres, des chiffres et des espaces :
// aucun caractère spécial de LIKE (% ou _) ne peut s'y trouver.
const contains = (column: SQL, value: string): SQL => sql`${column} LIKE ${`%${value}%`}`;
const wordStart = (column: SQL, value: string): SQL =>
  sql`(' ' || ${column}) LIKE ${`% ${value}%`}`;
const or = (parts: SQL[]): SQL => (parts.length > 0 ? sql`(${sql.join(parts, sql` OR `)})` : sql`false`);

function buildClauses(q: PreparedQuery): { score: SQL; lyricsMatch: SQL; where: SQL } {
  const prefix: SQL[] = [];
  const similarity: SQL[] = [];
  const lyrics: SQL[] = [];
  const match: SQL[] = [];
  const parts: Array<[string, SQL]> = [
    [q.ar, COL.searchAr],
    [q.lat, COL.searchLatin],
    [q.key, COL.searchKey],
  ];
  for (const [value, column] of parts) {
    if (!value) continue;
    prefix.push(wordStart(column, value));
    similarity.push(sql`word_similarity(${value}, ${column})`);
    match.push(sql`${value} <% ${column}`, contains(column, value));
  }
  if (q.ar) lyrics.push(contains(COL.lyricsSearchAr, q.ar));
  if (q.key.length >= LYRICS_KEY_MIN_LENGTH) lyrics.push(contains(COL.lyricsSearchKey, q.key));
  match.push(...lyrics);

  const lyricsMatch = or(lyrics);
  const best = similarity.length > 0 ? sql.join(similarity, sql`, `) : sql`0`;
  const score = sql`((CASE WHEN ${or(prefix)} THEN 10 ELSE 0 END)
    + 6 * GREATEST(${best})
    + (CASE WHEN ${lyricsMatch} THEN 3 ELSE 0 END))`;
  return { score, lyricsMatch, where: or(match) };
}

interface RawRow extends Record<string, unknown> {
  id: string;
  title_ar: string | null;
  title_latin: string | null;
  dialect: Dialect;
  total: string;
  lyrics: string | null;
  artists: ArtistRef[];
}

export async function searchSongs(raw: string, opts: SearchOptions = {}): Promise<SearchResult> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const q = prepareQuery(raw);
  if (q.significant < 2) return { items: [], total: 0, page, tooShort: true };

  const { score, lyricsMatch, where } = buildClauses(q);
  const filters: SQL[] = [sql`s.status = 'published'`, where];
  if (opts.dialect) filters.push(sql`s.dialect = ${opts.dialect}`);
  if (opts.artistId) {
    filters.push(
      sql`EXISTS (SELECT 1 FROM song_artists f WHERE f.song_id = s.id AND f.artist_id = ${opts.artistId})`,
    );
  }
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('pg_trgm.word_similarity_threshold', ${String(WORD_SIMILARITY_THRESHOLD)}, true)`,
    );
    const res = await tx.execute<RawRow>(sql`
      WITH page AS (
        SELECT s.id, s.title_ar, s.title_latin, s.dialect,
          ${lyricsMatch} AS lyrics_match,
          ${score} AS score,
          count(*) OVER () AS total
        FROM songs s
        WHERE ${sql.join(filters, sql` AND `)}
        ORDER BY score DESC, COALESCE(s.title_latin, s.title_ar) ASC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      )
      SELECT p.id, p.title_ar, p.title_latin, p.dialect, p.total,
        CASE WHEN p.lyrics_match THEN (SELECT l.lyrics FROM songs l WHERE l.id = p.id) END AS lyrics,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', a.id, 'nameAr', a.name_ar, 'nameLatin', a.name_latin, 'role', sa.role
          ) ORDER BY sa.position)
          FROM song_artists sa JOIN artists a ON a.id = sa.artist_id
          WHERE sa.song_id = p.id
        ), '[]'::json) AS artists
      FROM page p
      ORDER BY p.score DESC, COALESCE(p.title_latin, p.title_ar) ASC`);
    return res.rows;
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      titleAr: r.title_ar,
      titleLatin: r.title_latin,
      dialect: r.dialect,
      artists: r.artists,
      snippet: r.lyrics ? findSnippet(r.lyrics, q) : null,
    })),
    total: rows.length > 0 ? Number(rows[0].total) : 0,
    page,
    tooShort: false,
  };
}
```

- [ ] **Étape 4 : relancer le test unitaire.** Lancer `pnpm test -- tests/unit/search`. Attendu : PASS.

- [ ] **Étape 5 : écrire le jeu de données de test.** Les paroles sont **inventées pour les tests**, à l'exception des deux vers de Chebbi, mort en 1934, qui sont dans le domaine public. Les titres et les noms d'artistes sont réels.

```ts
// tests/fixtures/songs.ts
import type { Dialect } from '@/lib/db/schema';

export interface FixtureSong {
  ref: string;
  titleAr?: string;
  titleLatin?: string;
  dialect: Dialect;
  lyrics: string;
  artists: Array<{ nameAr?: string; nameLatin?: string }>;
}

const SABER = { nameAr: 'صابر الرباعي', nameLatin: 'Saber Rebai' };

export const FIXTURE_SONGS: FixtureSong[] = [
  { ref: 'sidi-mansour', titleAr: 'سيدي منصور', titleLatin: 'Sidi Mansour', dialect: 'tn',
    artists: [SABER], lyrics: 'سطر تجريبي للاختبار\nنغني مع الأحباب في الليل' },
  { ref: 'ala-nar', titleAr: 'على نار', dialect: 'tn',
    artists: [SABER], lyrics: 'سطر تجريبي ثاني\nالقمر يضوي على البحر' },
  { ref: 'ana-wel-azab', titleAr: 'أنا والعذاب', titleLatin: 'Ana Wel 3azab', dialect: 'tn',
    artists: [{ nameAr: 'لطفي بوشناق', nameLatin: 'Lotfi Bouchnak' }],
    lyrics: 'كلام للتجربة فقط\nيا حمام الدار طير' },
  { ref: 'enta-omri', titleAr: 'انت عمري', dialect: 'eg',
    artists: [{ nameAr: 'أم كلثوم', nameLatin: 'Oum Kalthoum' }],
    lyrics: 'نص للاختبار الأول\nسهرنا مع النجوم حتى الصباح' },
  { ref: 'habaytak', titleAr: 'حبيتك بالصيف', titleLatin: 'Habaytak Bel Saif', dialect: 'lev',
    artists: [{ nameAr: 'فيروز', nameLatin: 'Fairuz' }], lyrics: 'سطر تجريبي\nالورد يرجع مع الربيع' },
  { ref: 'ena', titleLatin: 'Ena', dialect: 'tn',
    artists: [{ nameAr: 'بلطي', nameLatin: 'Balti' }],
    lyrics: 'كلام تجريبي في الحومة\nنحكي على الدنيا والزمان' },
  { ref: 'iradat-al-hayat', titleAr: 'إرادة الحياة', dialect: 'msa',
    artists: [{ nameAr: 'أبو القاسم الشابي', nameLatin: 'Abou el Kacem Chebbi' }],
    lyrics: 'إذا الشعب يوما أراد الحياة\nفلا بد أن يستجيب القدر' },
  { ref: 'ya-lella', titleAr: 'يا لالة', titleLatin: 'Ya Lella', dialect: 'tn',
    artists: [{ nameAr: 'الهادي الجويني', nameLatin: 'Hedi Jouini' }],
    lyrics: 'سطر للاختبار\nغنيلي يا لالة غنيلي' },
];
```

```ts
// tests/fixtures/seed.ts
import type { Db } from '@/lib/db/client';
import { upsertArtist } from '@/lib/catalog/artists';
import { upsertSong, type SongArtistRef } from '@/lib/catalog/songs';
import { FIXTURE_SONGS } from './songs';

export async function seedFixtures(db: Db): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const f of FIXTURE_SONGS) {
    const refs: SongArtistRef[] = [];
    for (const [i, a] of f.artists.entries()) {
      refs.push({ ...(await upsertArtist(db, a)), role: i === 0 ? 'main' : 'feat' });
    }
    const { id } = await upsertSong(db, {
      titleAr: f.titleAr,
      titleLatin: f.titleLatin,
      lyrics: f.lyrics,
      dialect: f.dialect,
      source: 'public_domain',
      sourceRef: `fixture-${f.ref}`,
      artists: refs,
    });
    ids.set(f.ref, id);
  }
  return ids;
}
```

```ts
// tests/fixtures/search-golden.ts
/** [requête, référence de la chanson attendue dans le top 3] */
export const GOLDEN_QUERIES: Array<[string, string]> = [
  ['sidi mansour', 'sidi-mansour'],
  ['سيدي منصور', 'sidi-mansour'],
  ['sidi mansur', 'sidi-mansour'],
  ['sidi mansor', 'sidi-mansour'],
  ['سيدى منصور', 'sidi-mansour'],
  ['saber rebai', 'sidi-mansour'],
  ['صابر الرباعي', 'ala-nar'],
  ['3la nar', 'ala-nar'],
  ['ana wel 3azab', 'ana-wel-azab'],
  ['انا والعذاب', 'ana-wel-azab'],
  ['bouchnak', 'ana-wel-azab'],
  ['حمام الدار', 'ana-wel-azab'],
  ['enta 3omri', 'enta-omri'],
  ['oum kalthoum', 'enta-omri'],
  ['ام كلثوم', 'enta-omri'],
  ['سهرنا مع النجوم', 'enta-omri'],
  ['habaytak', 'habaytak'],
  ['حبيتك', 'habaytak'],
  ['fayrouz', 'habaytak'],
  ['balti', 'ena'],
  ['بلطي', 'ena'],
  ['يستجيب القدر', 'iradat-al-hayat'],
  ['chebbi', 'iradat-al-hayat'],
  ['الشابي', 'iradat-al-hayat'],
  ['ya lella', 'ya-lella'],
  ['يا لالة', 'ya-lella'],
  ['الجويني', 'ya-lella'],
];
```

- [ ] **Étape 6 : écrire les tests d'intégration de la recherche, qui doivent échouer tant que le jeu de test n'est pas branché.**

```ts
// tests/integration/search.test.ts
import { eq, sql } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { songs } from '@/lib/db/schema';
import { searchSongs } from '@/lib/search/searchSongs';
import { GOLDEN_QUERIES } from '../fixtures/search-golden';
import { seedFixtures } from '../fixtures/seed';
import { resetDb } from './helpers';

describe('searchSongs : requêtes de référence', () => {
  let ids = new Map<string, string>();
  beforeAll(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });

  it.each(GOLDEN_QUERIES)('« %s » place %s dans le top 3', async (query, ref) => {
    const res = await searchSongs(query);
    expect(res.items.slice(0, 3).map((i) => i.id)).toContain(ids.get(ref));
  });
});

describe('searchSongs : comportements', () => {
  let ids = new Map<string, string>();
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });

  it('refuse une requête trop courte', async () => {
    expect(await searchSongs(' a ')).toEqual({ items: [], total: 0, page: 1, tooShort: true });
  });

  it('exclut les chansons retirées', async () => {
    await db.update(songs).set({ status: 'removed' }).where(eq(songs.id, ids.get('sidi-mansour')!));
    const res = await searchSongs('sidi mansour');
    expect(res.items.map((i) => i.id)).not.toContain(ids.get('sidi-mansour'));
  });

  it('filtre par dialecte', async () => {
    expect((await searchSongs('sidi mansour', { dialect: 'eg' })).total).toBe(0);
    expect((await searchSongs('sidi mansour', { dialect: 'tn' })).total).toBe(1);
  });

  it('filtre par artiste', async () => {
    const r = await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`);
    const res = await searchSongs('سطر', { artistId: r.rows[0].id });
    expect(res.items.map((i) => i.id).sort()).toEqual(
      [ids.get('sidi-mansour'), ids.get('ala-nar')].sort(),
    );
  });

  it('renvoie l’extrait de paroles et les artistes', async () => {
    const res = await searchSongs('يستجيب القدر');
    expect(res.items[0].snippet).toBe('فلا بد أن يستجيب القدر');
    const sidi = (await searchSongs('sidi mansour')).items[0];
    expect(sidi.artists[0]).toMatchObject({ nameLatin: 'Saber Rebai', role: 'main' });
    expect(sidi.snippet).toBeNull();
  });

  it('pagine et compte', async () => {
    const res = await searchSongs('سطر');
    expect(res.total).toBeGreaterThanOrEqual(4);
    expect((await searchSongs('سطر', { page: 2 })).items).toEqual([]);
  });
});
```

- [ ] **Étape 7 : lancer les tests.** Lancer `pnpm test:integration -- tests/integration/search.test.ts`. Attendu : PASS, soit 27 requêtes de référence et 6 tests de comportement.

**Si une requête de référence échoue**, ne pas modifier le test pour le faire passer. Lancer d'abord, dans `psql`, `SELECT word_similarity('<requête normalisée>', search_latin), search_key FROM songs;` sur la base de test. Corriger ensuite la cause : soit la table `searchKeyMap.ts`, en ajoutant le cas aux tests de la tâche 3, soit le seuil. Documenter tout changement de seuil dans le commit.

- [ ] **Étape 8 : commit.**

```bash
git add src/lib/search tests/fixtures tests/unit/search tests/integration/search.test.ts
git commit -m "feat(search): arabic/arabizi search with trigram scoring and golden queries"
```

---

### Tâche 8 : lecture du catalogue (fiche chanson et page artiste)

**Fichiers :**
- Créer : `src/lib/catalog/queries.ts`
- Tester : `tests/integration/queries.test.ts`

**Interfaces :**
- Consomme : `db` (tâche 5), `ArtistRef` (tâche 7), `seedFixtures` (tâche 7).
- Produit :
  - `isUuid(value: string): boolean`
  - `interface SongDetail { id: string; titleAr: string | null; titleLatin: string | null; lyrics: string; lyricsTranslit: string | null; translitStatus: 'none' | 'generating' | 'auto' | 'reviewed'; dialect: Dialect; source: SongSource; artists: ArtistRef[] }`
  - `getSongById(id: string): Promise<SongDetail | null>`, qui renvoie `null` si l'identifiant est invalide, inconnu, ou si la chanson est retirée
  - `interface ArtistDetail { id: string; nameAr: string | null; nameLatin: string | null; songs: Array<{ id: string; titleAr: string | null; titleLatin: string | null; role: 'main' | 'feat' }> }`
  - `getArtistWithSongs(id: string): Promise<ArtistDetail | null>`, qui ne liste que les chansons publiées

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

```ts
// tests/integration/queries.test.ts
import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { songs } from '@/lib/db/schema';
import { getArtistWithSongs, getSongById, isUuid } from '@/lib/catalog/queries';
import { seedFixtures } from '../fixtures/seed';
import { resetDb } from './helpers';

describe('queries', () => {
  let ids = new Map<string, string>();
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });

  it('isUuid', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f')).toBe(true);
  });

  it('getSongById renvoie la chanson et ses artistes', async () => {
    const song = await getSongById(ids.get('sidi-mansour')!);
    expect(song).toMatchObject({ titleAr: 'سيدي منصور', titleLatin: 'Sidi Mansour', dialect: 'tn', source: 'public_domain' });
    expect(song?.artists).toEqual([expect.objectContaining({ nameLatin: 'Saber Rebai', role: 'main' })]);
  });

  it('getSongById renvoie null pour une chanson retirée, inconnue ou un id invalide', async () => {
    const id = ids.get('sidi-mansour')!;
    await db.update(songs).set({ status: 'removed' }).where(eq(songs.id, id));
    expect(await getSongById(id)).toBeNull();
    expect(await getSongById('6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f')).toBeNull();
    expect(await getSongById('abc')).toBeNull();
  });

  it('getArtistWithSongs liste les chansons publiées de l’artiste', async () => {
    const r = await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`);
    const artist = await getArtistWithSongs(r.rows[0].id);
    expect(artist?.nameAr).toBe('صابر الرباعي');
    expect(artist?.songs.map((s) => s.id).sort()).toEqual([ids.get('sidi-mansour'), ids.get('ala-nar')].sort());
    await db.update(songs).set({ status: 'removed' }).where(eq(songs.id, ids.get('ala-nar')!));
    expect((await getArtistWithSongs(r.rows[0].id))?.songs).toHaveLength(1);
    expect(await getArtistWithSongs('abc')).toBeNull();
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test:integration -- tests/integration/queries.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter.**

```ts
// src/lib/catalog/queries.ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import type { Dialect, SongSource } from '@/lib/db/schema';
import type { ArtistRef } from '@/lib/search/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID_RE.test(value);

export interface SongDetail {
  id: string;
  titleAr: string | null;
  titleLatin: string | null;
  lyrics: string;
  lyricsTranslit: string | null;
  translitStatus: 'none' | 'generating' | 'auto' | 'reviewed';
  dialect: Dialect;
  source: SongSource;
  artists: ArtistRef[];
}

export async function getSongById(id: string): Promise<SongDetail | null> {
  if (!isUuid(id)) return null;
  const res = await db.execute<{
    id: string; title_ar: string | null; title_latin: string | null; lyrics: string;
    lyrics_translit: string | null; translit_status: SongDetail['translitStatus'];
    dialect: Dialect; source: SongSource; artists: ArtistRef[];
  }>(sql`
    SELECT s.id, s.title_ar, s.title_latin, s.lyrics, s.lyrics_translit, s.translit_status,
      s.dialect, s.source,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', a.id, 'nameAr', a.name_ar, 'nameLatin', a.name_latin, 'role', sa.role
        ) ORDER BY sa.position)
        FROM song_artists sa JOIN artists a ON a.id = sa.artist_id WHERE sa.song_id = s.id
      ), '[]'::json) AS artists
    FROM songs s
    WHERE s.id = ${id} AND s.status = 'published'`);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id, titleAr: r.title_ar, titleLatin: r.title_latin, lyrics: r.lyrics,
    lyricsTranslit: r.lyrics_translit, translitStatus: r.translit_status,
    dialect: r.dialect, source: r.source, artists: r.artists,
  };
}

export interface ArtistDetail {
  id: string;
  nameAr: string | null;
  nameLatin: string | null;
  songs: Array<{ id: string; titleAr: string | null; titleLatin: string | null; role: 'main' | 'feat' }>;
}

export async function getArtistWithSongs(id: string): Promise<ArtistDetail | null> {
  if (!isUuid(id)) return null;
  const res = await db.execute<{
    id: string; name_ar: string | null; name_latin: string | null; songs: ArtistDetail['songs'];
  }>(sql`
    SELECT a.id, a.name_ar, a.name_latin,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', s.id, 'titleAr', s.title_ar, 'titleLatin', s.title_latin, 'role', sa.role
        ) ORDER BY COALESCE(s.title_latin, s.title_ar))
        FROM song_artists sa JOIN songs s ON s.id = sa.song_id
        WHERE sa.artist_id = a.id AND s.status = 'published'
      ), '[]'::json) AS songs
    FROM artists a
    WHERE a.id = ${id}`);
  const r = res.rows[0];
  if (!r) return null;
  return { id: r.id, nameAr: r.name_ar, nameLatin: r.name_latin, songs: r.songs };
}
```

- [ ] **Étape 4 : relancer les tests.** Lancer `pnpm test:integration -- tests/integration/queries.test.ts`. Attendu : PASS.

- [ ] **Étape 5 : commit.**

```bash
git add src/lib/catalog/queries.ts tests/integration/queries.test.ts
git commit -m "feat(catalog): song detail and artist page queries"
```

---

### Tâche 9 : limitation de débit dans PostgreSQL

**Fichiers :**
- Créer : `src/lib/ratelimit/fixedWindow.ts`, `src/lib/ratelimit/clientIp.ts`
- Tester : `tests/unit/ratelimit/clientIp.test.ts`, `tests/integration/ratelimit.test.ts`

**Interfaces :**
- Consomme : `db` et la table `rate_limits` (tâche 5).
- Produit :
  - `SEARCH_RATE_LIMIT = { limit: 60, windowSeconds: 60 }`
  - `hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }>`
  - `purgeOldRateLimits(): Promise<void>`
  - `clientIp(headers: Headers): string`

Pourquoi stocker les compteurs dans PostgreSQL : sur Vercel, chaque requête peut tomber sur une instance différente, donc un compteur gardé en mémoire ne fonctionnerait pas. Pour une fenêtre fixe, une ligne par clé et par fenêtre suffit, et cela évite d'ajouter un service.

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

```ts
// tests/unit/ratelimit/clientIp.test.ts
import { describe, expect, it } from 'vitest';
import { clientIp } from '@/lib/ratelimit/clientIp';

describe('clientIp', () => {
  it('prend la première adresse de x-forwarded-for', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }))).toBe('203.0.113.5');
  });
  it('se replie sur x-real-ip puis sur unknown', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
```

```ts
// tests/integration/ratelimit.test.ts
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { hitRateLimit, purgeOldRateLimits } from '@/lib/ratelimit/fixedWindow';
import { resetDb } from './helpers';

describe('hitRateLimit', () => {
  beforeEach(resetDb);

  // Fenêtre d'une heure : évite qu'un test chevauche deux fenêtres.
  it('autorise jusqu’à la limite puis refuse', async () => {
    expect(await hitRateLimit('search:1.2.3.4', 2, 3600)).toEqual({ allowed: true, remaining: 1 });
    expect(await hitRateLimit('search:1.2.3.4', 2, 3600)).toEqual({ allowed: true, remaining: 0 });
    expect(await hitRateLimit('search:1.2.3.4', 2, 3600)).toEqual({ allowed: false, remaining: 0 });
  });

  it('compte chaque clé séparément', async () => {
    await hitRateLimit('search:a', 1, 3600);
    expect((await hitRateLimit('search:b', 1, 3600)).allowed).toBe(true);
  });

  it('purge les fenêtres de plus d’un jour', async () => {
    await db.execute(sql`INSERT INTO rate_limits VALUES ('old', now() - interval '2 days', 5)`);
    await purgeOldRateLimits();
    const r = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM rate_limits WHERE key = 'old'`);
    expect(Number(r.rows[0].n)).toBe(0);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.**

```bash
pnpm test -- tests/unit/ratelimit
pnpm test:integration -- tests/integration/ratelimit.test.ts
```

Attendu : FAIL, modules introuvables.

- [ ] **Étape 3 : implémenter.**

```ts
// src/lib/ratelimit/clientIp.ts
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}
```

```ts
// src/lib/ratelimit/fixedWindow.ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

export const SEARCH_RATE_LIMIT = { limit: 60, windowSeconds: 60 } as const;
const PURGE_PROBABILITY = 0.01;

export async function purgeOldRateLimits(): Promise<void> {
  await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`);
}

export async function hitRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const res = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (
      ${key},
      to_timestamp(floor(extract(epoch FROM now()) / ${windowSeconds}::int) * ${windowSeconds}::int),
      1
    )
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`);
  if (Math.random() < PURGE_PROBABILITY) void purgeOldRateLimits().catch(() => undefined);
  const count = Number(res.rows[0].count);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
```

- [ ] **Étape 4 : relancer les tests.** Relancer les deux commandes de l'étape 2. Attendu : PASS.

- [ ] **Étape 5 : commit.**

```bash
git add src/lib/ratelimit tests/unit/ratelimit tests/integration/ratelimit.test.ts
git commit -m "feat(ratelimit): postgres fixed-window rate limiter"
```

---

### Tâche 10 : import LRCLIB

**Fichiers :**
- Créer :
  - `scripts/import/lrclibReader.ts`, `scripts/import/artistAliases.ts`, `scripts/import/artist-aliases.yaml`
  - `scripts/import/lrclibTransform.ts`, `scripts/import/runLrclibImport.ts`, `scripts/import/lrclib.ts`
- Tester : `tests/unit/import/lrclibTransform.test.ts`, `tests/integration/lrclibImport.test.ts`

**Interfaces :**
- Consomme :
  - `arabicRatio`, `cleanImportedTitle`, `splitArtists`, `splitTitleScripts`, `normalizeLatin` et `detectScript` (tâches 2 et 4) ;
  - `upsertArtist`, `artistIdentityKey`, `ArtistInput` et `UpsertedArtist` (tâche 6) ;
  - `upsertSong` et `songDedupeKey` (tâche 6) ;
  - `Db` (tâche 5).
- Produit :
  - `interface LrclibTrack { id: number; name: string; artistName: string; plainLyrics: string }`
  - `readLrclibTracks(dumpPath: string): Generator<LrclibTrack>`
  - `interface AliasIndex { resolve(name: string): ArtistInput }`
  - `buildAliasIndex(yamlText: string): AliasIndex`
  - `MIN_ARABIC_RATIO = 0.5`
  - `type Rejection = 'empty_lyrics' | 'not_arabic' | 'no_artist' | 'empty_title'`
  - `interface Candidate { lrclibId: number; titleAr?: string; titleLatin?: string; lyrics: string; artists: ArtistInput[]; dedupeKey: string }`
  - `transformTrack(track: LrclibTrack, aliases: AliasIndex): Candidate | { rejected: Rejection }`
  - `keepBest(best: Map<string, Candidate>, c: Candidate): void`
  - `interface ImportReport { read: number; rejected: Record<Rejection, number>; candidates: number; unique: number; merged: number; estimatedBytes: number; inserted: number; updated: number; locked: number; errors: number }`
  - `runLrclibImport(opts: { db: Db; tracks: Iterable<LrclibTrack>; aliases: AliasIndex; dryRun: boolean; log?: (line: string) => void }): Promise<ImportReport>`

**Règles**, conformes à la spec §11.1 :
- garder une chanson si ses paroles contiennent au moins 50 % de lettres arabes ;
- nettoyer le titre ;
- prendre l'artiste principal dans `artist_name`, et les invités dans `artist_name` ou dans le titre (`feat.`) ;
- dédoublonner sur `identityKey(artiste principal) | clé(titre)` ;
- garder la version aux paroles les plus longues, puis celle à l'identifiant le plus petit en cas d'égalité ;
- compléter le titre arabe ou latin manquant à partir des doublons ;
- publier avec `source = lrclib`, `source_ref = id LRCLIB` et `dialect = other`.

- [ ] **Étape 1 : écrire les tests unitaires, qui doivent échouer.**

```ts
// tests/unit/import/lrclibTransform.test.ts
import { describe, expect, it } from 'vitest';
import { buildAliasIndex } from '../../../scripts/import/artistAliases';
import { keepBest, transformTrack, type Candidate } from '../../../scripts/import/lrclibTransform';

const ALIASES = buildAliasIndex(`
- name_ar: صابر الرباعي
  name_latin: Saber Rebai
  aliases: [Saber Al Robaii]
`);

describe('buildAliasIndex', () => {
  it('résout une variante vers l’artiste canonique, sinon devine l’écriture', () => {
    expect(ALIASES.resolve('saber al robaii')).toMatchObject({ nameAr: 'صابر الرباعي', nameLatin: 'Saber Rebai' });
    expect(ALIASES.resolve('بلطي')).toEqual({ nameAr: 'بلطي' });
    expect(ALIASES.resolve('Balti')).toEqual({ nameLatin: 'Balti' });
    expect(ALIASES.resolve('Fairuz فيروز')).toEqual({ nameAr: 'فيروز', nameLatin: 'Fairuz' });
  });
});

describe('transformTrack', () => {
  const track = { id: 7, name: 'Sidi Mansour (Official Video)', artistName: 'Saber Al Robaii', plainLyrics: 'سطر تجريبي\r\nسطر ثاني' };

  it('nettoie le titre, résout l’artiste et calcule la clé de dédoublonnage', () => {
    expect(transformTrack(track, ALIASES)).toEqual({
      lrclibId: 7,
      titleLatin: 'Sidi Mansour',
      lyrics: 'سطر تجريبي\nسطر ثاني',
      artists: [{ nameAr: 'صابر الرباعي', nameLatin: 'Saber Rebai', aliases: ['Saber Al Robaii'] }],
      dedupeKey: 'saber rebai|sdmnsr',
    });
  });

  it('rejette les paroles non arabes, vides, ou sans artiste', () => {
    expect(transformTrack({ ...track, plainLyrics: 'Look at the stars' }, ALIASES)).toEqual({ rejected: 'not_arabic' });
    expect(transformTrack({ ...track, plainLyrics: '  ' }, ALIASES)).toEqual({ rejected: 'empty_lyrics' });
    expect(transformTrack({ ...track, artistName: ' , ' }, ALIASES)).toEqual({ rejected: 'no_artist' });
  });

  it('ajoute les invités trouvés dans le titre', () => {
    const c = transformTrack({ ...track, name: 'Nebni (feat. Balti)' }, ALIASES) as Candidate;
    expect(c.artists.map((a) => a.nameLatin)).toEqual(['Saber Rebai', 'Balti']);
  });
});

describe('keepBest', () => {
  const base: Candidate = { lrclibId: 2, titleLatin: 'Sidi Mansour', lyrics: 'سطر', artists: [{ nameLatin: 'A' }], dedupeKey: 'a|sdmnsr' };

  it('garde les paroles les plus longues et complète les titres', () => {
    const best = new Map<string, Candidate>();
    keepBest(best, base);
    keepBest(best, { ...base, lrclibId: 9, titleLatin: undefined, titleAr: 'سيدي منصور', lyrics: 'سطر أطول' });
    expect(best.get('a|sdmnsr')).toMatchObject({ lrclibId: 9, titleAr: 'سيدي منصور', titleLatin: 'Sidi Mansour' });
  });

  it('à longueur égale, garde le plus petit identifiant', () => {
    const best = new Map<string, Candidate>();
    keepBest(best, { ...base, lrclibId: 5 });
    keepBest(best, { ...base, lrclibId: 3 });
    expect(best.get('a|sdmnsr')?.lrclibId).toBe(3);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/import`. Attendu : FAIL, modules introuvables.

- [ ] **Étape 3 : implémenter la lecture de l'export, les alias et la transformation.**

```ts
// scripts/import/lrclibReader.ts
import Database from 'better-sqlite3';

export interface LrclibTrack {
  id: number;
  name: string;
  artistName: string;
  plainLyrics: string;
}

// Schéma LRCLIB : core/migrations/01-initial/up.sql (tables tracks et lyrics).
const QUERY = `
  SELECT t.id AS id, t.name AS name, t.artist_name AS artistName, l.plain_lyrics AS plainLyrics
  FROM tracks t
  JOIN lyrics l ON l.id = t.last_lyrics_id
  WHERE l.has_plain_lyrics = 1
    AND COALESCE(l.instrumental, 0) = 0
    AND t.name IS NOT NULL AND t.artist_name IS NOT NULL AND l.plain_lyrics IS NOT NULL`;

export function* readLrclibTracks(dumpPath: string): Generator<LrclibTrack> {
  const sqlite = new Database(dumpPath, { readonly: true, fileMustExist: true });
  try {
    for (const row of sqlite.prepare(QUERY).iterate()) yield row as LrclibTrack;
  } finally {
    sqlite.close();
  }
}
```

```ts
// scripts/import/artistAliases.ts
import { parse } from 'yaml';
import { z } from 'zod';
import type { ArtistInput } from '@/lib/catalog/artists';
import { normalizeLatin } from '@/lib/text/normalizeLatin';
import { splitTitleScripts } from '@/lib/text/titles';

const AliasFile = z.array(
  z.object({
    name_ar: z.string().optional(),
    name_latin: z.string().optional(),
    aliases: z.array(z.string()).default([]),
  }),
);

export interface AliasIndex {
  resolve(name: string): ArtistInput;
}

export function buildAliasIndex(yamlText: string): AliasIndex {
  const entries = AliasFile.parse(parse(yamlText) ?? []);
  const byVariant = new Map<string, ArtistInput>();
  for (const e of entries) {
    const canonical: ArtistInput = { nameAr: e.name_ar, nameLatin: e.name_latin, aliases: e.aliases };
    for (const variant of [e.name_ar, e.name_latin, ...e.aliases]) {
      if (variant) byVariant.set(normalizeLatin(variant), canonical);
    }
  }
  return {
    resolve(name: string): ArtistInput {
      const hit = byVariant.get(normalizeLatin(name));
      if (hit) return hit;
      const { titleAr, titleLatin } = splitTitleScripts(name.trim());
      return { ...(titleAr ? { nameAr: titleAr } : {}), ...(titleLatin ? { nameLatin: titleLatin } : {}) };
    },
  };
}
```

```yaml
# scripts/import/artist-aliases.yaml
# Variantes d'écriture → artiste canonique. À enrichir au fil des rapports d'import.
- name_ar: صابر الرباعي
  name_latin: Saber Rebai
  aliases: [Saber Al Robaii, Saber Al-Robaii, Saber Al Rubai, Saber Rebaï]
- name_ar: لطفي بوشناق
  name_latin: Lotfi Bouchnak
  aliases: [Lotfi Bouchnaq, Lutfi Bushnaq]
- name_ar: أم كلثوم
  name_latin: Oum Kalthoum
  aliases: [Umm Kulthum, Om Kalthoum, Oum Kalsoum, Umm Kalthoum, Om Kolthoum]
- name_ar: فيروز
  name_latin: Fairuz
  aliases: [Fayrouz, Fairouz, Feyrouz]
- name_ar: الهادي الجويني
  name_latin: Hedi Jouini
  aliases: [Hédi Jouini, El Hadi Jouini, Hadi Jouini]
- name_ar: أمينة فاخت
  name_latin: Amina Fakhet
  aliases: [Amina Fakhet Tunisie]
- name_ar: بلطي
  name_latin: Balti
  aliases: []
```

```ts
// scripts/import/lrclibTransform.ts
import { artistIdentityKey, type ArtistInput } from '@/lib/catalog/artists';
import { songDedupeKey } from '@/lib/catalog/songs';
import { arabicRatio } from '@/lib/text/arabicRatio';
import { cleanImportedTitle, splitArtists, splitTitleScripts } from '@/lib/text/titles';
import type { AliasIndex } from './artistAliases';
import type { LrclibTrack } from './lrclibReader';

export const MIN_ARABIC_RATIO = 0.5;
export type Rejection = 'empty_lyrics' | 'not_arabic' | 'no_artist' | 'empty_title';

export interface Candidate {
  lrclibId: number;
  titleAr?: string;
  titleLatin?: string;
  lyrics: string;
  /** artists[0] est l'artiste principal. */
  artists: ArtistInput[];
  dedupeKey: string;
}

export function transformTrack(track: LrclibTrack, aliases: AliasIndex): Candidate | { rejected: Rejection } {
  const lyrics = track.plainLyrics.replace(/\r\n?/g, '\n').trim();
  if (!lyrics) return { rejected: 'empty_lyrics' };
  if (arabicRatio(lyrics) < MIN_ARABIC_RATIO) return { rejected: 'not_arabic' };

  const artistNames = splitArtists(track.artistName);
  if (artistNames.length === 0) return { rejected: 'no_artist' };

  const cleaned = cleanImportedTitle(track.name, artistNames);
  const titles = splitTitleScripts(cleaned.title);
  const title = titles.titleAr ?? titles.titleLatin;
  if (!title) return { rejected: 'empty_title' };

  const seen = new Set<string>();
  const artists = [...artistNames, ...cleaned.featuring]
    .map((n) => aliases.resolve(n))
    .filter((a) => {
      if (!a.nameAr && !a.nameLatin) return false;
      const key = artistIdentityKey(a);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (artists.length === 0) return { rejected: 'no_artist' };

  return {
    lrclibId: track.id,
    ...titles,
    lyrics,
    artists,
    dedupeKey: songDedupeKey(artistIdentityKey(artists[0]), title),
  };
}

function isBetter(c: Candidate, current: Candidate): boolean {
  if (c.lyrics.length !== current.lyrics.length) return c.lyrics.length > current.lyrics.length;
  return c.lrclibId < current.lrclibId;
}

export function keepBest(best: Map<string, Candidate>, c: Candidate): void {
  const current = best.get(c.dedupeKey);
  if (!current) {
    best.set(c.dedupeKey, c);
    return;
  }
  const [winner, other] = isBetter(c, current) ? [c, current] : [current, c];
  best.set(c.dedupeKey, {
    ...winner,
    titleAr: winner.titleAr ?? other.titleAr,
    titleLatin: winner.titleLatin ?? other.titleLatin,
  });
}
```

`toEqual` ignore les clés de valeur `undefined`. L'objet de `keepBest` peut donc contenir `titleAr: undefined` sans faire échouer les tests.

- [ ] **Étape 4 : relancer les tests unitaires.** Lancer `pnpm test -- tests/unit/import`. Attendu : PASS.

- [ ] **Étape 5 : écrire le test d'intégration, qui doit échouer.**

```ts
// tests/integration/lrclibImport.test.ts
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { buildAliasIndex } from '../../scripts/import/artistAliases';
import { readLrclibTracks } from '../../scripts/import/lrclibReader';
import { runLrclibImport } from '../../scripts/import/runLrclibImport';
import { resetDb } from './helpers';

const ALIASES = buildAliasIndex(`
- name_ar: صابر الرباعي
  name_latin: Saber Rebai
  aliases: []
- name_ar: لطفي بوشناق
  name_latin: Lotfi Bouchnak
  aliases: []
`);

function makeDump(rows: Array<{ id: number; name: string; artist: string; lyrics: string | null; instrumental?: boolean }>): string {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'lrclib-')), 'dump.sqlite3');
  const s = new Database(file);
  s.exec(`
    CREATE TABLE tracks (id INTEGER PRIMARY KEY, name TEXT, artist_name TEXT, last_lyrics_id INTEGER);
    CREATE TABLE lyrics (id INTEGER PRIMARY KEY, plain_lyrics TEXT, track_id INTEGER,
      has_plain_lyrics BOOLEAN, instrumental BOOLEAN);`);
  const insertLyrics = s.prepare('INSERT INTO lyrics VALUES (?, ?, ?, ?, ?)');
  const insertTrack = s.prepare('INSERT INTO tracks VALUES (?, ?, ?, ?)');
  for (const r of rows) {
    insertLyrics.run(r.id, r.lyrics, r.id, r.lyrics ? 1 : 0, r.instrumental ? 1 : 0);
    insertTrack.run(r.id, r.name, r.artist, r.id);
  }
  s.close();
  return file;
}

const DUMP_ROWS = [
  { id: 1, name: 'سيدي منصور', artist: 'صابر الرباعي', lyrics: 'سطر تجريبي أول\nسطر تجريبي ثاني أطول' },
  { id: 2, name: 'Sidi Mansour (Official Video)', artist: 'Saber Rebai', lyrics: 'سطر تجريبي أول' },
  { id: 3, name: 'Yellow', artist: 'Coldplay', lyrics: 'Look at the stars' },
  { id: 4, name: 'Instrumental', artist: 'X', lyrics: null, instrumental: true },
  { id: 5, name: 'Balti - Ena (Official Music Video)', artist: 'Balti', lyrics: 'كلام تجريبي في الحومة' },
  { id: 6, name: 'Nebni (feat. Lotfi Bouchnak)', artist: 'Balti', lyrics: 'سطر تجريبي للأغنية' },
];

describe('runLrclibImport', () => {
  beforeEach(resetDb);

  it('dry-run : rapport sans écriture', async () => {
    const report = await runLrclibImport({
      db, tracks: readLrclibTracks(makeDump(DUMP_ROWS)), aliases: ALIASES, dryRun: true,
    });
    expect(report).toMatchObject({ read: 5, candidates: 4, unique: 3, merged: 1, inserted: 0 });
    expect(report.rejected.not_arabic).toBe(1);
    const r = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs`);
    expect(Number(r.rows[0].n)).toBe(0);
  });

  it('importe, fusionne les doublons, et reste idempotent', async () => {
    const dump = makeDump(DUMP_ROWS);
    const first = await runLrclibImport({ db, tracks: readLrclibTracks(dump), aliases: ALIASES, dryRun: false });
    expect(first).toMatchObject({ inserted: 3, updated: 0, errors: 0 });

    const sidi = await db.execute<{ title_ar: string; title_latin: string; source_ref: string }>(
      sql`SELECT title_ar, title_latin, source_ref FROM songs WHERE search_key LIKE 'sdmnsr%'`,
    );
    expect(sidi.rows).toEqual([{ title_ar: 'سيدي منصور', title_latin: 'Sidi Mansour', source_ref: '1' }]);

    const nebni = await db.execute<{ role: string; name_latin: string }>(sql`
      SELECT sa.role, a.name_latin FROM songs s
      JOIN song_artists sa ON sa.song_id = s.id JOIN artists a ON a.id = sa.artist_id
      WHERE s.title_latin = 'Nebni' ORDER BY sa.position`);
    expect(nebni.rows).toEqual([
      { role: 'main', name_latin: 'Balti' },
      { role: 'feat', name_latin: 'Lotfi Bouchnak' },
    ]);
    const ena = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs WHERE title_latin = 'Ena'`);
    expect(Number(ena.rows[0].n)).toBe(1);

    const second = await runLrclibImport({ db, tracks: readLrclibTracks(dump), aliases: ALIASES, dryRun: false });
    expect(second).toMatchObject({ inserted: 0, updated: 3 });
    const total = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs`);
    expect(Number(total.rows[0].n)).toBe(3);
  });
});
```

- [ ] **Étape 6 : lancer le test et constater l'échec.** Lancer `pnpm test:integration -- tests/integration/lrclibImport.test.ts`. Attendu : FAIL, `runLrclibImport` introuvable.

- [ ] **Étape 7 : implémenter l'orchestration et la commande.**

```ts
// scripts/import/runLrclibImport.ts
import { upsertArtist, artistIdentityKey, type UpsertedArtist } from '@/lib/catalog/artists';
import { upsertSong, type SongArtistRef } from '@/lib/catalog/songs';
import type { Db } from '@/lib/db/client';
import type { AliasIndex } from './artistAliases';
import type { LrclibTrack } from './lrclibReader';
import { keepBest, transformTrack, type Candidate, type Rejection } from './lrclibTransform';

export interface ImportReport {
  read: number;
  rejected: Record<Rejection, number>;
  candidates: number;
  unique: number;
  merged: number;
  /** Estimation grossière : paroles × 3, pour tenir compte des colonnes de recherche et des index. */
  estimatedBytes: number;
  inserted: number;
  updated: number;
  locked: number;
  errors: number;
}

const MAX_LOGGED_ERRORS = 20;

export async function runLrclibImport(opts: {
  db: Db;
  tracks: Iterable<LrclibTrack>;
  aliases: AliasIndex;
  dryRun: boolean;
  log?: (line: string) => void;
}): Promise<ImportReport> {
  const log = opts.log ?? (() => undefined);
  const report: ImportReport = {
    read: 0,
    rejected: { empty_lyrics: 0, not_arabic: 0, no_artist: 0, empty_title: 0 },
    candidates: 0, unique: 0, merged: 0, estimatedBytes: 0,
    inserted: 0, updated: 0, locked: 0, errors: 0,
  };

  const best = new Map<string, Candidate>();
  for (const track of opts.tracks) {
    report.read += 1;
    const result = transformTrack(track, opts.aliases);
    if ('rejected' in result) {
      report.rejected[result.rejected] += 1;
      continue;
    }
    report.candidates += 1;
    keepBest(best, result);
    if (report.read % 100_000 === 0) log(`… ${report.read} pistes lues, ${best.size} chansons retenues`);
  }
  report.unique = best.size;
  report.merged = report.candidates - report.unique;
  for (const c of best.values()) report.estimatedBytes += Buffer.byteLength(c.lyrics) * 3;
  if (opts.dryRun) return report;

  const artistCache = new Map<string, UpsertedArtist>();
  for (const c of best.values()) {
    try {
      const refs: SongArtistRef[] = [];
      for (const [i, input] of c.artists.entries()) {
        const key = artistIdentityKey(input);
        let artist = artistCache.get(key);
        if (!artist) {
          artist = await upsertArtist(opts.db, input);
          artistCache.set(key, artist);
        }
        refs.push({ ...artist, role: i === 0 ? 'main' : 'feat' });
      }
      const { outcome } = await upsertSong(opts.db, {
        titleAr: c.titleAr,
        titleLatin: c.titleLatin,
        lyrics: c.lyrics,
        dialect: 'other',
        source: 'lrclib',
        sourceRef: String(c.lrclibId),
        artists: refs,
      });
      report[outcome] += 1;
    } catch (e) {
      report.errors += 1;
      if (report.errors <= MAX_LOGGED_ERRORS) log(`Erreur sur LRCLIB #${c.lrclibId} : ${String(e)}`);
    }
  }
  return report;
}
```

```ts
// scripts/import/lrclib.ts
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { db, pool } from '@/lib/db/client';
import { buildAliasIndex } from './artistAliases';
import { readLrclibTracks } from './lrclibReader';
import { runLrclibImport } from './runLrclibImport';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      dump: { type: 'string' },
      aliases: { type: 'string', default: 'scripts/import/artist-aliases.yaml' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  if (!values.dump) throw new Error('Usage : pnpm import:lrclib --dump <fichier.sqlite3> [--dry-run]');
  const report = await runLrclibImport({
    db,
    tracks: readLrclibTracks(values.dump),
    aliases: buildAliasIndex(readFileSync(values.aliases, 'utf8')),
    dryRun: values['dry-run'],
    log: (line) => console.log(line),
  });
  console.log(JSON.stringify({ ...report, estimatedMB: Math.round(report.estimatedBytes / 1e6) }, null, 2));
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

- [ ] **Étape 8 : relancer tous les tests de l'import.**

```bash
pnpm test -- tests/unit/import
pnpm test:integration -- tests/integration/lrclibImport.test.ts
```

Attendu : PASS.

- [ ] **Étape 9 : documenter le premier passage sur l'export réel.** Ajouter cette section au `README.md` :

````markdown
## Import LRCLIB

1. Télécharger le dernier export depuis https://lrclib.net/db-dumps, puis le décompresser s'il est
   compressé (`gunzip lrclib-db-dump-*.sqlite3.gz`). Le fichier fait plusieurs dizaines de Go : le
   traitement se fait en local, jamais sur le serveur.
2. Dry-run, qui mesure le volume et dimensionne la base :
   `NODE_OPTIONS=--max-old-space-size=8192 pnpm import:lrclib --dump ./lrclib.sqlite3 --dry-run`
3. Lire le rapport (`not_arabic`, `merged`, `estimatedMB`), puis compléter `artist-aliases.yaml`
   avec les variantes d'artistes repérées.
4. Import réel, avec `DATABASE_URL` pointant vers la base cible :
   `NODE_OPTIONS=--max-old-space-size=8192 pnpm import:lrclib --dump ./lrclib.sqlite3`
````

- [ ] **Étape 10 : commit.**

```bash
git add scripts/import tests/unit/import tests/integration/lrclibImport.test.ts README.md
git commit -m "feat(import): LRCLIB dump import with arabic filter, cleaning and dedupe"
```

---

### Tâche 11 : import du domaine public

**Fichiers :**
- Créer :
  - `scripts/import/publicDomainSchema.ts`, `scripts/import/runPublicDomainImport.ts`, `scripts/import/publicDomain.ts`
  - `data/public-domain/chebbi.yaml`
- Tester : `tests/unit/import/publicDomain.test.ts`, `tests/integration/publicDomainImport.test.ts`

**Interfaces :**
- Consomme : `DIALECTS` (tâche 5), `upsertArtist` et `upsertSong` (tâche 6).
- Produit :
  - `PublicDomainFile`, un schéma zod qui décrit un tableau de chansons
  - `type PublicDomainSong`
  - `isPublicDomain(s: { traditional: boolean; author_death_year?: number }, currentYear: number): boolean`
  - `type PdIssue = { key: string; reason: 'not_public_domain' | 'translit_misaligned' }`
  - `checkSong(s: PublicDomainSong, currentYear: number): PdIssue | null`
  - `interface PdReport { songs: number; rejected: PdIssue[]; inserted: number; updated: number; locked: number }`
  - `runPublicDomainImport(opts: { db: Db; files: Array<{ path: string; content: string }>; currentYear: number; dryRun: boolean }): Promise<PdReport>`

**Règles**, conformes à la spec §11.2 :
- une chanson est acceptée si `traditional: true`, ou si `author_death_year <= currentYear − 51` (50 ans à compter du 1er janvier qui suit le décès) ;
- une translittération fournie doit avoir exactement autant de lignes que les paroles, et elle est alors importée en `reviewed` ;
- un fichier invalide ou une clé en double **interrompt** l'import, parce que ces fichiers sont écrits à la main et doivent être corrigés.

- [ ] **Étape 1 : écrire les tests unitaires, qui doivent échouer.**

```ts
// tests/unit/import/publicDomain.test.ts
import { describe, expect, it } from 'vitest';
import { checkSong, isPublicDomain, type PublicDomainSong } from '../../../scripts/import/publicDomainSchema';

const song: PublicDomainSong = {
  key: 'test', title_ar: 'عنوان', artists: [{ name_ar: 'فنان' }], lyricist: 'شاعر',
  author_death_year: 1934, traditional: false, dialect: 'msa',
  lyrics: 'سطر أول من القصيدة\nسطر ثاني من القصيدة',
};

describe('isPublicDomain', () => {
  it('applique vie + 50 ans à compter du 1er janvier suivant le décès', () => {
    expect(isPublicDomain({ traditional: false, author_death_year: 1975 }, 2026)).toBe(true);
    expect(isPublicDomain({ traditional: false, author_death_year: 1976 }, 2026)).toBe(false);
    expect(isPublicDomain({ traditional: true }, 2026)).toBe(true);
    expect(isPublicDomain({ traditional: false }, 2026)).toBe(false);
  });
});

describe('checkSong', () => {
  it('accepte une œuvre libre sans translittération', () => {
    expect(checkSong(song, 2026)).toBeNull();
  });
  it('refuse une œuvre encore protégée', () => {
    expect(checkSong({ ...song, author_death_year: 1990 }, 2026)).toEqual({ key: 'test', reason: 'not_public_domain' });
  });
  it('refuse une translittération mal alignée', () => {
    expect(checkSong({ ...song, lyrics_translit: 'une seule ligne' }, 2026))
      .toEqual({ key: 'test', reason: 'translit_misaligned' });
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/import/publicDomain.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter le schéma et les vérifications.**

```ts
// scripts/import/publicDomainSchema.ts
import { z } from 'zod';
import { DIALECTS } from '@/lib/db/schema';

const Artist = z
  .object({ name_ar: z.string().min(1).optional(), name_latin: z.string().min(1).optional() })
  .refine((a) => a.name_ar || a.name_latin, { message: 'artiste sans nom' });

export const PublicDomainSongSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9-]+$/),
    title_ar: z.string().min(1).optional(),
    title_latin: z.string().min(1).optional(),
    artists: z.array(Artist).min(1),
    lyricist: z.string().min(1),
    author_death_year: z.number().int().optional(),
    traditional: z.boolean().default(false),
    dialect: z.enum(DIALECTS),
    lyrics: z.string().min(20),
    lyrics_translit: z.string().optional(),
  })
  .refine((s) => s.title_ar || s.title_latin, { message: 'titre manquant' });

export const PublicDomainFile = z.array(PublicDomainSongSchema);
export type PublicDomainSong = z.infer<typeof PublicDomainSongSchema>;
export type PdIssue = { key: string; reason: 'not_public_domain' | 'translit_misaligned' };

export function isPublicDomain(
  s: { traditional: boolean; author_death_year?: number },
  currentYear: number,
): boolean {
  return s.traditional || (s.author_death_year !== undefined && s.author_death_year <= currentYear - 51);
}

const lineCount = (text: string): number => text.trim().split('\n').length;

export function checkSong(s: PublicDomainSong, currentYear: number): PdIssue | null {
  if (!isPublicDomain(s, currentYear)) return { key: s.key, reason: 'not_public_domain' };
  if (s.lyrics_translit !== undefined && lineCount(s.lyrics_translit) !== lineCount(s.lyrics)) {
    return { key: s.key, reason: 'translit_misaligned' };
  }
  return null;
}
```

- [ ] **Étape 4 : relancer les tests unitaires.** Lancer `pnpm test -- tests/unit/import/publicDomain.test.ts`. Attendu : PASS.

- [ ] **Étape 5 : écrire le test d'intégration, qui doit échouer.**

```ts
// tests/integration/publicDomainImport.test.ts
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { runPublicDomainImport } from '../../scripts/import/runPublicDomainImport';
import { resetDb } from './helpers';

const FILE = `
- key: chebbi-test
  title_ar: إرادة الحياة
  artists: [{ name_ar: أبو القاسم الشابي, name_latin: Abou el Kacem Chebbi }]
  lyricist: أبو القاسم الشابي
  author_death_year: 1934
  dialect: msa
  lyrics: |
    إذا الشعب يوما أراد الحياة
    فلا بد أن يستجيب القدر
- key: protected-test
  title_ar: أغنية محمية
  artists: [{ name_ar: فنان }]
  lyricist: شاعر
  author_death_year: 1990
  dialect: tn
  lyrics: |
    سطر أول للأغنية المحمية
- key: malouf-test
  title_ar: نوبة تجريبية
  artists: [{ name_ar: مالوف تونسي, name_latin: Malouf Tounsi }]
  lyricist: تراث
  traditional: true
  dialect: tn
  lyrics: |
    سطر أول من النوبة
    سطر ثاني من النوبة
  lyrics_translit: |
    str awel min ennouba
    str thani min ennouba
`;

describe('runPublicDomainImport', () => {
  beforeEach(resetDb);

  it('importe les œuvres libres, refuse les autres, reste idempotent', async () => {
    const files = [{ path: 'data/public-domain/test.yaml', content: FILE }];
    const first = await runPublicDomainImport({ db, files, currentYear: 2026, dryRun: false });
    expect(first).toMatchObject({ songs: 3, inserted: 2, updated: 0 });
    expect(first.rejected).toEqual([{ key: 'protected-test', reason: 'not_public_domain' }]);

    const malouf = await db.execute<{ translit_status: string; source: string; source_ref: string }>(
      sql`SELECT translit_status, source, source_ref FROM songs WHERE source_ref = 'malouf-test'`,
    );
    expect(malouf.rows[0]).toEqual({ translit_status: 'reviewed', source: 'public_domain', source_ref: 'malouf-test' });

    const second = await runPublicDomainImport({ db, files, currentYear: 2026, dryRun: false });
    expect(second).toMatchObject({ inserted: 0, updated: 2 });
  });

  it('dry-run n’écrit rien', async () => {
    const files = [{ path: 'x.yaml', content: FILE }];
    const report = await runPublicDomainImport({ db, files, currentYear: 2026, dryRun: true });
    expect(report).toMatchObject({ songs: 3, inserted: 0 });
    const n = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs`);
    expect(Number(n.rows[0].n)).toBe(0);
  });

  it('interrompt sur un fichier invalide ou une clé en double, en nommant le fichier', async () => {
    await expect(
      runPublicDomainImport({ db, files: [{ path: 'bad.yaml', content: '- key: X' }], currentYear: 2026, dryRun: true }),
    ).rejects.toThrow(/bad\.yaml/);
    await expect(
      runPublicDomainImport({
        db, currentYear: 2026, dryRun: true,
        files: [{ path: 'a.yaml', content: FILE }, { path: 'b.yaml', content: FILE }],
      }),
    ).rejects.toThrow(/chebbi-test/);
  });
});
```

- [ ] **Étape 6 : lancer le test et constater l'échec.** Lancer `pnpm test:integration -- tests/integration/publicDomainImport.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 7 : implémenter l'orchestration, la commande et le premier fichier de données.**

```ts
// scripts/import/runPublicDomainImport.ts
import { parse } from 'yaml';
import { upsertArtist } from '@/lib/catalog/artists';
import { upsertSong, type SongArtistRef } from '@/lib/catalog/songs';
import type { Db } from '@/lib/db/client';
import { checkSong, PublicDomainFile, type PdIssue, type PublicDomainSong } from './publicDomainSchema';

export interface PdReport {
  songs: number;
  rejected: PdIssue[];
  inserted: number;
  updated: number;
  locked: number;
}

export async function runPublicDomainImport(opts: {
  db: Db;
  files: Array<{ path: string; content: string }>;
  currentYear: number;
  dryRun: boolean;
}): Promise<PdReport> {
  const all: PublicDomainSong[] = [];
  const seenKeys = new Map<string, string>();
  for (const file of opts.files) {
    const parsed = PublicDomainFile.safeParse(parse(file.content) ?? []);
    if (!parsed.success) throw new Error(`${file.path} invalide : ${parsed.error.message}`);
    for (const song of parsed.data) {
      const previous = seenKeys.get(song.key);
      if (previous) throw new Error(`Clé en double « ${song.key} » dans ${previous} et ${file.path}`);
      seenKeys.set(song.key, file.path);
      all.push(song);
    }
  }

  const report: PdReport = { songs: all.length, rejected: [], inserted: 0, updated: 0, locked: 0 };
  const valid = all.filter((s) => {
    const issue = checkSong(s, opts.currentYear);
    if (issue) report.rejected.push(issue);
    return !issue;
  });
  if (opts.dryRun) return report;

  for (const s of valid) {
    const refs: SongArtistRef[] = [];
    for (const [i, a] of s.artists.entries()) {
      const artist = await upsertArtist(opts.db, { nameAr: a.name_ar, nameLatin: a.name_latin });
      refs.push({ ...artist, role: i === 0 ? 'main' : 'feat' });
    }
    const { outcome } = await upsertSong(opts.db, {
      titleAr: s.title_ar,
      titleLatin: s.title_latin,
      lyrics: s.lyrics.trim(),
      lyricsTranslit: s.lyrics_translit?.trim(),
      translitStatus: s.lyrics_translit ? 'reviewed' : 'none',
      dialect: s.dialect,
      source: 'public_domain',
      sourceRef: s.key,
      artists: refs,
    });
    report[outcome] += 1;
  }
  return report;
}
```

```ts
// scripts/import/publicDomain.ts
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { db, pool } from '@/lib/db/client';
import { runPublicDomainImport } from './runPublicDomainImport';

const DATA_DIR = 'data/public-domain';

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean', default: false } } });
  const files = readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => ({ path: path.join(DATA_DIR, f), content: readFileSync(path.join(DATA_DIR, f), 'utf8') }));
  const report = await runPublicDomainImport({
    db, files, currentYear: new Date().getFullYear(), dryRun: values['dry-run'],
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.rejected.length > 0) process.exitCode = 1;
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

```yaml
# data/public-domain/chebbi.yaml
# Abou el Kacem Chebbi, mort en 1934 : domaine public en Tunisie (vie + 50 ans).
- key: chebbi-iradat-al-hayat
  title_ar: إرادة الحياة
  title_latin: Iradat al Hayat
  artists:
    - name_ar: أبو القاسم الشابي
      name_latin: Abou el Kacem Chebbi
  lyricist: أبو القاسم الشابي
  author_death_year: 1934
  dialect: msa
  lyrics: |
    إذا الشعب يوما أراد الحياة
    فلا بد أن يستجيب القدر
    ولا بد لليل أن ينجلي
    ولا بد للقيد أن ينكسر
```

- [ ] **Étape 8 : relancer les tests et vérifier le fichier réel.**

```bash
pnpm test -- tests/unit/import
pnpm test:integration -- tests/integration/publicDomainImport.test.ts
pnpm import:public-domain --dry-run
```

Attendu : PASS pour les deux premières commandes. La troisième affiche `"songs": 1` et `"rejected": []`.

- [ ] **Étape 9 : commit.**

```bash
git add scripts/import data/public-domain tests/unit/import tests/integration/publicDomainImport.test.ts
git commit -m "feat(import): public-domain YAML import with rights check"
```

---

### Tâche 12 : interface en français et en arabe, accueil et page de recherche

**Fichiers :**
- Créer :
  - `src/i18n/locale.ts`, `src/i18n/request.ts`, `messages/fr.json`, `messages/ar.json`
  - `src/app/actions/locale.ts`, `src/app/manifest.ts`, `src/app/error.tsx`, `public/icon.svg`
  - `src/components/LocaleSwitcher.tsx`, `src/components/SearchBar.tsx`, `src/components/ArtistNames.tsx`, `src/components/SongResultItem.tsx`
  - `src/app/recherche/page.tsx`
- Modifier : `next.config.ts`, `src/app/layout.tsx` et `src/app/page.tsx`, à remplacer entièrement
- Tester : `tests/unit/i18n/locale.test.ts`

**Interfaces :**
- Consomme :
  - `searchSongs`, `PAGE_SIZE` et `SongHit` (tâche 7) ;
  - `hitRateLimit`, `SEARCH_RATE_LIMIT` et `clientIp` (tâche 9).
- Produit :
  - `type Locale = 'fr' | 'ar'`
  - `pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale`
  - `artistLabel(a: { nameAr: string | null; nameLatin: string | null }): string`
  - les composants `<SearchBar defaultValue?>`, `<SongResultItem hit>`, `<ArtistNames artists className?>` et `<LocaleSwitcher />`
  - les espaces de messages `app`, `search`, `song`, `artist`, `dialects`, `locale` et `error`

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

```ts
// tests/unit/i18n/locale.test.ts
import { describe, expect, it } from 'vitest';
import { pickLocale } from '@/i18n/locale';
import fr from '../../../messages/fr.json';
import ar from '../../../messages/ar.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('pickLocale', () => {
  it('le cookie prime, puis Accept-Language, puis le français', () => {
    expect(pickLocale('ar', 'fr-FR')).toBe('ar');
    expect(pickLocale(undefined, 'ar-TN,ar;q=0.9')).toBe('ar');
    expect(pickLocale('xx', 'en-US')).toBe('fr');
    expect(pickLocale(undefined, null)).toBe('fr');
  });
});

describe('messages', () => {
  it('fr et ar ont exactement les mêmes clés', () => {
    expect(keys(ar).sort()).toEqual(keys(fr).sort());
  });
});
```

Lancer `pnpm test -- tests/unit/i18n`. Attendu : FAIL, modules introuvables. Si TypeScript refuse l'import des fichiers JSON, ajouter `"resolveJsonModule": true` dans `tsconfig.json` ; create-next-app l'active normalement.

- [ ] **Étape 2 : écrire le choix de la langue, la configuration next-intl et les messages.**

```ts
// src/i18n/locale.ts
export const LOCALES = ['fr', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (cookie === 'fr' || cookie === 'ar') return cookie;
  return acceptLanguage?.trim().toLowerCase().startsWith('ar') ? 'ar' : 'fr';
}
```

```ts
// src/i18n/request.ts
import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { pickLocale } from './locale';

export default getRequestConfig(async () => {
  const locale = pickLocale((await cookies()).get('locale')?.value, (await headers()).get('accept-language'));
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
```

```ts
// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = { output: 'standalone' };

export default withNextIntl(nextConfig);
```

```json
// messages/fr.json
{
  "app": { "name": "Ghanni", "tagline": "Les paroles de vos chansons, pour chanter ensemble" },
  "search": {
    "placeholder": "Titre, artiste ou paroles…",
    "submit": "Chercher",
    "tooShort": "Tapez au moins 2 lettres.",
    "noResults": "Aucune chanson trouvée pour « {query} ».",
    "results": "{total, plural, one {# résultat} other {# résultats}}",
    "rateLimited": "Trop de recherches d'un coup. Réessayez dans une minute.",
    "previous": "Précédent",
    "next": "Suivant"
  },
  "song": {
    "source": "Source : {source}",
    "sources": { "lrclib": "LRCLIB", "public_domain": "Domaine public", "contribution": "Contribution" },
    "notFound": "Cette chanson est introuvable ou a été retirée.",
    "backToSearch": "Retour à la recherche",
    "feat": "avec {names}"
  },
  "artist": { "songs": "Chansons", "noSongs": "Aucune chanson publiée." },
  "dialects": {
    "tn": "Tunisien", "eg": "Égyptien", "lev": "Levantin", "gulf": "Golfe",
    "maghreb_other": "Maghreb", "msa": "Arabe littéral", "other": "Autre"
  },
  "locale": { "switchTo": "العربية" },
  "error": { "title": "Une erreur est survenue.", "reference": "Référence : {digest}", "retry": "Réessayer" }
}
```

```json
// messages/ar.json
{
  "app": { "name": "غنّي", "tagline": "كلمات أغانيكم للغناء معاً" },
  "search": {
    "placeholder": "العنوان أو الفنان أو الكلمات…",
    "submit": "ابحث",
    "tooShort": "اكتب حرفين على الأقل.",
    "noResults": "لا توجد أغنية لـ«{query}».",
    "results": "{total, plural, zero {لا نتائج} one {نتيجة واحدة} two {نتيجتان} few {# نتائج} many {# نتيجة} other {# نتيجة}}",
    "rateLimited": "عمليات بحث كثيرة. أعد المحاولة بعد دقيقة.",
    "previous": "السابق",
    "next": "التالي"
  },
  "song": {
    "source": "المصدر: {source}",
    "sources": { "lrclib": "LRCLIB", "public_domain": "ملك عام", "contribution": "مساهمة" },
    "notFound": "هذه الأغنية غير موجودة أو تمّ سحبها.",
    "backToSearch": "العودة إلى البحث",
    "feat": "مع {names}"
  },
  "artist": { "songs": "الأغاني", "noSongs": "لا توجد أغانٍ منشورة." },
  "dialects": {
    "tn": "تونسي", "eg": "مصري", "lev": "شامي", "gulf": "خليجي",
    "maghreb_other": "مغاربي", "msa": "فصحى", "other": "أخرى"
  },
  "locale": { "switchTo": "Français" },
  "error": { "title": "حدث خطأ.", "reference": "المرجع: {digest}", "retry": "أعد المحاولة" }
}
```

Les fichiers JSON n'acceptent pas de commentaires : la première ligne `// messages/…` de chaque bloc ci-dessus indique seulement le chemin, elle ne doit pas être copiée.

- [ ] **Étape 3 : relancer les tests.** Lancer `pnpm test -- tests/unit/i18n`. Attendu : PASS.

- [ ] **Étape 4 : écrire la mise en page, le changement de langue, le manifeste et la page d'erreur.**

```tsx
// src/app/actions/locale.ts
'use server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function setLocale(formData: FormData): Promise<void> {
  const value = formData.get('locale');
  if (value !== 'fr' && value !== 'ar') return;
  (await cookies()).set('locale', value, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  revalidatePath('/', 'layout');
}
```

```tsx
// src/components/LocaleSwitcher.tsx
import { getLocale, getTranslations } from 'next-intl/server';
import { setLocale } from '@/app/actions/locale';

export async function LocaleSwitcher() {
  const locale = await getLocale();
  const t = await getTranslations('locale');
  return (
    <form action={setLocale}>
      <input type="hidden" name="locale" value={locale === 'ar' ? 'fr' : 'ar'} />
      <button type="submit" className="text-sm underline underline-offset-4">
        {t('switchTo')}
      </button>
    </form>
  );
}
```

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('app');
  return { title: { default: t('name'), template: `%s · ${t('name')}` }, description: t('tagline') };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#111827' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations('app');
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <NextIntlClientProvider>
          <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <Link href="/" className="text-lg font-bold">{t('name')}</Link>
            <LocaleSwitcher />
          </header>
          <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

```ts
// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ghanni',
    short_name: 'Ghanni',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
```

```svg
<!-- public/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#111827"/>
  <text x="256" y="330" font-size="280" text-anchor="middle" fill="#ffffff" font-family="serif">غ</text>
</svg>
```

```tsx
// src/app/error.tsx
'use client';
import { useTranslations } from 'next-intl';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('error');
  return (
    <div role="alert" className="flex flex-col gap-3">
      <p className="font-semibold">{t('title')}</p>
      {error.digest && <p className="text-sm text-gray-500">{t('reference', { digest: error.digest })}</p>}
      <button type="button" onClick={reset} className="self-start underline">{t('retry')}</button>
    </div>
  );
}
```

`error.digest` est l'identifiant que Next.js écrit aussi dans les journaux serveur. Il sert d'identifiant de corrélation, comme le demande la spec §12.

- [ ] **Étape 5 : écrire la barre de recherche, les résultats, l'accueil et la page de recherche.**

```tsx
// src/components/SearchBar.tsx
import { getTranslations } from 'next-intl/server';

export async function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const t = await getTranslations('search');
  return (
    <form action="/recherche" method="get" role="search" className="flex gap-2">
      <input
        type="search" name="q" defaultValue={defaultValue} placeholder={t('placeholder')}
        aria-label={t('placeholder')} dir="auto" autoComplete="off" required minLength={2}
        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-lg dark:border-gray-700 dark:bg-gray-900"
      />
      <button type="submit" className="rounded-lg bg-gray-900 px-4 py-3 text-white dark:bg-gray-100 dark:text-gray-900">
        {t('submit')}
      </button>
    </form>
  );
}
```

```tsx
// src/components/ArtistNames.tsx
import type { ArtistRef } from '@/lib/search/types';

export function artistLabel(a: { nameAr: string | null; nameLatin: string | null }): string {
  if (a.nameAr && a.nameLatin) return `${a.nameAr} · ${a.nameLatin}`;
  return a.nameAr ?? a.nameLatin ?? '';
}

export function ArtistNames({ artists, className }: { artists: ArtistRef[]; className?: string }) {
  return <span className={className}>{artists.map(artistLabel).join(', ')}</span>;
}
```

```tsx
// src/components/SongResultItem.tsx
import Link from 'next/link';
import type { SongHit } from '@/lib/search/types';
import { ArtistNames } from './ArtistNames';

export function SongResultItem({ hit }: { hit: SongHit }) {
  return (
    <li className="py-3">
      <Link href={`/chanson/${hit.id}`} className="block">
        {hit.titleAr && <span dir="rtl" lang="ar" className="block text-lg font-semibold">{hit.titleAr}</span>}
        {hit.titleLatin && <span dir="ltr" className="block text-gray-700 dark:text-gray-300">{hit.titleLatin}</span>}
        <ArtistNames artists={hit.artists} className="block text-sm text-gray-600 dark:text-gray-400" />
        {hit.snippet && <span dir="rtl" lang="ar" className="mt-1 block text-sm italic">« {hit.snippet} »</span>}
      </Link>
    </li>
  );
}
```

```tsx
// src/app/page.tsx
import { getTranslations } from 'next-intl/server';
import { SearchBar } from '@/components/SearchBar';

export default async function HomePage() {
  const t = await getTranslations('app');
  return (
    <section className="flex flex-col gap-6 pt-10">
      <h1 className="text-3xl font-bold">{t('name')}</h1>
      <p className="text-gray-600 dark:text-gray-400">{t('tagline')}</p>
      <SearchBar />
    </section>
  );
}
```

```tsx
// src/app/recherche/page.tsx
import { headers } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SearchBar } from '@/components/SearchBar';
import { SongResultItem } from '@/components/SongResultItem';
import { clientIp } from '@/lib/ratelimit/clientIp';
import { hitRateLimit, SEARCH_RATE_LIMIT } from '@/lib/ratelimit/fixedWindow';
import { searchSongs } from '@/lib/search/searchSongs';
import { PAGE_SIZE } from '@/lib/search/types';

export const dynamic = 'force-dynamic';

type Params = { q?: string | string[]; page?: string | string[] };
const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = first(params.q) ?? '';
  const pageParam = Number(first(params.page));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const t = await getTranslations('search');

  const { allowed } = await hitRateLimit(
    `search:${clientIp(await headers())}`,
    SEARCH_RATE_LIMIT.limit,
    SEARCH_RATE_LIMIT.windowSeconds,
  );
  if (!allowed) {
    return (
      <>
        <SearchBar defaultValue={q} />
        <p role="alert" className="mt-6">{t('rateLimited')}</p>
      </>
    );
  }

  const result = await searchSongs(q, { page });
  const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const href = (p: number) => `/recherche?${new URLSearchParams({ q, page: String(p) }).toString()}`;

  return (
    <>
      <SearchBar defaultValue={q} />
      <div className="mt-6">
        {result.tooShort ? (
          <p>{t('tooShort')}</p>
        ) : result.items.length === 0 ? (
          <p>{t('noResults', { query: q })}</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t('results', { total: result.total })}</p>
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {result.items.map((hit) => <SongResultItem key={hit.id} hit={hit} />)}
            </ul>
            <nav className="mt-6 flex justify-between">
              {page > 1 ? <Link href={href(page - 1)}>{t('previous')}</Link> : <span />}
              {page < lastPage ? <Link href={href(page + 1)}>{t('next')}</Link> : <span />}
            </nav>
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Étape 6 : vérifier à la main sur la base de développement.**

```bash
pnpm db:migrate && pnpm import:public-domain
pnpm typecheck && pnpm lint
pnpm dev
```

Ouvrir `http://localhost:3000` en vue mobile, avec les outils de développement du navigateur à 390 px de large. Vérifier :
- la recherche « chebbi » trouve « إرادة الحياة » ;
- la recherche « a » affiche « Tapez au moins 2 lettres. » ;
- le bouton « العربية » passe l'interface en arabe : `<html dir="rtl">` et bouton « ابحث ».

Les tests automatisés de ces parcours sont écrits à la tâche 14.

- [ ] **Étape 7 : commit.**

```bash
git add src messages public next.config.ts tsconfig.json tests/unit/i18n
git commit -m "feat(web): bilingual layout, home and search page"
```

---

### Tâche 13 : fiche chanson et page artiste

**Fichiers :**
- Créer :
  - `src/components/LyricsView.tsx`
  - `src/app/chanson/[id]/page.tsx`, `src/app/chanson/[id]/not-found.tsx`
  - `src/app/artiste/[id]/page.tsx`
- Tester : couvert par les tests de bout en bout de la tâche 14.

**Interfaces :**
- Consomme : `getSongById` et `getArtistWithSongs` (tâche 8), `artistLabel` (tâche 12).
- Produit : `<LyricsView lyrics>`, qui affiche les paroles avec `data-testid="lyrics"`, `dir="rtl"` et `lang="ar"`, un paragraphe par couplet.

- [ ] **Étape 1 : écrire l'affichage des paroles.** Il est en texte brut, jamais en HTML.

```tsx
// src/components/LyricsView.tsx
export function LyricsView({ lyrics }: { lyrics: string }) {
  const stanzas = lyrics.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return (
    <div dir="rtl" lang="ar" data-testid="lyrics" className="flex flex-col gap-6 text-2xl leading-loose">
      {stanzas.map((stanza, i) => (
        <p key={i} className="whitespace-pre-line">{stanza}</p>
      ))}
    </div>
  );
}
```

- [ ] **Étape 2 : écrire la fiche chanson et sa page « introuvable ».**

```tsx
// src/app/chanson/[id]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { artistLabel } from '@/components/ArtistNames';
import { LyricsView } from '@/components/LyricsView';
import { getSongById } from '@/lib/catalog/queries';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song = await getSongById((await params).id);
  if (!song) return { robots: { index: false } };
  return { title: song.titleAr ?? song.titleLatin ?? undefined };
}

export default async function SongPage({ params }: Props) {
  const song = await getSongById((await params).id);
  if (!song) notFound();
  const t = await getTranslations('song');
  const td = await getTranslations('dialects');
  const main = song.artists.filter((a) => a.role === 'main');
  const feat = song.artists.filter((a) => a.role === 'feat');

  return (
    <article className="flex flex-col gap-6">
      <header>
        {song.titleAr ? (
          <>
            <h1 dir="rtl" lang="ar" className="text-3xl font-bold">{song.titleAr}</h1>
            {song.titleLatin && <p dir="ltr" className="text-xl text-gray-700 dark:text-gray-300">{song.titleLatin}</p>}
          </>
        ) : (
          <h1 dir="ltr" className="text-3xl font-bold">{song.titleLatin}</h1>
        )}
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {main.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ', '}
              <Link href={`/artiste/${a.id}`} className="underline underline-offset-4">{artistLabel(a)}</Link>
            </span>
          ))}
          {feat.length > 0 && <> — {t('feat', { names: feat.map(artistLabel).join(', ') })}</>}
          {' · '}
          {td(song.dialect)}
        </p>
      </header>
      <LyricsView lyrics={song.lyrics} />
      <footer className="text-sm text-gray-500">{t('source', { source: t(`sources.${song.source}`) })}</footer>
    </article>
  );
}
```

```tsx
// src/app/chanson/[id]/not-found.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function SongNotFound() {
  const t = await getTranslations('song');
  return (
    <div className="flex flex-col gap-4">
      <p>{t('notFound')}</p>
      <Link href="/" className="underline underline-offset-4">{t('backToSearch')}</Link>
    </div>
  );
}
```

- [ ] **Étape 3 : écrire la page artiste.**

```tsx
// src/app/artiste/[id]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getArtistWithSongs } from '@/lib/catalog/queries';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtistWithSongs((await params).id);
  return artist ? { title: artist.nameAr ?? artist.nameLatin ?? undefined } : { robots: { index: false } };
}

export default async function ArtistPage({ params }: Props) {
  const artist = await getArtistWithSongs((await params).id);
  if (!artist) notFound();
  const t = await getTranslations('artist');
  return (
    <section className="flex flex-col gap-4">
      {artist.nameAr ? (
        <>
          <h1 dir="rtl" lang="ar" className="text-3xl font-bold">{artist.nameAr}</h1>
          {artist.nameLatin && <p dir="ltr" className="text-xl text-gray-700 dark:text-gray-300">{artist.nameLatin}</p>}
        </>
      ) : (
        <h1 dir="ltr" className="text-3xl font-bold">{artist.nameLatin}</h1>
      )}
      <h2 className="mt-4 text-lg font-semibold">{t('songs')}</h2>
      {artist.songs.length === 0 ? (
        <p>{t('noSongs')}</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {artist.songs.map((s) => (
            <li key={s.id} className="py-3">
              <Link href={`/chanson/${s.id}`} className="block">
                {s.titleAr && <span dir="rtl" lang="ar" className="block text-lg">{s.titleAr}</span>}
                {s.titleLatin && <span dir="ltr" className="block text-gray-600 dark:text-gray-400">{s.titleLatin}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Étape 4 : vérifier à la main.** Lancer `pnpm typecheck && pnpm lint && pnpm dev`, puis :
- chercher « chebbi » et ouvrir le résultat : les paroles sont affichées de droite à gauche et la mention « Source : Domaine public » apparaît ;
- cliquer sur l'artiste : sa page liste la chanson ;
- ouvrir `/chanson/abc` : la page affiche « introuvable ou a été retirée ».

- [ ] **Étape 5 : commit.**

```bash
git add src && git commit -m "feat(web): song and artist pages with RTL lyrics"
```

---

### Tâche 14 : tests de bout en bout sur écran mobile (Playwright)

**Fichiers :**
- Créer : `playwright.config.ts`, `scripts/seed-fixtures.ts`, `tests/e2e/globalSetup.ts`, `tests/e2e/search.spec.ts`
- Modifier : `.gitignore`, pour ajouter `test-results/` et `playwright-report/`

**Interfaces :**
- Consomme : `seedFixtures` (tâche 7) et les pages des tâches 12 et 13.
- Produit : la commande `pnpm test:e2e`, qui construit l'application, la sert sur le port 3100 avec la base de test et lance les parcours sur un écran Pixel 7.

- [ ] **Étape 1 : écrire le script d'amorçage, protégé contre une base distante.**

```ts
// scripts/seed-fixtures.ts
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db, pool } from '@/lib/db/client';
import { seedFixtures } from '../tests/fixtures/seed';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? '';
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
    throw new Error('seed-fixtures vide la base : refusé hors de localhost.');
  }
  await db.execute(sql`TRUNCATE song_artists, songs, artists, rate_limits CASCADE`);
  const ids = await seedFixtures(db);
  console.log(`${ids.size} chansons de test insérées.`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

- [ ] **Étape 2 : écrire la configuration Playwright et la préparation globale.**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const DATABASE_URL = process.env.DATABASE_URL_TEST ?? 'postgres://ghanni:ghanni@localhost:5433/ghanni_test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  globalSetup: './tests/e2e/globalSetup.ts',
  use: { baseURL: 'http://localhost:3100', trace: 'on-first-retry' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'pnpm build && pnpm start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: { DATABASE_URL },
  },
});
```

```ts
// tests/e2e/globalSetup.ts
import { execSync } from 'node:child_process';

export default function globalSetup(): void {
  const DATABASE_URL = process.env.DATABASE_URL_TEST ?? 'postgres://ghanni:ghanni@localhost:5433/ghanni_test';
  execSync('pnpm db:migrate && pnpm seed:fixtures', { stdio: 'inherit', env: { ...process.env, DATABASE_URL } });
}
```

Le serveur web ouvre ses connexions à PostgreSQL seulement à la première requête. L'ordre de démarrage entre `webServer` et `globalSetup` n'a donc pas d'importance.

- [ ] **Étape 3 : écrire les parcours.**

```ts
// tests/e2e/search.spec.ts
import { expect, test } from '@playwright/test';

test('chercher en arabizi, ouvrir la chanson, puis l’artiste', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('sidi mansur');
  await page.getByRole('button', { name: 'Chercher' }).click();
  await expect(page).toHaveURL(/\/recherche\?q=sidi\+mansur/);

  await page.getByRole('link', { name: /Sidi Mansour/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('سيدي منصور');
  const lyrics = page.getByTestId('lyrics');
  await expect(lyrics).toHaveAttribute('dir', 'rtl');
  await expect(lyrics).toContainText('نغني مع الأحباب');

  await page.getByRole('link', { name: /Saber Rebai/ }).click();
  await expect(page.getByRole('link', { name: /على نار/ })).toBeVisible();
});

test('chercher un passage des paroles affiche l’extrait', async ({ page }) => {
  await page.goto('/recherche?q=' + encodeURIComponent('يستجيب القدر'));
  await expect(page.getByText('« فلا بد أن يستجيب القدر »')).toBeVisible();
});

test('une requête trop courte est expliquée', async ({ page }) => {
  await page.goto('/recherche?q=a');
  await expect(page.getByText('Tapez au moins 2 lettres.')).toBeVisible();
});

test('basculer en arabe met l’interface de droite à gauche', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'العربية' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('button', { name: 'ابحث' })).toBeVisible();
  await page.getByRole('button', { name: 'Français' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('une chanson inconnue renvoie 404 avec un message clair', async ({ page }) => {
  const res = await page.goto('/chanson/6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f');
  expect(res?.status()).toBe(404);
  await expect(page.getByText('introuvable ou a été retirée')).toBeVisible();
});
```

- [ ] **Étape 4 : lancer les tests.**

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Attendu : 5 tests PASS sur le projet `mobile`.

- [ ] **Étape 5 : commit.**

```bash
git add playwright.config.ts scripts/seed-fixtures.ts tests/e2e .gitignore package.json
git commit -m "test(e2e): mobile search, song, artist and locale journeys"
```

---

### Tâche 15 : benchmark de la recherche et requêtes de référence sur les données réelles

**Fichiers :**
- Créer : `scripts/bench-search.ts`, `data/search-golden.yaml`
- Modifier : `README.md`, pour ajouter la section « Benchmark »

**Interfaces :**
- Consomme : `searchSongs` et `WORD_SIMILARITY_THRESHOLD` (tâche 7), `toSearchKey` (tâche 3).
- Produit : la commande `pnpm bench:search [--sample 1000]`. Elle affiche le p50, le p95 et le p99, puis la précision sur les requêtes de référence. Elle sort en échec (code 1) si le p95 dépasse 300 ms ou si une requête de référence échoue.

Prérequis : l'import LRCLIB réel (tâche 10, étape 9) a été exécuté sur la base que vise `DATABASE_URL`.

- [ ] **Étape 1 : écrire le benchmark.**

```ts
// scripts/bench-search.ts
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { sql } from 'drizzle-orm';
import { parse } from 'yaml';
import { z } from 'zod';
import { db, pool } from '@/lib/db/client';
import { searchSongs, WORD_SIMILARITY_THRESHOLD } from '@/lib/search/searchSongs';
import { toSearchKey } from '@/lib/text/searchKey';

const P95_TARGET_MS = 300;
const Golden = z.array(z.object({ query: z.string().min(1), expected_title: z.string().min(1) }));

function percentile(sortedMs: number[], p: number): number {
  return sortedMs[Math.min(sortedMs.length - 1, Math.floor((p / 100) * sortedMs.length))] ?? 0;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = performance.now();
  const value = await fn();
  return { ms: performance.now() - start, value };
}

async function sampleQueries(n: number): Promise<string[]> {
  const res = await db.execute<{ title_ar: string | null; title_latin: string | null; artist: string | null; line: string }>(sql`
    SELECT s.title_ar, s.title_latin,
      (SELECT COALESCE(a.name_latin, a.name_ar) FROM song_artists sa JOIN artists a ON a.id = sa.artist_id
        WHERE sa.song_id = s.id ORDER BY sa.position LIMIT 1) AS artist,
      split_part(s.lyrics, E'\n', 2) AS line
    FROM songs s WHERE s.status = 'published' ORDER BY random() LIMIT ${n}`);
  const queries: string[] = [];
  for (const r of res.rows) {
    if (r.title_latin) queries.push(r.title_latin);
    if (r.title_ar) queries.push(r.title_ar);
    if (r.artist) queries.push(r.artist);
    const words = r.line.split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
    if (words) queries.push(words);
  }
  return queries.slice(0, n);
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { sample: { type: 'string', default: '1000' } } });
  const golden = Golden.parse(parse(readFileSync('data/search-golden.yaml', 'utf8')));
  const count = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs WHERE status = 'published'`);
  console.log(`Chansons publiées : ${count.rows[0].n} — seuil word_similarity : ${WORD_SIMILARITY_THRESHOLD}`);

  const queries = await sampleQueries(Number(values.sample));
  for (const q of queries.slice(0, 20)) await searchSongs(q); // préchauffage, non mesuré

  const durations: number[] = [];
  for (const q of queries) durations.push((await timed(() => searchSongs(q))).ms);

  const misses: string[] = [];
  for (const g of golden) {
    const { ms, value } = await timed(() => searchSongs(g.query));
    durations.push(ms);
    const key = toSearchKey(g.expected_title);
    const top3 = value.items.slice(0, 3);
    if (!top3.some((h) => toSearchKey(h.titleAr ?? '') === key || toSearchKey(h.titleLatin ?? '') === key)) {
      misses.push(`« ${g.query} » → attendu « ${g.expected_title} », obtenu : ${top3.map((h) => h.titleAr ?? h.titleLatin).join(' | ')}`);
    }
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const p95 = percentile(sorted, 95);
  console.log(`Requêtes : ${sorted.length} — p50 ${percentile(sorted, 50).toFixed(0)} ms — p95 ${p95.toFixed(0)} ms — p99 ${percentile(sorted, 99).toFixed(0)} ms`);
  console.log(`Référence : ${golden.length - misses.length}/${golden.length} dans le top 3`);
  for (const m of misses) console.log(`  ✗ ${m}`);
  if (p95 > P95_TARGET_MS || misses.length > 0) process.exitCode = 1;
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

- [ ] **Étape 2 : créer le fichier de référence avec les premières entrées.** Ces titres ont été vus dans LRCLIB lors de l'étude ; leur forme exacte après import est à vérifier à l'étape 3.

```yaml
# data/search-golden.yaml — au moins 50 entrées, sur les données réelles importées.
# expected_title est comparé, via la clé de consonnes, au titre arabe ou latin des 3 premiers résultats.
- { query: sidi mansour, expected_title: Sidi Mansour }
- { query: سيدي منصور, expected_title: Sidi Mansour }
- { query: sidi mansur, expected_title: Sidi Mansour }
- { query: انت عمري, expected_title: انت عمري }
- { query: enta 3omri, expected_title: انت عمري }
- { query: حبيتك بالصيف, expected_title: حبيتك بالصيف }
- { query: habaytak bel saif, expected_title: حبيتك بالصيف }
- { query: فات الميعاد, expected_title: فات الميعاد }
- { query: fat el mi3ad, expected_title: فات الميعاد }
- { query: ya lili, expected_title: Ya Lili }
```

- [ ] **Étape 3 : compléter le fichier jusqu'à au moins 50 entrées, à partir de la base importée.**

Dans `psql`, lister des candidats :

```sql
SELECT title_ar, title_latin FROM songs ORDER BY random() LIMIT 40;
```

Ajouter au moins **10 entrées dans chacune des 5 catégories** suivantes :
1. titre en arabe ;
2. titre en arabizi, avec variantes de voyelles (« mansur », « mansor ») ;
3. nom d'artiste, en arabe et en latin, en choisissant `expected_title` parmi ses chansons ;
4. 3 à 5 mots consécutifs tirés des paroles ;
5. une faute de frappe sur un titre (lettre doublée ou manquante).

Chaque entrée est choisie **avant** de lancer le benchmark, pour ne pas biaiser la mesure.

- [ ] **Étape 4 : lancer le benchmark et traiter le résultat.**

Lancer `pnpm bench:search --sample 1000`.

Attendu : un p95 inférieur ou égal à 300 ms et une précision de 100 % sur la référence (code de sortie 0). Sinon, dans cet ordre :
1. **Requête de référence ratée** : corriger `searchKeyMap.ts`, ajouter le cas aux tests de la tâche 3, puis relancer.
2. **p95 trop élevé** : lancer `EXPLAIN (ANALYZE, BUFFERS)` sur la requête la plus lente pour vérifier que les index GIN trigrammes sont utilisés. Ajuster `WORD_SIMILARITY_THRESHOLD` (entre 0,4 et 0,6) et relancer.
3. **Toujours au-dessus de l'objectif** : arrêter et signaler que Meilisearch doit être branché derrière `searchSongs`, conformément à la spec §6.3. Ce sera une tâche distincte, à planifier.

- [ ] **Étape 5 : documenter et faire le commit.** Ajouter cette section au `README.md` :

```markdown
## Benchmark de la recherche

`pnpm bench:search --sample 1000` mesure la latence (objectif : p95 ≤ 300 ms) et la précision sur
`data/search-golden.yaml`. À relancer après chaque import important ou chaque changement de `lib/search`.
```

```bash
git add scripts/bench-search.ts data/search-golden.yaml README.md
git commit -m "feat(search): benchmark script and real-data golden queries"
```

---

### Tâche 16 : CI, image Docker, sauvegarde nocturne et déploiement

**Fichiers :**
- Créer : `.github/workflows/ci.yml`, `.github/workflows/backup.yml`, `Dockerfile`, `.dockerignore`
- Modifier : `README.md`, pour ajouter les sections « Déploiement » et « Sauvegardes »

**Interfaces :**
- Consomme : tous les scripts de `package.json`.
- Produit :
  - une CI qui exécute lint, vérification des types, tests unitaires, d'intégration et de bout en bout à chaque push et pull request ;
  - une sauvegarde `pg_dump` envoyée chaque nuit vers un stockage objet compatible S3.

- [ ] **Étape 1 : écrire la CI.**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: ghanni
          POSTGRES_PASSWORD: ghanni
          POSTGRES_DB: ghanni_test
          LANG: en_US.utf8
        ports: ['5433:5432']
        options: >-
          --health-cmd "pg_isready -U ghanni"
          --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgres://ghanni:ghanni@localhost:5433/ghanni_test
      DATABASE_URL_TEST: postgres://ghanni:ghanni@localhost:5433/ghanni_test
      CI: 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm test:integration
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

- [ ] **Étape 2 : écrire l'image Docker, pour un futur hébergement sur un serveur dédié.**

```dockerfile
# Dockerfile
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```text
# .dockerignore
node_modules
.next
.env
test-results
playwright-report
*.sqlite3
```

Vérifier :

```bash
docker build -t ghanni . && docker run --rm -p 3000:3000 -e DATABASE_URL=postgres://ghanni:ghanni@host.docker.internal:5433/ghanni ghanni
```

Attendu : `http://localhost:3000` affiche l'accueil.

- [ ] **Étape 3 : écrire la sauvegarde nocturne.**

```yaml
# .github/workflows/backup.yml
name: Sauvegarde nocturne
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Installer le client PostgreSQL 17
        run: |
          sudo install -d /usr/share/postgresql-common/pgdg
          sudo curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
          echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
          sudo apt-get update && sudo apt-get install -y postgresql-client-17
      - name: Exporter la base
        env:
          DATABASE_URL: ${{ secrets.BACKUP_DATABASE_URL }}
        run: /usr/lib/postgresql/17/bin/pg_dump "$DATABASE_URL" --format=custom --no-owner --file="ghanni-$(date -u +%Y%m%dT%H%M%SZ).dump"
      - name: Envoyer vers le stockage objet
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.BACKUP_S3_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_S3_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ${{ secrets.BACKUP_S3_REGION }}
        run: aws s3 cp ghanni-*.dump "s3://${{ secrets.BACKUP_S3_BUCKET }}/" --endpoint-url "${{ secrets.BACKUP_S3_ENDPOINT }}"
```

Le client 17 sait exporter un serveur 16 ou 17 : `pg_dump` doit être d'une version supérieure ou égale à celle du serveur.

- [ ] **Étape 4 : documenter le déploiement et les sauvegardes.** Ajouter au `README.md` :

````markdown
## Déploiement (Vercel + Neon)

1. Neon : créer un projet PostgreSQL 17, dans une région européenne. Récupérer l'URL **directe**
   (pour les migrations et les imports) et l'URL **poolée** (pour l'application).
2. Vérifier que la locale prend en charge l'arabe : `SELECT show_trgm('سيدي');` doit renvoyer des trigrammes.
3. Migrer : `DATABASE_URL=<url directe> pnpm db:migrate`.
4. Importer en local vers Neon : `DATABASE_URL=<url directe> pnpm import:public-domain`, puis l'import
   LRCLIB (section « Import LRCLIB »).
5. Vercel : importer le dépôt, définir `DATABASE_URL=<url poolée>`, puis déployer.
6. Lancer `DATABASE_URL=<url directe> pnpm bench:search` sur la base de production.

## Sauvegardes

- Neon conserve l'historique et permet une restauration à un instant donné. De plus, `.github/workflows/backup.yml`
  envoie chaque nuit un `pg_dump` vers un stockage S3 compatible.
- Secrets GitHub à définir : `BACKUP_DATABASE_URL` (URL directe), `BACKUP_S3_BUCKET`, `BACKUP_S3_ENDPOINT`,
  `BACKUP_S3_REGION`, `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`.
- Restaurer : `pg_restore --clean --no-owner -d <url> ghanni-<date>.dump`.
- Tester une restauration sur une branche Neon jetable une fois par trimestre.
````

- [ ] **Étape 5 : vérifier la CI et faire le commit.**

```bash
git add .github Dockerfile .dockerignore README.md
git commit -m "chore(ops): CI pipeline, Docker image, nightly backup and deployment docs"
```

Pousser sur une branche et vérifier que le workflow CI est vert. Déclencher une fois `backup.yml` à la main (`workflow_dispatch`) quand les secrets sont définis.

---

## Couverture de la spec par ce plan

| Spec | Tâches |
|---|---|
| §4.1 Stack, §4.2 modules `lib/text`, `lib/search`, `lib/db`, `scripts/import` | 1 à 11 |
| §4.4 Pages `/`, `/recherche`, `/chanson/[id]`, `/artiste/[id]` | 12, 13 |
| §5 Modèle : `artists`, `songs`, `song_artists`, retrait doux | 5, 6, 8 |
| §6 Recherche : normalisation, clé, score, index, extrait, pagination | 2, 3, 5, 7 |
| §6.3 Benchmark p95 ≤ 300 ms | 15 |
| §11.1 Import LRCLIB, §11.2 domaine public | 10, 11 |
| §12 Validation des identifiants, texte brut, limite de recherche, page d'erreur, sauvegardes, CI, hébergement | 8, 9, 12, 13, 16 |
| §13 Tests unitaires, requêtes de référence, intégration, bout en bout, performance | toutes |
| Interface en français et en arabe, PWA installable | 12 |

**Hors de ce plan**, comme prévu dans les plans suivants :

| Sujet de la spec | Plan |
|---|---|
| §4.3 rôles et comptes, §10 clubs, playlists et lecteur | Plan 2 |
| §8 contributions, §9 signalements et retraits | Plan 3 |
| §7 translittération | Plan 4 |
