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

## Développement

`pnpm seed:demo` écrit dans la base locale des comptes de démonstration (Leïla, membre des Jasmins ; Sami, animateur de trois clubs ; Nour, sans club ; Rania, modératrice), leurs clubs et leurs playlists, ainsi que sept propositions (dont trois de Leïla) et quatre signalements. Il est idempotent : il recrée ces comptes et ces clubs sans toucher aux autres données.

- Se connecter : `/connexion`, saisir l'adresse (`sami@example.com`…), puis « Ouvrir le lien reçu ».
- Tester sur un téléphone du même Wi-Fi : régler `BETTER_AUTH_URL` sur l'adresse du poste (`http://192.168.x.y:3000`), sinon le lien du message pointe vers `localhost`.

## Tests

```bash
pnpm test
pnpm test:integration
pnpm typecheck && pnpm lint
```

`pnpm test:integration` migre puis utilise la base `ghanni_test`.

## Rôles

Un admin attribue les rôles en ligne de commande. La personne doit s'être connectée une fois, pour que son compte existe.

```bash
pnpm user:role sami@example.com --animator
pnpm user:role rania@example.com --role moderator --no-animator
```

`--animator` ou `--no-animator` change le rôle d'animateur ; `--role member|moderator|admin` change le rôle global. Seuls les champs donnés changent. En production : `DATABASE_URL=<url directe> pnpm user:role …`.

## Modération

- **Premier modérateur** : se connecter une fois, puis `pnpm user:role <adresse> --role moderator` (voir « Rôles »). Un admin (`--role admin`) approuve aussi ses propres propositions, pour amorcer la plateforme ; un modérateur ne le peut pas.
- **Propositions et signalements** : `/moderation` (propositions, de la plus ancienne à la plus récente) et `/moderation/signalements` (droits d'auteur en tête). Un retrait est doux : il se rétablit depuis la page du signalement qui l'a provoqué.
- **Limites** : 10 propositions par jour et par personne, 10 signalements par jour et par adresse IP (fenêtre du jour UTC, table `rate_limits`).
- **Retrait en masse** (admin, avec l'accès à la base) :

  `pnpm songs:remove --source lrclib|public_domain|contribution --reason "<motif>" [--artist <uuid>] [--dry-run] [--restore]`

  `--dry-run` compte sans rien changer ; `--restore` rétablit les chansons retirées en masse avec le même motif, pas celles retirées depuis un signalement. Un retrait protège la chanson des imports (`import_locked`), et un rétablissement laisse cette protection.
- **Comptes supprimés** : leurs propositions et leurs signalements restent, sans auteur (« un compte supprimé »).

## Translittération

- **Fonctionnement :** un membre connecté qui active l'affichage latin sur une chanson sans translittération en déclenche la génération. Un verrou en base (`translit_started_at`) garantit une seule génération par chanson ; une demande concurrente attend le résultat. Un plafond global par jour (UTC) limite le coût. Le texte est enregistré avec le statut `auto`, puis passe en `reviewed` après une révision approuvée. Un visiteur voit une translittération existante, mais reçoit une invitation à se connecter pour en obtenir une.
- **Variables :** `ANTHROPIC_API_KEY`, `TRANSLIT_PROVIDER` (`anthropic`, `fake` ou `none`), `TRANSLIT_MODEL` (par défaut `claude-opus-5-5`) et `TRANSLIT_DAILY_LIMIT` (par défaut 300), décrites dans `.env.example`. En production, `ANTHROPIC_API_KEY` est un secret à déclarer chez l'hébergeur.
- **Développement et tests :** sans clé et hors production, un générateur factice (table de lettres arabe vers latin, déterministe) remplace le modèle. `playwright.config.ts` fixe `TRANSLIT_PROVIDER=fake`. En production sans clé, la génération échoue proprement et le lecteur affiche l'arabe seul.
- **Essai manuel :** `pnpm translit:try <id>` génère la translittération d'une chanson de la base, en lecture seule (rien n'est écrit). Chaque lancement est facturé.
- **Coût :** environ 3 $ par jour au plafond de 300 générations, avec Opus 5.5.
- **Durée des fonctions :** une génération peut durer jusqu'à 30 s, et l'attente d'une génération en cours jusqu'à 35 s. Sur Vercel, la durée maximale des fonctions doit être d'au moins 60 s, ce qui est le cas par défaut avec Fluid Compute.

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

**Adresse du client.** Les limites par IP (recherche, liens de connexion, 10 signalements par jour) lisent `x-forwarded-for`, que le client peut envoyer lui-même. Derrière un proxy qui *ajoute* son adresse à l'en-tête (nginx avec `$proxy_add_x_forwarded_for`, Caddy, un répartiteur de charge), définir `TRUSTED_PROXY_HOPS` au nombre de proxies de confiance devant l'application (`1` pour un seul nginx) : l'adresse retenue est alors la N-ième depuis la droite. Une valeur qui n'est pas un entier (`one`, `1.0`) fait échouer les requêtes limitées avec un message explicite. Sans cette variable, l'application prend la première adresse, ce qui n'est sûr que derrière un proxy de bord qui réécrit l'en-tête, comme celui de Vercel. Ne jamais exposer l'image directement sans proxy : le client choisirait son adresse et contournerait les limites.

## Déploiement (Vercel + Neon)

1. Neon : créer un projet PostgreSQL 17, dans une région européenne. Récupérer l'URL **directe**
   (pour les migrations et les imports) et l'URL **poolée** (pour l'application).
