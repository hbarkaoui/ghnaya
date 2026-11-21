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

## Import LRCLIB

1. Télécharger le dernier export depuis https://lrclib.net/db-dumps, puis le décompresser s'il est compressé (`gunzip lrclib-db-dump-*.sqlite3.gz`). Le fichier fait plusieurs dizaines de Go : le traitement se fait en local, jamais sur le serveur.
2. Lancer un dry-run, qui mesure le volume et dimensionne la base :
   `NODE_OPTIONS=--max-old-space-size=8192 pnpm import:lrclib --dump ./lrclib.sqlite3 --dry-run`
3. Lire le rapport (`not_arabic`, `merged`, `estimatedMB`), puis compléter `scripts/import/artist-aliases.yaml` avec les variantes d'artistes repérées.
4. Lancer l'import réel, avec `DATABASE_URL` pointant vers la base cible :
   `NODE_OPTIONS=--max-old-space-size=8192 pnpm import:lrclib --dump ./lrclib.sqlite3`

L'import ne garde que les paroles dont au moins la moitié des lettres sont arabes. Il écarte le persan et l'ourdou, qui s'écrivent avec le même alphabet : leurs claviers tapent ی et ک au lieu de ي et ك, et ces langues ont des lettres propres (پ, ژ, ے…). Il ne modifie jamais une chanson verrouillée, ni le statut d'aucune chanson. Relancé, il met à jour les mêmes chansons.

## Benchmark de la recherche

`pnpm bench:search --sample 1000` mesure la latence (objectif : p95 ≤ 300 ms) et la précision sur
`data/search-golden.yaml`. À relancer après chaque import important ou chaque changement de `lib/search`.
Il sort en échec (code 1) si le p95 dépasse l'objectif ou si une requête de référence n'a pas son titre
(ou son artiste) dans les 3 premiers résultats. Les requêtes de référence visent les données réelles : sur
le catalogue fictif, celles dont la chanson n'y figure pas échouent.

Après un changement de `lib/text` (table des consonnes, normalisation), les colonnes de recherche déjà
écrites sont périmées. `pnpm reindex:search` les recalcule, avec la clé de dédoublonnage, sans relancer
d'import (moins de 4 minutes pour 81 000 chansons en local). Il signale, sans les toucher, les chansons qui
prendraient la clé de dédoublonnage d'une autre : ce sont en général des doublons, à fusionner à la main.
Lancer ensuite `VACUUM ANALYZE songs` : la réécriture de toutes les lignes encombre les index GIN.

## Intégration continue

`.github/workflows/ci.yml` lance, à chaque push et pull request, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration` et `pnpm test:e2e` contre un PostgreSQL 16 de service, puis construit l'image Docker et vérifie qu'elle sert l'accueil.

## Image Docker

Pour un futur hébergement sur un serveur dédié. Le `Dockerfile` s'appuie sur `output: "standalone"` (`next.config.ts`) : l'image ne contient que `server.js` et les modules tracés par Next.

```bash
docker build -t ghanni .
docker run --rm -p 3000:3000 -e DATABASE_URL=postgres://ghanni:ghanni@host.docker.internal:5433/ghanni ghanni
```

Les migrations et les imports ne sont pas dans l'image : ils se lancent depuis un poste, avec `DATABASE_URL` pointant vers la base cible.

## Déploiement (Vercel + Neon)

1. Neon : créer un projet PostgreSQL 17, dans une région européenne. Récupérer l'URL **directe**
   (pour les migrations et les imports) et l'URL **poolée** (pour l'application).
2. Vérifier que la locale prend en charge l'arabe : `SELECT show_trgm('سيدي');` doit renvoyer des trigrammes.
3. Migrer : `DATABASE_URL=<url directe> pnpm db:migrate`.
4. Importer en local vers Neon : `DATABASE_URL=<url directe> pnpm import:public-domain`, puis l'import
   LRCLIB (section « Import LRCLIB »).
5. Vercel : importer le dépôt, définir `DATABASE_URL=<url poolée>`, puis déployer.
6. Lancer `DATABASE_URL=<url directe> pnpm bench:search` sur la base de production (script de la tâche 15 du plan 1).

## Sauvegardes

- Neon conserve l'historique et permet une restauration à un instant donné. De plus, `.github/workflows/backup.yml`
  envoie chaque nuit (2 h UTC) un `pg_dump` vers un stockage S3 compatible. La durée de conservation se règle
  par une règle de cycle de vie sur le bucket.
- Secrets GitHub à définir : `BACKUP_DATABASE_URL` (URL directe), `BACKUP_S3_BUCKET`, `BACKUP_S3_ENDPOINT`,
  `BACKUP_S3_REGION`, `BACKUP_S3_ACCESS_KEY_ID`, `BACKUP_S3_SECRET_ACCESS_KEY`. Tant qu'il en manque un, le
  workflow échoue dès sa première étape et les nomme.
- Lancer la sauvegarde à la main une fois les secrets définis : onglet Actions, « Sauvegarde nocturne »,
  « Run workflow ». GitHub suspend les workflows planifiés d'un dépôt public après 60 jours sans activité.
- Restaurer : `pg_restore --clean --no-owner -d <url> ghanni-<date>.dump`, avec un `pg_restore` 17 ou plus récent
  (celui de `postgresql@16` ne lit pas les sauvegardes du client 17 ; `brew install libpq` fournit le client récent).
- Tester une restauration sur une branche Neon jetable une fois par trimestre.
