# Design Brief : Ghnaya (غناية) — l'application

> Sources :
> - la spec produit `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md` ;
> - le plan 1 `docs/superpowers/plans/2026-11-18-plan-1-catalogue-recherche.md` ;
> - la direction visuelle A, « Jasmin et zellige » ;
> - les décisions de la phase grill-me du 18/11/2026.
>
> Ce brief couvre toute l'interface du MVP, et pas seulement le plan 1.

## Problème

Une séance de club de chant commence souvent dans le désordre :
- les paroles circulent en photocopies, en captures d'écran et en messages WhatsApp ;
- chacun cherche « Sidi Mansour » sur des sites saturés de publicité, en tapant le titre en lettres latines alors que le site l'attend en arabe ;
- l'animateur dicte la liste des chansons à voix haute ;
- dans une salle peu éclairée, on plisse les yeux devant un écran blanc ;
- on perd sa ligne au moment de tourner la page.

Le plaisir de chanter ensemble passe après la logistique.

## Solution

En arrivant à la séance, le membre ouvre Ghnaya. La playlist préparée par l'animateur l'attend sur l'accueil : un toucher sur « Lire », et les paroles s'affichent en grand, en blanc jasmin sur fond indigo nuit, sans rien autour. Il passe d'une chanson à la suivante d'un glissement du doigt, et l'écran ne se met pas en veille. S'il ne lit pas l'arabe, il active une fois la translittération latine, et elle reste active.

Avant la séance, l'animateur prépare la playlist depuis son téléphone. Il trouve chaque chanson qu'il l'écrive en arabe ou en arabizi, l'ajoute, la place dans l'ordre et y laisse une note (« tonalité Ré », « seulement le 2e couplet »).

Quand une chanson manque, n'importe quel membre la propose. Un modérateur la relit, et elle rejoint la base de tous.

## Principes d'expérience

1. **La lecture avant tout, plutôt que la densité.** En séance, rien ne concurrence les paroles :
   - grande taille (28 px par défaut) ;
   - fond sombre ;
   - contrôles discrets ;
   - jamais de motif ni d'élément décoratif derrière le texte.

   Quand un choix oppose « plus d'informations » et « plus lisible », c'est la lisibilité qui gagne.
2. **Un geste pour chanter, plutôt qu'explorer.** Le parcours le plus fréquent (ouvrir la playlist de la séance) tient en un seul toucher depuis l'accueil. La recherche pardonne les écritures approximatives : arabe, arabizi, voyelles variables. On ne demande jamais à l'utilisateur de savoir comment « la base » écrit un titre.
3. **Le patrimoine par touches, plutôt que l'ornement.** L'identité tunisienne passe par :
   - la palette ;
   - la typographie coufique des titres ;
   - le logo ;
   - quelques moments choisis : démarrage, états vides, couvertures de club, losange safran.

   Elle n'est jamais un décor posé sur le contenu.

## Direction esthétique

- **Philosophie** : « médina contemporaine ». Une interface moderne, sobre et aérée, rehaussée de touches patrimoniales précises : zellige, calligraphie coufique, couleurs de Sidi Bou Saïd.
- **Ton** : chaleureux et posé. On accueille comme lors d'une soirée entre amis, et on reste élégant et calme pour lire et chanter.
- **Références** :
  - l'affichage des paroles d'Apple Music : grandes paroles en plein écran, rien d'autre ;
  - le confort de lecture d'une liseuse Kindle : mode nuit, taille réglable, aucune distraction ;
  - les intérieurs de médina tunisienne : zellige, bois, lumière douce.
- **Anti-références** :
  - le karaoké criard (néons, paillettes, scores) ;
  - les sites de paroles saturés de publicité ;
  - le folklore touristique « carte postale » ;
  - les apps de streaming : on ne vend pas de musique, on aide à chanter.

### Identité retenue