2. Vérifier que la locale prend en charge l'arabe : `SELECT show_trgm('سيدي');` doit renvoyer des trigrammes.
3. Migrer : `DATABASE_URL=<url directe> pnpm db:migrate`.
4. Importer en local vers Neon : `DATABASE_URL=<url directe> pnpm import:public-domain`, puis l'import
   LRCLIB (section « Import LRCLIB »).
5. Vercel : importer le dépôt, définir `DATABASE_URL=<url poolée>` et `ANTHROPIC_API_KEY` (translittération, voir « Translittération »), puis déployer. Ne pas définir `TRUSTED_PROXY_HOPS` : le proxy de Vercel réécrit `x-forwarded-for`, sa première adresse est celle du client.
6. Lancer `DATABASE_URL=<url directe> pnpm bench:search` sur la base de production (script de la tâche 15 du plan 1).

### Comptes (plan 2)

Avant le premier déploiement avec des comptes :

1. **Secret** : `openssl rand -base64 32` donne `BETTER_AUTH_SECRET`, à définir dans Vercel. `BETTER_AUTH_URL` est l'adresse publique (`https://…`).
   - **Une seule adresse canonique** : `BETTER_AUTH_URL` est l'unique origine acceptée par Better Auth. Rediriger `www.` et l'alias `*.vercel.app` vers elle (réglage des domaines dans Vercel), ou les ajouter à `trustedOrigins` dans `src/lib/auth/auth.ts` ; sinon la connexion échoue depuis ces adresses.
   - **Une `BETTER_AUTH_URL` par environnement** : définir la variable séparément pour Production et pour Preview (adresse du déploiement de prévisualisation). Un déploiement de prévisualisation qui reprend celle de production envoie des liens de connexion qui mènent à la production.
2. **E-mails** : un fournisseur SMTP transactionnel (Resend, Brevo, Mailjet ou Postmark, tous en SMTP). Définir `SMTP_URL=smtps://utilisateur:motdepasse@smtp.fournisseur:465` et `MAIL_FROM="Ghnaya <connexion@domaine>"`. Vérifier le domaine d'envoi (SPF, DKIM) chez le fournisseur, sinon les liens arrivent en courrier indésirable. Ne jamais définir `MAIL_TRANSPORT` en production : la boîte locale `.outbox/` ouvrirait une session à quiconque. L'application refuse d'ailleurs `MAIL_TRANSPORT=outbox` en production quand `BETTER_AUTH_URL` n'est pas localhost (seul le build des tests de bout en bout l'utilise).
3. **Google** (facultatif) : dans Google Cloud Console, créer un identifiant OAuth « Application Web ». URI de redirection autorisée : `https://<domaine>/api/auth/callback/google`, plus `http://localhost:3000/api/auth/callback/google` pour le développement. Reporter `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.
4. **Premier admin** : se connecter une fois, puis `DATABASE_URL=<url directe> pnpm user:role <adresse> --role admin --animator`.
5. **Adresses en minuscules** (si la base contient déjà des comptes) : `pnpm user:role` compare l'adresse telle quelle, et Better Auth l'enregistre en minuscules. Vérifier que `select email from users where email <> lower(email);` ne renvoie rien.

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
