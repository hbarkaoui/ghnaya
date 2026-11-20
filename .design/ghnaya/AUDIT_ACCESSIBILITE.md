# Audit d'accessibilité : Ghnaya (غناية)

Tâche 21 de `TASKS.md`, « Vérification de l'accessibilité ».
Référence : `DESIGN_BRIEF.md`, section « Exigences d'accessibilité » (WCAG 2.2 AA).
Date : 20/11/2026. Base : `feat/fiche-chanson` (a46be6f, tâches 1 à 20).

## En bref

- **Conforme après corrections** sur les points contrôlables dans un navigateur : contrastes, focus visible, noms accessibles, tailles de cible, annonce de la position, clavier, zoom et texte agrandi, statuts.
- **Corrigé** :
  - 3 contrastes de tokens ;
  - 6 cibles trop petites ;
  - 2 statuts signalés par la couleur seule ;
  - le focus qui pouvait passer sous les barres fixes ;
  - l'absence de lien d'évitement ;
  - une dizaine de mises en page qui débordaient ou tronquaient le texte à 320 px ou à 200 %.
- **Reste à vérifier sur un vrai appareil** : VoiceOver (iOS, macOS), TalkBack (Android), NVDA (Windows) ; voir la dernière section.

## Méthode et outils

| Outil | Ce qu'il contrôle |
|---|---|
| Tests Vitest `tests/unit/a11y/` (TDD) | 121 couples de tokens de `src/app/design-tokens.css`, en clair, en sombre, dans le lecteur sombre et dans le lecteur clair, plus la cohérence des blocs sombres |
| Script d'audit injecté dans le navigateur intégré (Chrome), pages chargées dans des iframes de 320, 375 et 640 px | nom accessible de chaque contrôle, taille de chaque cible (48 px dans `[data-reader]`, 44 px ailleurs), contraste de chaque texte affiché sur son fond réel (texte 4,5:1, grand texte 3:1, paroles 7:1), débordement horizontal, texte rogné |
| Même script, racine du document à `font-size: 200%` | texte agrandi par le système |
| Vraies frappes clavier (Tab, Maj+Tab, Entrée, Échap, flèches) à 1280 px, avec un journal des `focusin` | ordre de tabulation, focus visible et sa couleur, focus recouvert, pièges, feuilles, formulaires, lecteur |
| `MutationObserver` sur la région `aria-live` du lecteur | annonce « Chanson 2 sur 12 : … » à chaque changement |

### Écrans couverts

- **Accueil** : membre, animateur, membre sans club, visiteur.
- **Recherche** : vide, trop courte, sans résultat, avec résultats, filtre de dialecte.
- **Fiche chanson**, existante et introuvable.
- **Lecteur** :
  - playlist de 12 chansons ;
  - playlist vide ;
  - chanson seule ;
  - thèmes sombre et clair.
- **Playlists** : liste, consultation et édition.
- **Clubs** :
  - liste ;
  - création ;
  - club avec ses Playlists, Membres et Réglages ;
  - invitation valide et invalide.
- **Moi** : la page et `/moi/compte`.
- **Contributions** : Mes contributions (avec filtre), Proposer, Proposer une correction.
- **Modération** :
  - la file ;
  - une correction (vue des différences) ;
  - un ajout ;
  - les signalements et le détail d'un signalement.
- **Autres pages** : Signaler, Vos droits, Connexion, Vérifiez vos e-mails, 404 générale.

Chaque écran a été vu en français et en arabe, en clair et en sombre, avec les 5 sessions de démonstration selon le cas.

### Limite de l'outil

Le volet du navigateur était masqué pendant les contrôles, ce qui a deux effets :

- `requestAnimationFrame` et les transitions CSS sont figés. Les résultats de recherche, révélés en flux, restaient sur « Recherche en cours… » jusqu'à ce que `requestAnimationFrame` soit remplacé par un minuteur pour l'inspection.
- Certaines couleurs d'anneau ont été lues en pleine transition : `transition-colors` anime aussi `outline-color`, en 150 ms. Les valeurs retenues ci-dessous sont les valeurs stabilisées.