- **Nom** : Ghnaya · غناية, qui veut dire « chanson » en dialecte tunisien.
- **Logo** : la piste 3, « Bulle zellige ».
  - Une étoile à 8 branches (khatam) dont une pointe s'allonge en queue de bulle.
  - À l'intérieur, trois lignes alignées à droite, comme des paroles en arabe, dont la dernière est safran.
  - Le logo existe en plusieurs déclinaisons : symbole, logo avec le nom « غناية / Ghnaya » en Reem Kufi, icône d'app, et favicon simplifié à deux lignes.
- **Palette** :

| Couleur | Code | Rôle |
|---|---|---|
| Indigo nuit | `#1B2550` | fond sombre, texte principal sur fond clair |
| Bleu Sidi Bou Saïd | `#1F6FB2` | actions, liens |
| Safran | `#D9A441` | accent, uniquement sur fond sombre |
| Safran foncé | `#B07A1F` | éléments graphiques sur fond clair, jamais en texte |
| Blanc jasmin | `#FBF8F1` | fond clair, texte sur fond sombre |

- **Typographies** :
  - Reem Kufi, réservée au logo et aux grands titres ;
  - IBM Plex Sans Arabic, chargée avec son alphabet latin (celui d'IBM Plex Sans), pour l'interface ; IBM Plex Sans seule pour la ligne de translittération ;
  - Noto Naskh Arabic, pour les paroles.

### Ton des textes

- **Français** : on vouvoie l'utilisateur. Les boutons commencent par un verbe (« Lire », « Ajouter à une playlist »). Pas de point d'exclamation dans les messages système.
- **Arabe** : arabe standard simple, avec des touches de dialecte tunisien aux moments chaleureux. Exemples : « يعيشك » pour remercier après une contribution, un accueil chaleureux sur l'écran d'ouverture.
- **Paroles dans les maquettes** : jamais de paroles protégées. On utilise des titres et noms d'artistes réels, des vers du domaine public (Chebbi) et des lignes inventées.

## Existant

Aucun code n'existe encore. Le plan 1 fixe la stack et les premiers composants, que ce brief doit respecter et étendre :

- **Stack** : Next.js (App Router), Tailwind CSS, next-intl (français et arabe, `<html dir>` selon la langue), rendu côté serveur.
- **Typographie** : aucune police n'est chargée pour l'instant. Les trois familles ci-dessus seront chargées via Google Fonts.
- **Couleurs** : aucune variable n'est définie. Les tokens viendront en phase 4.
- **Espacements** : aucune échelle n'est définie. Elle viendra aussi en phase 4.
- **Composants prévus au plan 1** : `SearchBar`, `SongResultItem`, `ArtistNames`, `LyricsView`, `LocaleSwitcher`, les pages accueil, recherche, chanson, artiste et une page d'erreur. Ils sont pour l'instant stylés sans charte et seront restylés.

## Inventaire des composants

| Composant | Statut | Notes |
|---|---|---|
| Logo (symbole, logo avec le nom, icône d'app, favicon) | Nouveau | Bulle zellige ; versions claire et sombre ; favicon simplifié |
| Coque de l'application (en-tête, navigation) | À modifier (plan 1) | Navigation principale mobile à définir en phase 3 |
| `LocaleSwitcher` | À modifier (plan 1) | Bascule FR/AR qui retourne immédiatement toute l'interface |
| `SearchBar` | À modifier (plan 1) | Champ large, écriture auto-détectée (`dir="auto"`), placeholder bilingue |
| `SongResultItem` | À modifier (plan 1) | Titre arabe et latin, artistes, extrait des paroles avec le passage trouvé surligné |
| En-tête de chanson | À modifier (plan 1) | Titres, artistes avec liens, pastille de dialecte, source |
| `LyricsView` | À modifier (plan 1) | Noto Naskh en 28 px, interligne 1,9, couplets espacés, toujours `dir="rtl" lang="ar"` |
| Lecteur de séance | Nouveau | Plein écran, sombre par défaut, position « 3 / 12 », note de l'animateur, navigation par glissement et par boutons |
| Barre de contrôles du lecteur | Nouveau | A− / A+ (6 crans, de 22 à 40 px), mode d'affichage, thème, précédent et suivant ; boutons de 48 px minimum |
| Bascule de translittération | Nouveau | Arabe seul / arabe + latin / latin seul ; état « génération en cours » ; mention « automatique, peut contenir des erreurs » |
| Carte « Vos séances » | Nouveau | Couverture du club, nom de la playlist, nombre de chansons, bouton « Lire » |
| Couverture de club | Nouveau | Motif zellige généré de façon déterministe à partir du nom du club |
| Ligne de playlist (en édition) | Nouveau | Position, titre, boutons ↑ / ↓, note libre, retrait |
| Feuille « Ajouter à une playlist » | Nouveau | Liste des playlists personnelles et de club, création rapide |
| Bouton | Nouveau | Primaire (bleu), secondaire (contour), discret ; tailles normale et lecteur (48 px) |
| Pastille / badge | Nouveau | Dialecte, statut de translittération, statut de révision (toujours avec un libellé, pas seulement une couleur) |
| État vide | Nouveau | Petit motif zellige, titre qui invite à agir, un bouton |
| Champs de formulaire | Nouveau | Texte, zone de saisie des paroles en `dir="rtl"`, liste des dialectes, case des droits, erreurs en ligne |
| Formulaire de contribution | Nouveau | Avec un encadré « existe peut-être déjà » listant les 3 chansons proches |
| Élément de la file de modération | Nouveau | Résumé, auteur, ancienneté, actions approuver / rejeter (note obligatoire) |
| Vue des différences (diff) | Nouveau | Ligne par ligne ; sur une colonne en mobile, deux colonnes avant / après à partir de 1024 px |
| Formulaire de signalement | Nouveau | Motif, détails, e-mail obligatoire sans compte |
| Toast / confirmation | Nouveau | Messages courts au passé : « Ajoutée à Séance du jeudi » |
| Avatar à initiales | Nouveau | Membres d'un club |

## Interactions clés

- **Chercher** :
  1. La personne tape dans la barre ; l'écriture (arabe ou latine) est détectée automatiquement.
  2. Elle valide et la liste des résultats s'affiche.
  3. Si la correspondance vient des paroles, la ligne trouvée apparaît en extrait sous le titre.
  4. Si la requête est trop courte (moins de 2 lettres), un message en ligne s'affiche, sans recherche.
  5. S'il n'y a aucun résultat, un état vide propose de « Proposer cette chanson ».
- **Ouvrir la séance** : depuis l'accueil, « Vos séances » puis « Lire ». Le lecteur s'ouvre sur la chanson 1, en sombre, et l'écran reste allumé (Wake Lock).
  - Si le navigateur ne le permet pas, une astuce unique explique comment désactiver la mise en veille.
- **Naviguer dans le lecteur** :
  - Glisser vers la chanson suivante ou précédente, ou toucher les boutons ; les deux font la même chose.
  - Le sens du glissement suit le sens de l'interface : en arabe (de droite à gauche), « suivant » se fait en glissant vers la droite.
  - La position « 3 / 12 » et la note de l'animateur s'affichent en haut.
  - Un toucher sur les paroles masque ou affiche les contrôles.
- **Régler la lecture** :
  - A− et A+ changent la taille immédiatement ;
  - le choix de taille, de mode d'affichage et de thème est mémorisé sur le téléphone ;
  - à la première activation de la translittération sur une chanson, un état « génération en cours » s'affiche, puis le latin apparaît ligne à ligne ;
  - si la génération échoue, un message s'affiche et l'arabe reste affiché.
- **Préparer une playlist de club** (animateur) :
  1. Depuis un résultat ou une fiche chanson, « Ajouter à une playlist » ouvre une feuille listant ses playlists.
  2. Il choisit la playlist, et une confirmation s'affiche.
  3. Dans la playlist, il réordonne avec ↑ / ↓ et écrit sa note directement dans la ligne.
- **Contribuer** :
  1. La personne remplit le formulaire.
  2. Avant l'envoi, les chansons proches s'affichent : « existe peut-être déjà ».
  3. Une fois la proposition envoyée, une confirmation chaleureuse s'affiche : « يعيشك — votre proposition sera relue ».
  4. Le statut est visible dans « Mes contributions ».
- **Modérer** :
  1. Le modérateur ouvre l'élément suivant de la file.
  2. Il compare les versions (diff).
  3. Il clique sur « Approuver », ou sur « Rejeter », qui demande une note obligatoire.
  4. Le résultat est confirmé et l'élément suivant s'ouvre.
- **Changer de langue** : toute l'interface passe instantanément de droite à gauche ou de gauche à droite. Les paroles restent toujours de droite à gauche.

## Comportement responsive

- **Mobile (360 à 767 px), référence de conception** :
  - une seule colonne ;
  - la navigation principale définie en phase 3 ;
  - le lecteur occupe tout l'écran.
- **768 px et plus** :
  - la même interface dans une colonne centrée, d'au plus 640 px de large ;
  - dans le lecteur, les paroles sont limitées à 720 px de large et centrées, avec des contrôles identiques.
- **1024 px et plus** : seule la vue des différences de la modération change de forme et passe sur deux colonnes (avant / après).
- **Pas d'écrans ordinateur dédiés** dans le MVP.

## Exigences d'accessibilité

- **Niveau visé** : WCAG 2.2 AA.
- **Contrastes vérifiés** :
  - jasmin sur indigo : 13,9:1 ;
  - safran sur indigo : 6,5:1 ;
  - bleu sur jasmin : 5,0:1.
- **Couleurs interdites** :
  - le safran ne sert jamais de texte sur fond clair (2,1:1) ;
  - le bleu ne sert jamais de texte sur indigo (2,8:1).
- **Cibles tactiles** : au moins 48 px dans le lecteur, au moins 44 px ailleurs.
- **Langue et sens d'écriture** : chaque fragment arabe porte `lang="ar"` et `dir="rtl"`, et chaque fragment latin dans une interface arabe porte `dir="ltr"`, pour une lecture correcte par les lecteurs d'écran et un bon ordre d'affichage.
- **Zoom et taille de texte** : le texte reste lisible quand on l'agrandit à 200 %. Les paroles sont réglables jusqu'à 40 px.
- **Mouvement** : chaque glissement a son équivalent en boutons. Les animations sont désactivées si l'utilisateur a activé « réduire les animations » sur son appareil.
- **Clavier et focus** : tous les contrôles sont de vrais éléments `<button>`, `<a>` ou `<input>`. Le focus est visible avec un anneau bleu sur fond clair et un anneau safran sur fond sombre. Sur ordinateur, on peut tout faire au clavier.
- **Statuts** : ils ne reposent jamais sur la couleur seule ; ils portent toujours un libellé texte.
- **Lecteurs d'écran** : les boutons sans texte (icône seule) ont un `aria-label` dans la langue de l'interface. La position « 3 / 12 » est annoncée quand on change de chanson.

## Hors périmètre

- Les accords, le défilement automatique, le mode hors-ligne et la synchronisation en temps réel entre l'animateur et les membres.
- Les applications natives et les mises en page spécifiques à l'ordinateur, sauf la vue des différences de la modération.
- Un site vitrine ou une page marketing.
- Les playlists personnelles publiques ou partagées.
- Les notifications par e-mail.
- Les illustrations, mascottes et photographies : l'identité repose uniquement sur le logo, la palette, la typographie et les motifs zellige.
- L'animation du logo.
