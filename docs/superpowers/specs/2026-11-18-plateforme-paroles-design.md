# Plateforme de paroles pour clubs de chant — Design

- **Date** : 2026-11-18
- **Nom de travail** : Ghanni (غنّي, « chante »). C'est un nom provisoire, que l'on peut changer sans impact technique.
- **Statut** : design validé section par section, en attente de relecture de ce document.

## 1. Contexte et objectifs

Les clubs de chant ont besoin de lire les paroles de chansons arabes et tunisiennes pendant leurs séances. Chaque membre les lit sur son propre téléphone. La plateforme web, utilisable sur mobile, doit permettre de :

1. **Chercher** une chanson par titre, par paroles ou par nom d'artiste. La recherche doit fonctionner en écriture arabe comme en arabizi, c'est-à-dire l'arabe écrit en lettres latines et en chiffres (3 = ع, 7 = ح…).
2. **Créer des playlists** personnelles et des playlists de club, puis les **lire en séance** dans un lecteur plein écran.
3. **Enrichir la base** : les utilisateurs proposent des chansons et des corrections, et chaque proposition est validée par un modérateur.
4. Démarrer avec une **base déjà riche**, grâce à l'import de LRCLIB et d'œuvres du domaine public.

**Critères de réussite du MVP**

- Une personne trouve une chanson connue en moins de trois frappes significatives, qu'elle tape « sidi mansour » ou « سيدي منصور ».
- Un animateur prépare une playlist de dix chansons pour son club en moins de cinq minutes, sur téléphone.
- Pendant la séance, le lecteur reste lisible et l'écran ne se met pas en veille.
- La recherche répond en moins de 300 ms dans 95 % des cas (p95), côté serveur, sur 200 000 chansons.

## 2. Décisions prises

| Sujet | Décision |
|---|---|
| Public | Plateforme publique avec comptes ouverts, et des espaces de club séparés qui partagent la même base de chansons |
| Usage en séance | Chacun lit sur son téléphone, sans synchronisation en temps réel |
| Contenu de départ | Import LRCLIB, domaine public et contributions. **Pas de scraping.** |
| Lecture | Fonctions de base, plus une translittération latine |
| Modération | Validation systématique : chaque ajout et chaque correction attend l'approbation d'un modérateur |
| Stack | Next.js (TypeScript) et PostgreSQL, avec la recherche faite dans PostgreSQL |
| Langues de l'interface | Français et arabe, avec bascule entre lecture de gauche à droite et de droite à gauche |

## 3. Périmètre

**Dans le MVP** :
- la recherche et les pages chanson et artiste ;
- le lecteur de séance avec translittération ;
- les comptes, les playlists personnelles, les clubs et les playlists de club ;
- les contributions et la file de modération ;
- les signalements et les retraits ;
- les scripts d'import LRCLIB et domaine public.

**Hors MVP, mais l'architecture ne l'empêche pas** :

| Fonction | Ce qui la rendra possible |
|---|---|
| Meilisearch | Il se branchera derrière l'interface `searchSongs` |
| Mode hors-ligne | Il viendra s'ajouter à la PWA actuelle, sans refonte |
| Accords | Il faudra un format de paroles enrichi, que l'on pourra introduire plus tard |
| Défilement automatique | L'identifiant LRCLIB est conservé, ce qui permettra de récupérer les paroles synchronisées (LRC) |
| Synchronisation animateur → membres en temps réel | Elle s'ajoutera par-dessus le lecteur existant |
| Application native | — |
| Playlists personnelles publiques ou partageables | — |

## 4. Architecture

### 4.1 Stack