## Résultats, point par point

### 1. Contrastes AA

**Contrôlé** :

- **Par les tests** : chaque couple réellement utilisé dans les composants, à savoir :
  - le texte, le texte secondaire, le texte tertiaire et les liens sur la page, les cartes et les champs ;
  - le texte sur la ligne choisie ;
  - les boutons primaires, au repos, survolés et enfoncés ;
  - les toasts ;
  - les pastilles de statut ;
  - le bouton de suppression ;
  - le bord des champs ;
  - l'anneau de focus ;
  - le losange ;
  - les paroles de la fiche.

  Dans le lecteur : les paroles, la ligne latine, la position « 3 / 12 », les contrôles, le bouton plein et l'anneau de focus.
- **À l'écran** : chaque nœud de texte visible, sur toutes les pages listées, dans les 4 combinaisons de langue et de thème.

**Résultat** : à l'écran, aucun texte sous son seuil. Les tests ont trouvé 3 couples non textuels en défaut.

| Couple | Avant | Après | Correction (`design-tokens.css`) |
|---|---|---|---|
| Bord des champs sur `bg-tertiary`, clair | 2,98:1 | 3,1:1 | `--color-border-primary` #8F8A7A → **#8C8777** (3,4:1 sur la page) |
| Bord des champs sur les feuilles et cartes, sombre | 2,66:1 | 3,6:1 | `--color-border-primary` #5D6694 → **#737CAB** (4,35:1 sur la page, 3,1:1 sur `bg-tertiary`) |
| Anneau de focus global dans le lecteur sombre, quand l'app est en clair | 2,8:1 (bleu sur indigo) | 6,5:1 | `[data-reader] { --color-border-focus: var(--reader-focus) }` : safran en sombre, bleu en clair (5,0:1) |

Le troisième cas touchait la zone des paroles, devenue atteignable au clavier. Les boutons du lecteur avaient déjà `focus-visible:outline-reader-focus`.

Les ratios du brief sont retrouvés par les tests : jasmin sur indigo 13,9:1, safran sur indigo 6,5:1, bleu sur jasmin 5,0:1. Paroles : 12,5:1 dans le lecteur sombre, 13,9:1 dans le lecteur clair, 7,1:1 au minimum pour la ligne latine. `.design/ghnaya/DESIGN_TOKENS.css` est resynchronisé.

### 2. Focus visible

**Contrôlé** :

- au clavier réel, sur l'accueil, le lecteur, la feuille, le formulaire de proposition, la modération et le compte ;
- pour chaque arrêt : la règle `:focus-visible` active, la couleur et l'épaisseur de l'anneau, et si l'élément est recouvert (`elementFromPoint`).

**Résultat** :

- **Anneau** : 3 px, bleu #1F6FB2 en clair et safran #D9A441 en sombre. Dans le lecteur, safran par défaut et bleu en thème clair (`--reader-focus`).
- **Champs** : la barre de recherche et le sélecteur segmenté portent l'anneau sur leur conteneur (`has-[…:focus-visible]`). Le résumé d'erreurs reçoit le focus avec l'anneau.
- Aucun élément focalisé sans anneau.

**Corrections** :

- **Focus jamais caché (2.4.11)** : `scroll-padding-top` (sous l'en-tête collant) et `scroll-padding-bottom` (au-dessus de la barre d'onglets fixée en bas sur mobile) sur `html`, recalculés à partir de 768 px, où la barre passe en haut. Sans eux, Tab pouvait amener un élément derrière la barre du bas, qui fait 64 px.
- **Autocomplétion des artistes** : l'option active au clavier n'était marquée que par un fond, à 1,3:1 sur la liste. Elle reçoit en plus l'anneau de focus intérieur de 2 px.

### 3. `aria-label` bilingues

