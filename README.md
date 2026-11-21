# Ghnaya (غناية)

Paroles de chansons arabes et tunisiennes pour les clubs de chant : recherche en arabe et en arabizi, playlists de séance et lecteur plein écran.

- Spec : `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md`
- Plan du back-end en cours : `docs/superpowers/plans/2026-11-18-plan-1-catalogue-recherche.md`
- Design et tâches d'interface : `.design/ghnaya/`

## Démarrer

Il faut Node 22, pnpm et PostgreSQL 16 sur le port 5433, avec le rôle `ghanni` (mot de passe `ghanni`) et les bases `ghanni` et `ghanni_test` en UTF-8. Avec Docker, `docker compose up -d db` fournit tout cela. Sur macOS sans Docker, `brew install postgresql@16`, puis `port = 5433` dans `postgresql.conf`.

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm seed:fixtures
pnpm dev
```

`pnpm seed:fixtures` vide la base locale et y écrit le catalogue fictif (`src/mocks/catalog.ts`). Il refuse toute base hors de localhost.

## Tests

```bash
pnpm test
pnpm test:integration
pnpm typecheck && pnpm lint
```

`pnpm test:integration` migre puis utilise la base `ghanni_test`.