- **Next.js** (dernière version stable, App Router, TypeScript strict). Il gère le front, les Server Actions et les routes d'API dans une seule application.
- **PostgreSQL 16 ou plus récent**, avec les extensions `pg_trgm` et `unaccent`. L'accès passe par **Drizzle ORM**, et les migrations sont versionnées.
- **Better Auth** : connexion par lien magique envoyé par e-mail, via un fournisseur SMTP transactionnel, et par Google OAuth. *(Modifié le 22/11/2026, plan 2 : Auth.js, d'abord prévu, est toujours en bêta pour sa version 5 (`5.0.0-beta.32`). Better Auth 1.7 est stable et couvre le lien magique, Google, les sessions en base et Drizzle.)*
- **next-intl** pour l'internationalisation en français et en arabe.
- **zod** pour valider toutes les entrées.
- **PWA** : un manifeste pour l'installer sur l'écran d'accueil, sans service worker de cache.

### 4.2 Modules

| Module | Rôle | Dépend de |
|---|---|---|
| `lib/text` | Fonctions pures : `normalizeArabic`, `normalizeLatin`, `toSearchKey`, `detectScript`, `cleanImportedTitle`, `splitArtists`, découpage en lignes | rien |
| `lib/search` | Interface unique `searchSongs(query, { artistId?, dialect?, page })` qui renvoie `{ items, total }`. L'implémentation actuelle est en SQL | `lib/text`, `lib/db` |
| `lib/db` | Schéma Drizzle, migrations, client | PostgreSQL |
| `lib/auth` | Configuration de Better Auth, plus `permissions.ts`, **le seul endroit** où l'on décide qui peut faire quoi | `lib/db` |
| `lib/moderation` | Création, approbation et rejet des révisions, application d'une révision à `songs`, traitement des signalements | `lib/db`, `lib/text` |
| `lib/translit` | Génération de la translittération par un modèle de langage, verrouillage, validation de l'alignement des lignes, plafond quotidien | `lib/db` |
| `app/` | Pages et Server Actions | tous |
| `scripts/import` | Imports LRCLIB et domaine public, lancés en ligne de commande | `lib/text`, `lib/db` |

**Règle** : les pages n'écrivent jamais de SQL. Elles passent par `lib/search`, `lib/moderation` ou des fonctions de requête nommées.

### 4.3 Rôles et permissions

| Rôle | Peut |
|---|---|
| Visiteur (sans compte) | Chercher, lire les chansons publiées, signaler une chanson (avec un e-mail de contact) |
| Membre (compte avec e-mail vérifié) | Tout ce que fait le visiteur, plus : gérer ses playlists personnelles, proposer des ajouts et des corrections, rejoindre **un** club, activer la translittération. Un membre appartient à **un seul club** : rejoindre un autre club lui fait quitter le premier, après confirmation |
| Animateur (rôle global attribué par un admin, puis rôle dans chaque club qu'il anime) | Créer des clubs et en animer **plusieurs** ; voir, modifier et choisir ses clubs ; gérer les playlists et les membres de ses clubs, régénérer le lien d'invitation, promouvoir un membre en animateur du club |
| Modérateur (rôle global, attribué par un admin) | Approuver et rejeter les révisions, traiter les signalements, retirer et rétablir une chanson. **Il ne peut pas approuver sa propre révision.** |
| Admin (rôle global) | Tout ce que fait le modérateur, plus : attribuer les rôles (modérateur, animateur) *(depuis le 22/11/2026, plan 2 : en ligne de commande, `pnpm user:role <adresse> [--animator\|--no-animator] [--role member\|moderator\|admin]`, sans page d'administration)*, approuver ses propres révisions (pour amorcer la plateforme), retirer en masse par source, lancer les imports |

### 4.4 Pages

| Route | Contenu |
|---|---|
| `/` | Barre de recherche mise en avant, accès à « Mes playlists » et aux playlists de son club (de ses clubs pour un animateur) |
| `/recherche?q=` | Résultats paginés par 20 : titre, artiste et, si la correspondance vient des paroles, la ligne trouvée en extrait |
| `/chanson/[id]` | Titre, artistes, dialecte, paroles, bascule de la translittération, source. Actions : ajouter à une playlist, proposer une correction, signaler |
| `/artiste/[id]` | Les chansons de l'artiste |
| `/playlists`, `/playlists/[id]` | Playlists personnelles : création, ajout, réordonnancement, notes |
| `/clubs`, `/clubs/[slug]`, `/rejoindre/[code]` | Pour un animateur : la liste de ses clubs, à choisir et à gérer. Pour un membre : directement son club. Playlists de club, page pour rejoindre un club |
| `/lecture/[playlistId]/[position]` | Lecteur plein écran |
| `/contribuer`, `/contribuer/[songId]`, `/mes-contributions` | Ajout d'une chanson, correction, suivi des propositions |
| `/moderation`, `/moderation/signalements` | File des révisions et file des signalements |
| `/signaler/[songId]` | Formulaire de signalement |

## 5. Modèle de données

Tous les identifiants sont des UUID. Toutes les tables ont `created_at` et `updated_at`.

```text
users(id, email unique, name, global_role: member|moderator|admin,
  is_animator boolean default false,          -- attribué par un admin : peut créer et animer des clubs
  locale: fr|ar, email_verified boolean default false,   -- remplace email_verified_at (modifié le 22/11/2026, plan 2)
  image text)                                            -- champ imposé par Better Auth (22/11/2026, plan 2)

sessions, accounts, verifications                 -- gérées par Better Auth (ajoutées le 22/11/2026, plan 2)

artists(id, name_ar, name_latin, aliases text[], search_ar, search_latin, search_key)

songs(
  id, title_ar, title_latin,
  lyrics text not null,                         -- arabe, texte brut, lignes vides entre les couplets
  lyrics_translit text null,                    -- aligné ligne à ligne sur lyrics
  translit_status: none|generating|auto|reviewed,
  dialect: tn|eg|lev|gulf|maghreb_other|msa|other,
  source: lrclib|public_domain|contribution,
  source_ref text null,                         -- identifiant LRCLIB, ou clé du fichier domaine public
  status: published|removed,
  removed_reason text null,
  search_ar, search_latin, search_key,          -- titre et artistes, normalisés
  lyrics_search_ar, lyrics_search_key,          -- paroles, normalisées
  unique(source, source_ref)
)

song_artists(song_id, artist_id, role: main|feat, position)

song_revisions(
  id, song_id null,                             -- null pour un nouvel ajout
  author_id, payload jsonb,                     -- version complète proposée (titre, artistes, paroles, translit, dialecte)
  rights_declared boolean not null,
  status: pending|approved|rejected,
  reviewer_id null, review_note null, reviewed_at null
)

reports(
  id, song_id, reporter_id null, contact_email null,
  reason: copyright|wrong_lyrics|duplicate|spam|other,
  details, status: open|resolved|dismissed, resolution_note, resolved_by null
)

clubs(id, name, slug unique, description, invite_code unique, created_by)
club_members(club_id, user_id, role: animator|member, primary key(club_id, user_id))

playlists(id, name, owner_user_id null, club_id null, created_by,
  check ((owner_user_id is null) <> (club_id is null)))
playlist_items(id, playlist_id, song_id, position, note text null, unique(playlist_id, position))
```

**Règles**

- **Retrait doux.** Une chanson retirée passe en `removed` sans être supprimée. Les playlists affichent alors « chanson retirée », et `/chanson/[id]` renvoie une page 410.
- **Colonnes de recherche.** Les colonnes `search_*` sont recalculées par `lib/text` à chaque écriture, que ce soit par import ou par l'approbation d'une révision. Elles ne sont jamais modifiées à la main.
- **Animateurs.** Un club garde toujours au moins un animateur. Le dernier animateur ne peut ni partir ni être rétrogradé.
- **Un seul club par membre** (rectification du 19/11/2026). Un utilisateur sans `is_animator` a au plus une ligne dans `club_members`. La règle est appliquée par `lib/clubs`, dans la transaction d'adhésion : rejoindre un club supprime l'adhésion précédente. Un animateur (`is_animator`) peut appartenir à plusieurs clubs.

## 6. Recherche

### 6.1 Normalisation (`lib/text`)

**`normalizeArabic`**
- supprime le tashkeel (U+064B à U+0652 et U+0670) et le tatweel (U+0640) ;
- unifie les variantes de lettres : أ, إ, آ et ٱ deviennent ا ; ى devient ي ; ة devient ه ; ؤ devient و ; ئ devient ي ; les lettres persanes ک et ی deviennent ك et ي ;
- convertit les chiffres arabo-indiens en chiffres ASCII ;
- supprime la ponctuation et réduit les espaces multiples.

**`normalizeLatin`** met en minuscules, retire les accents et la ponctuation, et réduit les espaces.

**`toSearchKey`** produit le **squelette de consonnes** commun aux deux écritures.
- **Côté arabe** : chaque consonne devient une classe canonique. Les lettres ا, و, ي, ى et ء sont retirées, qu'elles servent de voyelle ou de consonne. ع est retirée aussi, car les titres latins des plateformes l'omettent souvent : « Enta Omri », « Fat El Maad » (plan 1, tâche 15).
- **Côté latin, ou arabizi** :
  - les digrammes sont reconnus d'abord : `ch` et `sh` deviennent ش, `kh` devient خ, `gh` devient غ, `th` devient ث, `dh` devient ذ, `ou` est une voyelle ;
  - les chiffres prennent leur valeur de lettre : `5` = خ, `7` = ح, `8` = غ, `9` = ق ;
  - `g`, qui note le ق prononcé à la tunisienne, est rangé dans la classe ك/ق ;
  - les lettres a, e, i, o, u, w, y ainsi que les chiffres `2` (ء) et `3` (ع) sont retirés, par symétrie avec le côté arabe.
- **Dans les deux cas** :
  - les consonnes doublées sont réduites à une seule, puisque la shadda disparaît côté arabe ;
  - **les espaces sont supprimés**, car l'article et la conjonction sont collés en arabe mais séparés en arabizi : « والعذاب » s'écrit « wel 3azab ».
- **Exemples** :
  - « سيدي منصور » et « Sidi Mansour » donnent tous les deux `sdmnsr` ;
  - « ولا » et « wala » donnent tous les deux `l`.
- **Lettres proches.** Les lettres arabes proches à l'oreille partagent une même classe, pour tolérer les écritures approximatives : س/ص, ت/ط, د/ض, ذ/ظ/ز, ه/ح, ك/ق.
- **Limite connue.** L'assimilation de l'article n'est pas traitée par la clé : « ech-chams » s'écrit « الشمس ». La similarité par trigrammes absorbe ces écarts, et le corpus de tests les mesure.
- **Table de référence.** Le tableau de correspondance complet est un objet unique dans `lib/text/searchKeyMap.ts`, couvert par des tests.

### 6.2 Requête

1. `detectScript(q)` renvoie `arabic`, `latin` ou `mixed`. On calcule alors `qAr`, `qLat` et `qKey`.
2. Une seule requête SQL attribue un score à chaque chanson publiée :
   - **titre ou artiste qui commence par la requête** : poids 10 en texte exact (`search_ar` ou `search_latin`), 5 par la clé seule (`search_key`), car deux noms différents peuvent partager une clé (« Saber Rebai » et « Saber Ayoub » donnent `sbrb`). Une clé de 2 consonnes ne sert que si elle est celle d'un titre ou d'un nom entier (« nasaya » et « Nassaya » donnent `ns`) ;
   - **similarité par trigrammes** (`word_similarity()`) sur `search_ar`, `search_latin` et `search_key` : poids 6. Celle de `search_key` est multipliée par 0,8 : la clé n'a qu'une quinzaine de symboles et pas d'espaces, donc ses trigrammes prouvent moins ;
   - **passage trouvé dans les paroles** (`lyrics_search_ar LIKE`, ou `lyrics_search_key LIKE` pour une requête en latin à partir de 4 consonnes) : poids 3. Par la clé, le passage ne rapporte des points qu'à partir de 6 consonnes : une suite plus courte se trouve par hasard, à cheval sur deux mots, dans les paroles d'une chanson sur dix.
   - **tous les mots de la requête dans les paroles** : une requête arabe d'au moins 2 mots de 3 lettres ou plus trouve aussi les paroles qui ont chacun de ces mots (`lyrics_search_ar LIKE`), sans points. Les versions chantées reprennent et intercalent des mots : « تفيد بإيه يا ندم » n'est pas en entier dans « تفيد بإيه، إيه، إيه يا ندم » (plan 1, tâche 15). Avec des points, ces chansons passeraient devant celle qui a la phrase exacte, grâce à leur similarité de titre. La recherche approximative des paroles par `word_similarity()` trouverait aussi ces versions, mais elle prend de 0,8 à 3,5 s sur 48 000 chansons.
   - Ces valeurs sont réunies dans `SCORE` (`lib/search/query.ts`) et mesurées par le benchmark (§6.3).
3. Les résultats sont triés par score décroissant, puis par titre. Les filtres optionnels portent sur l'artiste et le dialecte. Les pages font 20 résultats.
4. **Extrait** : si le score vient des paroles, on renvoie la première ligne qui a le passage cherché, ou à défaut la ligne qui a le plus de mots de la requête. Comme la requête SQL, l'extrait ne cherche la clé dans les paroles que pour une requête en latin.
5. **Requêtes vides ou trop courtes.** Une requête de moins de 2 caractères significatifs ne lance pas de recherche, et l'interface invite à taper davantage.

### 6.3 Index et performance

- **Index** : des index GIN `gin_trgm_ops` sur `search_ar`, `search_latin`, `search_key`, `lyrics_search_ar` et `lyrics_search_key`.
- **Seuil de similarité** : `pg_trgm.similarity_threshold` est réglé par requête, à 0,3 par défaut, et ajusté après le benchmark.
- **Benchmark** (`scripts/bench-search`) :
  - il rejoue les requêtes de référence et un échantillon de 1 000 requêtes réalistes sur la base importée ;
  - l'objectif est un p95 inférieur à 300 ms ;
  - **s'il n'est pas atteint, on implémente Meilisearch derrière `searchSongs`**, sans modifier les appelants.

## 7. Translittération

- **Déclenchement** : la translittération est générée à la demande, quand un membre connecté active l'affichage latin sur une chanson dont `translit_status` vaut `none`. Un visiteur sans compte voit une translittération déjà existante, mais ne peut pas en déclencher la génération.
- **Déroulement** :
  1. Le statut passe à `generating`, sous un verrou en base, pour qu'il n'y ait qu'une seule génération par chanson.
  2. Un modèle de langage génère la translittération. Le modèle sera choisi à l'implémentation, d'après la documentation à jour du fournisseur.
  3. Le texte est enregistré avec le statut `auto`.
  4. En cas d'échec ou de dépassement du délai, fixé à 30 s, le statut revient à `none`.
- **Prompt** : il précise le dialecte de la chanson et suit des conventions d'arabizi tunisien lisibles (3, 7, 9, ch, kh, gh). **Il impose une ligne latine par ligne arabe.**
- **Validation de l'alignement** : le nombre de lignes produites doit être égal à celui des paroles. Sinon, on réessaie une fois, puis on abandonne et le statut revient à `none`.
- **Coût maîtrisé** : un plafond global de générations par jour, configurable, est fixé à 300 par défaut. Au-delà, l'interface affiche « translittération indisponible aujourd'hui ».
- **Affichage** :
  - une translittération en `auto` porte la mention « automatique, peut contenir des erreurs » ;
  - les corrections passent par une révision, avec la même validation que le reste ;
  - une fois approuvée, la translittération passe en `reviewed`.
- **Saisie directe** : un contributeur peut fournir lui-même la translittération dans une révision. Une fois approuvée, elle est directement en `reviewed`.
- **Tolérance aux pannes** : si le service est indisponible, le lecteur affiche l'arabe seul avec un message. La lecture n'est jamais bloquée.

## 8. Contributions et modération

1. **Formulaire** de `/contribuer` :
   - le titre arabe et/ou latin, l'un des deux au moins étant obligatoire ;
   - les artistes, avec autocomplétion sur `artists` ou création d'un nouvel artiste ;
   - le dialecte ;
   - les paroles, dans une zone de texte en `dir="rtl"`, obligatoires, entre 20 et 20 000 caractères ;
   - la translittération, facultative ;
   - la case « Ce contenu est dans le domaine public ou j'ai le droit de le partager », obligatoire.
2. **Détection des doublons** : avant l'envoi, `searchSongs` est lancé sur le titre et l'artiste, et les trois meilleurs résultats sont proposés sous l'en-tête « existe peut-être déjà ». Le contributeur peut confirmer et envoyer quand même.
3. **Envoi** : une ligne `song_revisions` est créée en `pending`.
   - Pour une correction (`/contribuer/[songId]`), le formulaire est pré-rempli et la révision porte le `song_id`.
   - Une seule révision `pending` est autorisée par auteur et par chanson.
4. **File de modération** (`/moderation`) :
   - les révisions sont traitées de la plus ancienne à la plus récente ;
   - pour une correction, le modérateur voit un diff ligne par ligne des paroles, plus les champs modifiés ;
   - il **approuve**, ou il **rejette** avec une note obligatoire.
5. **Approbation**, en une seule transaction :
   - une révision d'ajout crée la chanson (`source = contribution`) ;
   - une révision de correction met à jour la chanson ;
   - dans les deux cas, les colonnes de recherche sont recalculées ;
   - si les paroles ont changé sans qu'une nouvelle translittération soit fournie, `lyrics_translit` est remise à vide et `translit_status` à `none`.
6. **Suivi** : le contributeur voit le statut et la note du modérateur dans `/mes-contributions`. Il n'y a pas de notification par e-mail dans le MVP.
7. **Anti-spam** : un e-mail vérifié est obligatoire, avec 10 révisions par jour au maximum par utilisateur.

## 9. Signalements et retraits

- **Qui peut signaler** : le formulaire `/signaler/[songId]` est ouvert à tous. Sans compte, l'e-mail de contact est obligatoire. La limite est de 10 signalements par jour et par IP.
- **File** : `/moderation/signalements` place les signalements pour droits d'auteur (`copyright`) en tête.
- **Traitement** : le modérateur peut :
  - retirer la chanson (`status = removed`, avec le motif) ;
  - corriger la chanson ;
  - classer le signalement sans suite.
- **Retrait en masse** : un admin peut retirer d'un coup toutes les chansons d'une `source` donnée, au besoin filtrées par artiste.
- **Réversibilité** : un retrait est annulable par un modérateur, puisque c'est un retrait doux.
- **Page publique** : `/a-propos/droits` décrit la procédure de retrait.

## 10. Clubs, playlists et lecteur

- **Création d'un club** : réservée aux animateurs (`is_animator`, attribué par un admin). Le créateur devient animateur du club, et un `invite_code` aléatoire de 10 caractères est généré.
- **Invitation** : le lien `/rejoindre/[code]` s'ouvre, puis, une fois l'utilisateur connecté, il devient membre. Régénérer le code rend l'ancien lien invalide.
  - **Membre déjà dans un club** : la page lui demande de confirmer le changement (« Vous faites partie de A. Rejoindre B vous fera quitter A. »). S'il confirme, il quitte A et rejoint B ; ses copies personnelles des playlists de A sont conservées. S'il est le dernier animateur de A, il doit d'abord en désigner un autre.
  - **Animateur** : il rejoint B en plus de ses autres clubs.
- **Choix du club** : un animateur voit la liste de ses clubs sur `/clubs` et choisit celui qu'il gère. Un membre n'a pas de liste : `/clubs` ouvre directement son club.
- **Visibilité** : un club est **privé**, et seuls ses membres voient ses playlists.
- **Suppression d'un club** : un animateur peut supprimer le club, après une confirmation où il retape le nom du club. Ses playlists de club sont alors supprimées, mais les copies personnelles faites par les membres sont conservées.
- **Droits sur les playlists** :
  - **Playlists de club** : les animateurs créent, renomment et suppriment, ajoutent et retirent des chansons, réordonnent avec des boutons ↑ et ↓ sur mobile, et annotent avec `note`.
  - **Membres** : ils lisent les playlists de club et peuvent les **copier** dans leurs playlists personnelles.
- **Playlists personnelles** : elles sont privées dans le MVP.
- **Lecteur** (`/lecture/[playlistId]/[position]`) :
  - affichage en plein écran ;
  - un en-tête discret donne le titre et la position (« 3 / 12 ») ;
  - la note de l'animateur s'affiche en haut ;
  - **navigation** : balayage gauche et droite, ou boutons précédent et suivant ;
  - **police** : boutons A− et A+, sur 6 tailles ;
  - **mode sombre** ;
  - **affichage** : arabe seul, arabe + latin entrelacés ligne par ligne, ou latin seul ;
  - **écran allumé** grâce à l'API Wake Lock, si le navigateur la prend en charge. Sinon, l'interface affiche une astuce pour désactiver la mise en veille.
- **Préférences du lecteur** : taille, mode et affichage sont stockés en `localStorage`, en tolérant son absence.

## 11. Import

Les scripts sont lancés par un admin avec `pnpm import:lrclib` et `pnpm import:public-domain`. Ils sont **idempotents** : ils mettent à jour une chanson existante (upsert) sur `(source, source_ref)` au lieu de la dupliquer. Ils ont un mode `--dry-run`, qui produit un rapport sans rien écrire.

Les chansons importées sont publiées directement, sans passer par la file de modération : lancer l'import vaut validation par l'admin.

### 11.1 LRCLIB

1. On télécharge l'export SQLite officiel (lrclib.net/db-dumps). Il est volumineux, donc on le traite **en local**, jamais sur le serveur de production.
2. **Filtre** : on écarte les morceaux `instrumental`. On garde ceux dont `plain_lyrics` contient au moins 50 % de lettres arabes parmi l'ensemble des lettres.
3. **Nettoyage** (`cleanImportedTitle`) : on retire les suffixes vidéo et qualité (« (Official Music Video) », « Lyrics », « HD »…), les numéros de piste en tête (« 02. ») et le nom d'artiste répété en préfixe (« Fairuz - … »).
4. **Artistes** :
   - `splitArtists` découpe sur `feat.`, `ft.`, `featuring`, `,` et `&` ;
   - ils sont fusionnés via `scripts/import/artist-aliases.yaml`, un fichier tenu à la main pour les grands noms, qui associe chaque variante à son artiste canonique.
5. **Dédoublonnage** : la clé est `(search_key de l'artiste principal, search_key du titre nettoyé)`. On garde la version aux paroles les plus longues, puis celle à l'identifiant LRCLIB le plus petit en cas d'égalité.
6. **Insertion** : `source = lrclib`, `source_ref` reçoit l'identifiant LRCLIB et `dialect = other`, ce que les modérateurs pourront corriger. La fiche chanson affiche « Source : LRCLIB ».
7. **Rapport** : chansons lues, filtrées, nettoyées, fusionnées et insérées, plus le volume estimé en base.
   - **Avant le premier import réel**, un `--dry-run` mesure ce volume, ce qui permet de dimensionner la base.

### 11.2 Domaine public

- **Fichiers** : `data/public-domain/*.yaml`, préparés à la main. Chacun contient : titre, artistes, auteur des paroles, `author_death_year` ou `traditional: true`, dialecte, paroles et, si possible, une translittération relue.
- **Vérification de la durée des droits** : le script vérifie que `traditional` vaut vrai, ou que `author_death_year` est inférieur ou égal à l'année en cours moins 51. C'est la règle tunisienne : 50 ans à compter du 1er janvier qui suit le décès. Le script refuse le fichier sinon.

## 12. Erreurs, sécurité et exploitation

- **Entrées** : toutes les Server Actions et routes valident leurs entrées avec zod, et une entrée invalide reçoit une erreur lisible dans la langue de l'interface.
- **Permissions** : elles sont vérifiées par `lib/auth/permissions`, avec des tests dédiés. Les pages ne cachent pas les actions « par sécurité » : c'est le serveur qui refuse.
- **XSS** : les paroles et les notes sont toujours rendues en texte brut, jamais en HTML.
- **Limites de requêtes** :
  - recherche : 60 requêtes par minute et par IP ;
  - révisions : 10 par jour et par utilisateur ;
  - signalements : 10 par jour et par IP ;
  - translittération : plafond global quotidien.
- **Erreurs** : une page d'erreur générique est prévue, et les exceptions serveur sont journalisées avec un identifiant de corrélation.
- **Suppression de compte** : un utilisateur peut supprimer son compte. Ses playlists personnelles et ses adhésions aux clubs sont alors supprimées. Ses révisions sont conservées, mais elles sont anonymisées : `author_id` pointe vers un utilisateur système « compte supprimé ». S'il était le dernier animateur d'un club, il doit d'abord désigner un autre animateur ou supprimer le club.
- **Hébergement retenu** : l'application est hébergée sur **Vercel**, et PostgreSQL est managé chez **Neon**, qui prend en charge `pg_trgm`, les sauvegardes et la restauration à un instant donné. C'est l'option qui demande le moins de maintenance. L'application reste portable, avec un Dockerfile fourni pour un futur passage sur un serveur dédié.
- **Sauvegardes** : en plus de celles de Neon, une GitHub Action fait chaque nuit un `pg_dump` vers un stockage objet.
- **CI** (GitHub Actions) : lint, vérification des types, tests unitaires, tests d'intégration sur un PostgreSQL de service, et tests de bout en bout Playwright à chaque pull request.

## 13. Tests

| Niveau | Outil | Ce qui est couvert |
|---|---|---|
| Unitaire | Vitest | `lib/text` : normalisation, `toSearchKey` sur un corpus d'au moins 100 paires réelles arabe ↔ arabizi tirées de l'import, `cleanImportedTitle`, `splitArtists`, alignement des lignes de translittération |
| Qualité de recherche | Vitest et PostgreSQL de test | Un fichier `search-golden.yaml` d'au moins 50 requêtes (arabe, arabizi, fautes de frappe, extraits de paroles), chacune avec la chanson attendue dans les 3 premiers résultats |
| Intégration | Vitest et PostgreSQL de test | Cycle de vie d'une révision, application en transaction, retrait doux, contrainte de propriété des playlists, dernier animateur, matrice des permissions |
| Bout en bout | Playwright, écran mobile | (a) rechercher, ajouter à une playlist de club, ouvrir le lecteur et naviguer ; (b) contribuer, valider en modérateur, retrouver la chanson ; (c) rejoindre un club par son lien |
| Performance | `scripts/bench-search` | p95 inférieur à 300 ms sur la base importée (§6.3) |

Le service de translittération est simulé dans les tests, sauf pour un test manuel documenté.

## 14. Risques et parades

| Risque | Parade |
|---|---|
| **Droits d'auteur** sur les paroles importées ou proposées | Sources affichées, procédure de retrait publique, retrait doux et en masse par source, déclaration du contributeur, pas de scraping. **Ce design n'est pas un avis juridique : il faut consulter un juriste avant l'ouverture publique.** |
| **Qualité des données LRCLIB** (doublons, titres sales, artistes mal orthographiés) | Nettoyage, fichier d'alias, dédoublonnage, corrections par les contributeurs |
| **Goulot d'étranglement à la modération**, puisque tout passe par validation | File triée de la plus ancienne à la plus récente, diff lisible, plusieurs modérateurs. La file est mesurée, et un passage à la confiance progressive reste possible plus tard sans changer le modèle de données |
| **Coût et qualité de la translittération automatique** | Génération à la demande, plafond quotidien, étiquette « automatique », correction par révision |
| **Recherche trop lente** sur le volume réel | Benchmark au premier import, puis passage à Meilisearch derrière `searchSongs` si nécessaire |