**Contrôlé** : nom accessible de chaque `a`, `button`, `input`, `select`, `textarea`, `summary` et élément à `tabindex`, sur toutes les pages, en français et en arabe. Les états dynamiques ont été lus aussi :

- la feuille ouverte ;
- les contrôles du lecteur ;
- l'option de l'autocomplétion.

**Résultat** :

- aucun contrôle sans nom ;
- toutes les icônes seules ont un `aria-label` dans la langue de l'interface (exemple : « إغلاق القارئ », « الأغنية التالية ») ;
- les noms reprennent le texte visible (2.5.3) : « Ajouter » → « Ajouter « Sidi Mansour » à une playlist », « FR » → « Français ».

**Ajouts** :

- l'espace de noms **`a11y`** (`a11y.skipToContent` : « Aller au contenu » / « الانتقال إلى المحتوى ») ;
- la zone des paroles est nommée par la clé existante `lyrics.title` (« Paroles » / « الكلمات »).

### 4. Cibles de 48 px dans le lecteur, 44 px ailleurs

**Contrôlé** : boîte englobante de chaque contrôle à 375 px. Pour une carte entièrement cliquable, la carte compte (lien étiré `after:inset-0`). Les liens dans une phrase sont exclus (exception de WCAG 2.5.8).

**Corrections** :

| Cible | Avant | Après |
|---|---|---|
| Logo de l'en-tête mobile (`RootHeaderBar`) | 87 × 41 | 44 de haut |
| Logo de la barre du haut à partir de 768 px (`TabBar`) | 41 de haut | 44 de haut |
| « Tout voir » (accueil) | 56 × 21 | 44 de haut (marges négatives : la ligne garde sa hauteur) |
| « Compris », message « écran allumé » du lecteur | 44 | 48 |
| « Réessayer » de la translittération, dans le lecteur | 44 | 48 (44 sur la fiche) |
| Contrôles du lecteur | 48 en rem (96 px à 200 % de texte) | `--size-touch-reader` : 48 px fixes |

**Après** : toutes les pages contrôlées passent.

### 5. Annonce de la position « 3 / 12 »

**Contrôlé** : contenu de la région `aria-live="polite"` du lecteur à chaque changement, au clavier (flèches) et au bouton, en français et en arabe.

**Résultat** : l'annonce est conforme.

- **Contenu** : « Chanson 2 sur 12 : على نار », puis « Chanson 1 sur 12 : سيدي منصور » au retour ; en arabe, « الأغنية 2 من 12: على نار ».
- **Balisage** : le titre est isolé dans un `<bdi lang="ar" dir="rtl">`.
- **Écran de fin** : il est annoncé (« Fin de la séance » après la 12e chanson).
- **Contrôles masqués** : la région est hors des zones `inert`, donc l'annonce continue.
- **Aucune correction** n'était nécessaire.

### 6. Navigation complète au clavier (1280 px)

**Contrôlé**, avec de vraies frappes :

- **Accueil** :
  - le premier Tab fait apparaître « Aller au contenu », puis viennent le logo, les 4 onglets, FR, ع, la recherche et les cartes (lien, « Lire ») ;
  - après la dernière carte, retour en haut : aucun piège.
- **Lien d'évitement** (nouveau) : Entrée, puis Tab, mène au champ de recherche, dans `<main id="contenu">`. En arabe, il apparaît à droite.
- **Feuille « Ajouter à une playlist »** :
  - Entrée l'ouvre et le focus passe sur la feuille ;
  - Tab et Maj+Tab tournent dans la feuille (Fermer, champ, « Créer et ajouter ») ;
  - les 21 enfants de `body` deviennent inertes ;
  - Échap la ferme et rend le focus visible à « Ajouter ».
- **Lecteur** :
  - ordre de tabulation : Fermer, note, zone des paroles (nouvelle), Compris, puis les 5 contrôles ;
  - les flèches suivent le sens de lecture (en arabe, ← donne la chanson suivante) ;
  - Échap ferme le lecteur.
- **Formulaire de proposition** : un envoi vide donne le focus au résumé « 5 points à corriger », dont chaque lien mène à son champ. Les champs portent `aria-invalid` et `aria-describedby` (aide et erreur).
- **Modération** : « Rejeter » sans note met le focus sur la note, invalide, avec aide et erreur associées. L'ordre est le suivant : Voir la chanson, note, Approuver, Rejeter, Suivante.
- **Sous-onglets** (club, modération) : ce sont des liens, avec `aria-current="page"`.

**Corrections** :

- **Lien d'évitement** (WCAG 2.4.1) dans `TabBar`. Il n'existe que si la barre est affichée. La tâche 19 avait placé la navigation avant le contenu.
- **Zone des paroles atteignable au clavier** : `tabIndex={0}`, `role="region"`, nom « Paroles ». Safari ne rend pas seul une zone de défilement focalisable ; ↑, ↓, Espace et Page suivante font défiler les paroles longues (« الأطلال »).
- **Contrôles masqués d'un toucher** : la touche Tab les rend. Sinon, après un clic sur les paroles, ils restaient inertes et hors d'atteinte.

### 7. Zoom à 200 % et texte agrandi

**Contrôlé** :

- **Zoom** : mise en page à 640 px (1280 px zoomés à 200 %) et à 320 px (reflow, WCAG 1.4.10).
- **Texte agrandi** : `font-size: 200%` sur la racine, à 375 px, en français clair et en arabe sombre.
- **Méthode** : recherche des débordements horizontaux, des textes rognés (`overflow: hidden` dont le contenu dépasse) et des contrôles hors de l'écran.

**Résultat avant correction** :

- **320 px** : le bouton « suivant » du lecteur sortait de l'écran (6 × 48 px + espaces = 352 px) ; la ligne « club · nombre de chansons » des cartes était coupée à 2 lignes.
- **Texte à 200 %** :
  - les libellés de la barre d'onglets (hauteur fixe de 64 px) étaient coupés hors de l'écran ;
  - le nom des playlists était écrasé à 0 px de large et « Lire » sortait de la carte ;
  - « Ajouter à une playlist » faisait 448 px de large (`whitespace-nowrap`) ;
  - le filtre de dialecte et sa liste sortaient de l'écran ;
  - les titres d'en-tête étaient tronqués (« Proposer une… ») ;
  - le nom des membres était tronqué ;
  - le titre de la page playlist débordait ;
  - dans le lecteur, les paroles tombaient à 0 px de haut, « Compris » écrasait son message en une colonne de 678 px, et les contrôles (96 px chacun) sortaient de l'écran.

**Corrections** (sans changement visible à la taille normale, vérifié à 375 px) :

- **`--size-tabbar`** : 64px → **4rem**. La barre et tout ce qui se cale dessus grandissent avec le texte (marge du contenu, toasts, en-tête collant). L'icône reste en 24 px et le libellé passe sur deux lignes au besoin (`leading-tight`).
- **Cartes de playlist, en-tête de la playlist, squelettes de liste** : `flex-wrap` et `basis-32` ou `basis-40`. Quand la place manque, l'action passe à la ligne. La ligne « club · nombre » n'est plus coupée.
- **En-tête de second niveau** : `min-h-14`, titre sur plusieurs lignes au lieu de `truncate`. Cela supprime aussi le rognage des jambages (« p », « y ») et des signes arabes sous les lettres.
- **Titre et sous-titre du lecteur** : `line-clamp-2` au lieu de `truncate`.
- **Noms des membres** : `break-words` au lieu de `truncate`.
- **Boutons** « Ajouter à une playlist » (fiche) et « Ajouter des chansons » (édition) : le texte peut passer à la ligne.
- **Filtre de dialecte** : ligne en `flex-wrap`, filtre au bout de la ligne (`ms-auto`), liste limitée à la largeur de l'écran.
- **Lecteur** :
  - contrôles de 48 px fixes, marges et espaces en tokens px (`--space-*`), resserrés sous 352 px : la rangée tient de 320 px jusqu'à 200 % de texte ;
  - paroles d'au moins 8 rem (`min-h-32`) ;
  - message « écran allumé » qui passe à la ligne ;
  - en dernier recours, le lecteur entier défile (`overflow-y-auto`), pour que les contrôles restent atteignables.

**Après** : 320 px, 640 px et texte à 200 % (français et arabe) passent sur toutes les pages listées, sans débordement ni texte rogné. Les points de rupture sont en rem (tâche 19) : avec une taille de texte système à 200 %, la mise en page mobile s'applique jusqu'à 1536 px.

### 8. Statuts jamais signalés par la couleur seule

**Contrôlé** :

| Élément | Ce qui le distingue, en plus de la couleur |
|---|---|
| Pastilles (`Badge`) : propositions, type, motif de signalement | un texte toujours présent, et une icône |
| Vue des différences | signes « + » et « − », `<ins>` / `<del>`, libellés masqués « Ligne ajoutée : » et « Ligne retirée : », en-têtes « Avant / Après » |
| Erreurs de formulaire | icône, texte, résumé, `aria-invalid` |
| Onglet actif | losange, graisse 500, `aria-current` |
| Sous-onglets | soulignement, losange, graisse |
| Bascule FR · ع | fond inversé, `aria-pressed` |
| Mode d'affichage des paroles | option inversée |
| Filtre de dialecte | nom du dialecte dans la pastille, ✕, coche dans la liste |
| Animateur | anneau doublé du libellé du rôle |
| Chanson retirée | libellé |

**Corrections** :

- « **Mes contributions** » : le filtre actif ne se distinguait que par son bord bleu et son fond. Il porte maintenant une **coche**.
- **Option active de l'autocomplétion** : voir le point 2.

### 9. `lang` et `dir` sur chaque fragment

Ce point a été traité par la tâche 20 (`Bidi`, `scriptAttrs`, `RELECTURE_ARABE.md`). L'audit n'a rien changé ici et a seulement observé :

- **Les annonces sont bien balisées** : l'annonce du lecteur et les noms saisis portent `lang="ar" dir="rtl"` ou `dir="ltr"` selon leur écriture, et les lignes latines des paroles portent `lang="ar-Latn"`.
- **Un fragment latin dans l'interface arabe** (titre « Sidi Mansour », nom « Saber Rebai ») a `dir="ltr"` mais pas de `lang` : il hérite de `ar`. C'est conforme à WCAG 3.1.2, qui exempte les noms propres. En revanche, une voix arabe peut le prononcer mal : à écouter sur appareil (VoiceOver détecte en principe l'écriture latine).
- **Les textes ajoutés** (`a11y.skipToContent`) ne sont pas encore dans `RELECTURE_ARABE.md` : relancer `relecture.mjs` après y avoir rattaché la clé à un écran (« Coque »).

### Mouvement (rappel du brief)

Pas de nouveau contrôle : la tâche 18 a vérifié que chaque glissement a son équivalent en boutons et que `prefers-reduced-motion` ramène les durées à 0. Les changements de cette tâche n'ajoutent aucune animation.

## Fichiers modifiés

- **Tokens** : `src/app/design-tokens.css` (et sa copie `.design/ghnaya/DESIGN_TOKENS.css`) — `--color-border-primary` (clair et sombre), `--color-border-focus` dans le lecteur, `--size-tabbar` en rem.
- **Styles globaux** : `src/app/globals.css` — `scroll-padding`.
- **Messages** : `messages/fr.json`, `messages/ar.json` — espace de noms `a11y`.
- **Coque** : `TabBar` (lien d'évitement, logo, icônes et libellés), `RootHeaderBar`, `PageHeader`.
- **Lecteur** : `ReaderShell`, `ReaderEmpty`, `TranslitStatus`.
- **Listes et pages** :
  - `PlaylistCard` ;
  - `Skeleton` ;
  - `app/page.tsx` (« Tout voir ») ;
  - `app/playlists/[id]/page.tsx` ;
  - `app/clubs/[slug]/membres/page.tsx` ;
  - `app/recherche/page.tsx` et `DialectFilter` ;
  - `AddToPlaylist` ;
  - `PlaylistEditor`.
- **Statuts** : `app/mes-contributions/page.tsx` (coche), `ArtistInput` (anneau de l'option active).
- **Tests** : `tests/unit/a11y/contrast.test.ts`, `tokenContrast.test.ts` et leurs outils `support/contrast.ts`, `support/tokens.ts`.

## Reste à vérifier sur un vrai appareil

Aucun lecteur d'écran n'a été lancé : les contrôles portent sur l'arbre d'accessibilité et le DOM.

1. **VoiceOver iOS (Safari), TalkBack (Chrome Android)** :
   - **Lecteur** :
     - l'annonce « Chanson 3 sur 12 : … » après un glissement ;
     - la lecture du titre arabe avec la bonne voix ;
     - les contrôles masqués d'un toucher (ils sortent de l'arbre d'accessibilité : vérifier qu'un double-toucher sur les paroles les rend) ;
     - la zone « Paroles » focalisable.
   - **Feuille** : le titre est lu à l'ouverture et le focus est rendu à la fermeture (Safari ne donne pas le focus à un bouton touché ; `returnFocus` le compense).
   - **Toasts** : le message est lu, y compris pendant qu'une feuille est ouverte.
   - **Fragments latins dans l'interface arabe et fragments arabes dans l'interface française** : quelle voix est utilisée.
2. **VoiceOver macOS et NVDA (Windows)** :
   - Les erreurs de groupe « Titre » et « Artistes » du formulaire de proposition sont décrites sur le `fieldset` (`aria-describedby`), pas sur chaque champ, qui n'est pas marqué `aria-invalid` pour le titre. La lecture de cette description à l'entrée dans le groupe varie selon le lecteur d'écran : à écouter.
   - Le résumé d'erreurs focalisé est-il lu en entier ?
3. **Texte agrandi par le système** :
   - iOS (taille de texte, Safari) et Android (mise à l'échelle du texte dans Chrome) ne passent pas par le même mécanisme que la simulation (`font-size` sur la racine).
   - Avec une vraie taille de police par défaut du navigateur, les media queries en rem grandissent aussi : c'est attendu, mais à confirmer à l'œil.
4. **Zones de sécurité** : en mode autonome sur iPhone, le lien d'évitement et `scroll-padding` avec `env(safe-area-inset-*)`.
5. **Mode paysage sur téléphone** (non essayé, calculé) : la zone des paroles garde au moins 8 rem. Avec la note et le message « écran allumé » ouverts, sur un écran de 375 px de haut, le lecteur devrait défiler d'environ 60 px. À regarder sur un vrai téléphone.

## Remarques hors périmètre (non corrigées)

- **Toasts** : ils disparaissent seuls après 4 s (6 s pour une erreur). Le contenu est annoncé, et l'état de la page le reflète le plus souvent, mais une personne qui lit lentement ou qui zoome peut les manquer. Une option « garder les messages » serait à discuter (WCAG 2.2.1).
- **Filtre de dialecte** (`<details>`) : Échap ne referme pas la liste (comportement natif du navigateur). Ce n'est pas une exigence WCAG, mais ce serait plus cohérent avec les feuilles.
- **Bouton « Affichage des paroles » du lecteur** : son état ouvert se lit au fond plus clair, à `aria-expanded` et au panneau qui apparaît au-dessus. C'est suffisant, mais à revoir à la revue de design.
- Déjà relevé par la tâche 20 : l'onglet « Moi » est actif sur une playlist de club, et le statut s'appelle « Approuvée / Rejetée » côté modération mais « Acceptée / Refusée » côté auteur.
