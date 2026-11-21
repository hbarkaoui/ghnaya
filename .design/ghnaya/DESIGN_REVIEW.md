# Revue de design : Ghnaya (غناية), l'application

- **Comparée à** : `DESIGN_BRIEF.md`, `INFORMATION_ARCHITECTURE.md` et les tokens (`src/app/design-tokens.css`, repris de `DESIGN_TOKENS.css`).
- **Philosophie** : « médina contemporaine » (direction visuelle A, « Jasmin et zellige »).
- **Date** : 20/11/2026.
- **Code revu** : `feat/fiche-chanson` au commit `2a4ac4f` (tâches 1 à 21), servi par `next dev` sur le port 3022.

## Synthèse

L'app tient sa promesse principale. Le lecteur de séance ressemble à ce que le brief décrit : des paroles en grand, en blanc jasmin sur fond indigo nuit, et rien autour une fois les contrôles masqués. La palette, les trois polices et les touches de zellige restent sobres et cohérentes, en clair comme en sombre, en français comme en arabe. Les tokens sont respectés partout : aucune couleur en dur hors du logo, et aucune page ne défile horizontalement, à aucune largeur.

Le constat le plus grave touche justement le lecteur. Son titre rogne les points sous les lettres arabes : « سيدي منصور » s'affiche « سيدى منصور ». Ensuite, le lien vers l'artiste de la fiche chanson mène à une page introuvable, car `/artiste/[id]` n'a jamais été construite. Le reste relève de la cohérence et du polissage.

## Suivi des corrections

L'utilisateur a choisi de traiter **les constats 1 et 2** seulement (21/11/2026). Les constats 3 à 16 restent ouverts.

| Constat | Statut | Ce qui a changé |
|---|---|---|
| 1. Titre du lecteur rogné | **Corrigé** le 21/11/2026 | `leading-normal` sur le titre (`ReaderShell.tsx:195`) : hauteur de ligne de 30 px au lieu de 25. Nouveau test `tests/unit/i18n/clippedText.test.ts` : aucun texte rogné (`line-clamp-*`, `truncate`) de `src/` ne garde une hauteur de ligne serrée. |
| 2. Page artiste absente | **Corrigé** le 21/11/2026 | Nouvelle page `src/app/artiste/[id]/` (page et 404), données `src/mocks/artists.ts`, adresses `src/lib/artist/routes.ts`, option `omitArtistId` de `SongResultItem`, messages `artist.*` en français et en arabe (ajoutés à `RELECTURE_ARABE.md`). Tests : `tests/unit/artist/` et `artistsExcept`. |

Vérifié après correction : `pnpm test` (605 tests), `pnpm typecheck` et `pnpm lint` passent. Dans le navigateur intégré :
- le titre du lecteur garde les points du ي en français et en arabe, à 375 et 1280 px (`line-height: 30px`) ;
- le lien de l'artiste mène à sa page, et la console ne montre aucune erreur.

Preuves :
- **Constat 1** : `fix-lecteur-titre-avant-apres.png` (avant / après agrandis), et `fix-lecteur-titre-{fr,ar}-{375,1280}.png`, `fix-lecteur-titre-clair-ar-375.png` (« حبيتك بالصيف »).
- **Constat 2** :
  - la page : `review-artiste-*` en FR et AR, clair et sombre, 375, 768 et 1280 ;
  - `review-artiste-feuille-ajout-fr-light-375.png` (« Ajouter ») ;
  - `review-artiste-page-vide-fr-light-375.png` (au-delà de la dernière page) ;
  - `review-artiste-introuvable-{fr-light,ar-dark}-375.png` (404) ;
  - `review-artiste-depuis-chanson-fr-light-375.png` (clic sur le lien de la fiche chanson).

## Méthode

- **Captures** : 207 fichiers PNG pour la revue, et 16 de plus après les corrections du 21/11/2026, dans `.design/ghnaya/screenshots/` (223 fichiers, 11 Mo).
  - Les séries ont été faites avec Chrome sans interface, piloté par le protocole DevTools, car le navigateur intégré n'enregistre pas de fichiers. Le script règle les cookies `locale` et `ghnaya-demo-session`, la largeur, `prefers-color-scheme` et `prefers-reduced-motion: reduce`, pour éviter des fondus figés à mi-course.
  - Les vérifications interactives ont été faites dans le navigateur intégré : agrandissement du titre du lecteur, mesure de son style calculé, astuce de mise en veille, titre coufique de la fiche.
- **Largeurs** : 375, 768 et 1280 px.
- **Combinaisons** :
  - **À 375 px** : chaque écran en français clair et en arabe sombre, et les écrans clés aussi en français sombre et en arabe clair.
  - **À 768 et 1280 px** : les écrans clés en français clair et en arabe sombre.
- **Lecteur** : `/lecture/seance-du-jeudi/1` et les positions 2, 10, 11 et 12, avec :
  - les tailles 1, 3 et 6 ;
  - les modes Arabe, Arabe + latin et Latin ;
  - les thèmes sombre et clair ;
  - les états de translittération (génération en cours, échec, limite quotidienne) ;
  - les contrôles masqués, l'écran de fin, la playlist vide et la chanson seule.
- **Interactions** : feuille « Ajouter à une playlist », toast, focus au clavier (vraies frappes de Tab), envoi vide du formulaire de proposition.
- **Code** : recherche des couleurs en dur, des valeurs arbitraires, des variantes `max-*`, des styles de titre et des boîtes qui rognent le texte.
- **Déjà couvert ailleurs, non refait ici** :
  - contrastes, focus, cibles tactiles, annonces et zoom à 200 % dans `AUDIT_ACCESSIBILITE.md` ;
  - libellés arabes, miroir et icônes retournées dans `RELECTURE_ARABE.md`.

  Cette revue s'appuie sur leurs constats sans les répéter.

## À corriger (Must fix)

1. **Le titre du lecteur rogne les signes sous les lettres arabes.** _(Corrigé le 21/11/2026, voir « Suivi des corrections ».)_
   - **Ce qu'on voit** : en haut du lecteur, « سيدي منصور » se lit « سيدى منصور ». Les deux points du ي final sont coupés, et la lettre devient un ى. Cela touche la vue où l'on passe 80 % du temps, dans les deux langues et les deux thèmes.
   - **Où** : `src/components/reader/ReaderShell.tsx:194`, où `line-clamp-2 text-lg` donne une hauteur de ligne de 25 px (1,25) dans une boîte `overflow: hidden`. Mesuré dans le navigateur intégré : texte « سيدي » (U+064A), `line-height: 25px`, `overflow: hidden`.
   - **Cause de fond** : la règle `:lang(ar) { line-height: 1.7 }` des tokens est dans `@layer base`. Les utilitaires `text-lg`, `text-xl`… l'écrasent, avec la hauteur de ligne « tight ». Ici seulement, cela se combine avec un rognage.
   - **Preuves** :
     - `screenshots/review-lecteur-titre-rogne-zoom-navigateur-integre.png` ;
     - `review-lecteur-defaut-fr-375.png` ;
     - `review-lecteur-clair-ar-375.png` ;
     - `review-lecteur-arabe-latin-ar-1280.png`.
   - _Correction : donner au titre une hauteur de ligne d'au moins 1,5 (`leading-normal`, ou `leading-relaxed` quand le titre est arabe), en gardant `line-clamp-2`. Ajouter un test qui vérifie que le titre du lecteur n'a pas une hauteur de ligne « tight »._

2. **Le lien de l'artiste mène à une page introuvable.** _(Corrigé le 21/11/2026 : la page est construite, voir « Suivi des corrections ».)_
   - **Ce qu'on voit** : sur chaque fiche chanson, le nom de l'artiste est un lien bleu. Il ouvre la 404 générale.
   - **Pourquoi c'est un écart** : la page `/artiste/[id]?page=` figure dans l'IA (plan du site et « Croissance du contenu » : pagination par 50) et dans les pages du plan 1 citées par le brief. Mais aucune tâche de `TASKS.md` ne la construit, et la note de la tâche 8 le signalait déjà.
   - **Où** : `src/components/song/ArtistNames.tsx:23`.
   - **Preuves** : `review-chanson-fr-light-375.png` (le lien). La 404 obtenue était la 404 générale, identique à `review-introuvable-fr-light-375.png`. Les captures `review-artiste-*` montrent désormais la page construite.
   - _Correction, au choix :_
     - _construire `/artiste/[id]` : noms arabe et latin, nombre de chansons, liste en `SongResultItem` avec « Ajouter », pagination par 50, 404 pour un artiste inconnu ;_
     - _ou, en attendant, afficher les noms sans lien (`linked={false}`)._

## À corriger ensuite (Should fix)

3. **L'onglet actif saute vers « Moi » quand on ouvre la playlist d'un club.**
   - **Ce qu'on voit** : un membre ouvre « Séance du jeudi » depuis l'Accueil ou depuis « Mon club ». La barre d'onglets marque alors « Moi », un onglet qu'il n'a jamais touché.
   - **Pourquoi** : `TabBar` décide d'après le chemin seul, et `/playlists` appartient à « Moi » (`src/components/shell/TabBar.tsx:36`).
   - **Pourquoi c'est un écart** : l'IA se contredit sur ce point. Le plan du site range `/playlists/[id]` sous Moi, alors que le modèle de navigation décrit « Clubs, puis un club, puis une playlist ».
   - **Preuves** : `review-playlist-membre-fr-light-375.png`, `review-playlist-animateur-fr-light-375.png`.
   - _Correction : choisir l'onglet d'après la playlist (club → « Clubs » / « Mon club », personnelle → « Moi »), par exemple avec un attribut posé par la page et lu par la `TabBar`. Puis lever l'ambiguïté dans l'IA._

4. **Le nombre de chansons d'une playlist change d'un écran à l'autre.**
   - **Ce qu'on voit** : « Soirée de printemps » compte 6 chansons sur l'Accueil, sur le club et sur sa page, mais 7 dans la feuille « Ajouter à une playlist ».
   - **Pourquoi** : la feuille compte aussi la chanson retirée (`target.songIds.length`, `src/components/playlist/AddToPlaylistSheet.tsx:163`). Les autres écrans utilisent `readerPositionsOf` (`src/components/playlist/PlaylistCard.tsx:17`).
   - **Preuves** : `review-feuille-ajout-fr-light-375.png` et `review-accueil-membre-fr-light-375.png`.
   - _Correction : utiliser le même calcul partout, idéalement une seule fonction `playlistSongCount`._

5. **Deux boutons côte à côte, dont l'un passe sur deux lignes à 375 px.**
   - **Ce qu'on voit** :
     - sur la fiche chanson, « Ajouter à une playlist » se casse sur deux lignes à côté de « Mode séance », qui tient sur une seule ;
     - en mode édition de playlist, même chose pour « Ajouter des chansons » à côté de « Terminer ».

     La paire paraît tassée, et les deux boutons n'ont plus la même hauteur de texte.
   - **Où** : `src/app/chanson/[id]/page.tsx:71-80`, `src/components/playlist/PlaylistEditor.tsx`.
   - **Preuves** : `review-chanson-fr-light-375.png`, `review-chanson-visiteur-fr-light-375.png`, `review-playlist-edition-fr-light-375.png`.
   - _Correction : reprendre le modèle de la page playlist, qui marche bien. Le bouton primaire passe en pleine largeur, et le secondaire sur sa propre ligne en dessous, toujours sur une seule ligne. On garde le libellé du lexique (« Ajouter à une playlist »). Côte à côte à partir de 768 px._

6. **Les cartes de playlist répètent le club là où il est évident, et leur séparateur reste en bout de ligne.**
   - **Ce qu'on voit, dans le club** : sur `/clubs/les-jasmins`, chaque carte reprend la couverture « J » et le texte « Les Jasmins · », juste sous l'en-tête des Jasmins. C'est une information sans valeur, qui fait passer chaque titre sur deux lignes à 375 px.
   - **Ce qu'on voit, sur l'Accueil d'un membre** : un membre n'a qu'un club, donc les trois cartes de « Vos séances » portent la même couverture. Elles se distinguent mal.
   - **Partout** : la ligne « Les Jasmins · » se coupe après le point médian, qui reste seul en fin de ligne.
   - **Où** : `src/components/playlist/PlaylistCard.tsx:38-42`.
   - **Preuves** : `review-club-animateur-fr-light-375.png`, `review-club-membre-fr-light-375.png`, `review-accueil-membre-fr-light-375.png`.
   - _Correction :_
     - _ajouter une variante « dans un club » sans nom de club, avec une icône de liste ou le nombre de chansons à la place de la couverture ;_
     - _garder la couverture sur l'Accueil d'un animateur, qui a plusieurs clubs ;_
     - _ne pas couper la ligne après le séparateur, par exemple avec `whitespace-nowrap` sur « · 12 chansons »._

7. **Les titres de page n'ont pas de règle typographique claire.**
   - **Ce qu'on voit** : la police dépend de l'écran.
     - **En Reem Kufi** : la fiche chanson, la playlist, le club, « Vos droits », « Connectez-vous », « Vérifiez vos e-mails », l'écran de fin, la playlist vide du lecteur.
     - **En IBM Plex, au même corps (2xl)** : « Chercher une chanson », « Vos clubs », le nom de l'utilisateur dans Moi.
   - **Pourquoi c'est un écart** : le brief réserve Reem Kufi « au logo et aux grands titres ». Aujourd'hui, deux grands titres de même rang n'ont pas la même voix.
   - **Où** :
     - `src/app/recherche/page.tsx:45` ;
     - `src/app/clubs/(liste)/page.tsx:56` ;
     - `src/app/moi/page.tsx:43`.

     À comparer avec `src/app/playlists/[id]/page.tsx:113`.
   - **Preuves** : `review-chercher-vide-fr-light-375.png`, `review-clubs-animateur-fr-light-375.png`, `review-moi-membre-fr-light-375.png`, `review-playlist-animateur-fr-light-375.png`.
   - _Correction : fixer la règle « tout `h1` visible de 2xl ou plus est en Reem Kufi 600 ; les titres de section (`h2`) et l'en-tête de second niveau restent en Plex ». L'appliquer aux trois titres ci-dessus et la noter dans le brief._

## Améliorations possibles (Could improve)

8. **Les bordures en tirets donnent un air de maquette.** Elles servent aux états vides (`EmptyState`), à la 404, à l'erreur et à « Créer un club ». Un cadre pointillé évoque une zone de dépôt ou un écran inachevé, et le motif zellige se suffit à lui-même.
   - **Où** : `src/components/ui/EmptyState.tsx:60`, `src/app/clubs/(liste)/page.tsx:93, 112, 132`.
   - **Preuves** : `review-accueil-sans-club-fr-light-375.png`, `review-introuvable-fr-light-375.png`, `review-clubs-animateur-fr-light-375.png`.
   - _Suggestion : une carte pleine (`bg-card`, filet `line-subtle`) ou pas de cadre du tout. On garde les tirets pour la seule action de création, « Nouvelle playlist » dans la feuille._

9. **La feuille « Ajouter à une playlist » forme une liste plate pour un animateur.** Ses 7 playlists de 3 clubs y sont mêlées par date, chacune avec sa couverture.
   - **Où** : `src/components/playlist/AddToPlaylistSheet.tsx`.
   - **Preuves** : `review-feuille-ajout-fr-light-375.png`, `review-feuille-ajout-fr-light-1280.png`.
   - _Suggestion : regrouper par club (en-tête avec couverture S et nom), puis « Personnelles » ; la couverture ne se répète plus sur chaque ligne._

10. **Le safran devient la couleur de toutes les actions en mode sombre.** Le token `--color-accent-primary` passe au safran en sombre (`design-tokens.css:188`), un choix justifié par le contraste. Mais sur l'Accueil sombre, cela fait 5 boutons « Lire » safran et la loupe : le safran cesse d'être une touche.
    - **Preuves** : `review-accueil-membre-fr-dark-375.png`, `review-accueil-membre-ar-dark-375.png`.
    - _Suggestion :_
      - _garder le safran pour l'action principale de chaque écran (loupe, « Lire depuis le début », « Mode séance ») ;_
      - _donner aux « Lire » des listes un style secondaire en sombre (contour `line`, texte `link` #8DBBEA, 8,7:1)._

      _À trancher, car cela touche les tokens._

11. **« Lire » reste actif sur une playlist vide.** La carte « Séance de décembre · 0 chanson » propose le même bouton que les autres, et il ouvre l'état vide du lecteur. C'est conforme au parcours 1 de l'IA, mais l'information est connue avant le toucher.
    - **Preuves** : `review-accueil-membre-fr-light-375.png`, `review-lecteur-playlist-vide-fr-375.png`.
    - _Suggestion : sur la carte, un bouton discret ou absent, avec « Pas encore de chansons » à la place du nombre._

12. **L'ordre des contrôles du lecteur diffère de l'IA.** L'IA décrit « précédent, A−, A+, mode d'affichage, thème, suivant ». Le lecteur affiche « précédent, A−, mode, thème, A+, suivant ».
    - **Où** : `src/components/reader/ReaderShell.tsx:330-372`.
    - **Preuve** : `review-lecteur-defaut-fr-375.png`.
    - _Suggestion : regrouper A− et A+ (un seul geste mental : la taille), ou noter dans l'IA que la disposition symétrique est voulue._

13. **L'icône de lecture (▷) est retournée en arabe.**
    - **Ce qu'on voit** : « اقرأ » montre ◁ (`PlaylistCard.tsx:50`, `playlists/[id]/page.tsx:131`).
    - **Pourquoi c'est à trancher** : c'est une décision de la tâche 20 (`RELECTURE_ARABE.md`, « Icônes retournées en arabe »). Mais l'usage courant, par exemple dans les règles de bidirectionnalité de Material Design, est de ne pas retourner les commandes de lecture média.
    - **Preuves** : `review-accueil-membre-ar-dark-375.png`, `review-playlist-animateur-ar-dark-375.png`.
    - _Suggestion : poser la question à l'arabophone qui relit `RELECTURE_ARABE.md`._

14. **Le bouton Google en sombre est indigo au lieu du thème sombre de Google.** La tâche 16 l'avait signalé pour cette revue.
    - **Mon avis** : c'est acceptable pour la maquette. Pour le plan 2, je conseille de passer à une variante officielle de Google, comme on le fait déjà pour le logo, qui est une exception aux tokens : clair en mode clair, et sombre (#131314) ou neutre en mode sombre. Les règles de marque de Google, qui comptent pour la validation de l'écran de consentement OAuth, n'autorisent pas un fond personnalisé. À vérifier sur la page officielle au moment du plan 2.
    - **Où** : `src/components/auth/GoogleSignInButton.tsx:39`.
    - **Preuve** : `review-connexion-ar-dark-375.png`.

15. **« Donner le rôle d'animateur » se répète sur chaque ligne de la liste des membres** (vue animateur). Le même lien revient 7 fois et alourdit la liste.
    - **Où** : `src/components/club/MemberActions.tsx`.
    - **Preuve** : `review-club-membres-ar-dark-375.png`.
    - _Suggestion : un bouton « ⋯ » par ligne qui ouvre les actions, ou un mode « Gérer les rôles »._

16. **Côté code** (déjà notés lors des fusions, rappelés ici pour la qualité des composants) :
    - deux composants `ReportForm` aux rôles différents (`components/report/` et `components/moderation/`) : renommer le second en `ReportDecisionForm` ;
    - trois stockages fictifs de playlists, et une feuille d'ajout qui lit la liste fixe `CLUBS` (voir les notes de fusion).

## Ce qui marche bien

- **Le lecteur de séance tient le principe 1.**
  - Paroles en Noto Naskh 28 px, interligne 1,9, couplets espacés, sur indigo nuit.
  - Un toucher sur les paroles masque tout, sans même la position (`review-lecteur-controles-masques-fr-375.png`).
  - La position « 1 / 12 » en safran et la note de l'animateur restent lisibles sans voler la vedette.
  - La ligne latine à 72 % se lit bien sous l'arabe (`review-lecteur-arabe-latin-fr-375.png`).
  - Les états de translittération sont clairs et gardent toujours l'arabe : génération en cours, échec avec « Réessayer », limite quotidienne.
- **L'écran de fin, la playlist vide et la chanson seule** sont de vrais écrans, avec le symbole du logo et un titre coufique (`review-lecteur-fin-fr-375.png`, `review-lecteur-playlist-vide-fr-375.png`). C'est le « patrimoine par touches » bien placé.
- **Le miroir arabe est soigné.**
  - Les onglets, les chevrons et les contrôles du lecteur (suivant à gauche) sont inversés.
  - Les fragments latins restent dans leur sens.
  - Les guillemets «…» sont corrects (`review-chercher-aucun-resultat-ar-dark-375.png`).
  - Le diff reste lisible sur deux colonnes à 1280 px (`review-moderation-diff-fr-light-1280.png`).
- **Le mode sombre est voulu, pas inversé.** Indigo profond, jamais noir. Le safran sert au focus et au bouton primaire. Les badges de statut gardent un libellé et une icône (`review-moderation-file-ar-dark-375.png`, `review-mes-contributions-fr-light-375.png`).
- **La recherche pardonne et montre pourquoi.**
  - « 3la nar » trouve « على نار » (`review-chercher-arabizi-fr-light-375.png`).
  - L'extrait des paroles surligne le mot trouvé (`review-chercher-extrait-paroles-fr-light-375.png`).
  - Les cas trop court, vide et sans résultat ont chacun leur message.
- **La discipline des tokens est réelle.**
  - Aucune couleur Tailwind brute.
  - Les seuls codes hexadécimaux hors tokens sont le logo et `themeColor` (que la balise meta ne peut pas lire en variable).
  - Les valeurs arbitraires sont réservées aux zones de sécurité de l'écran.
  - Aucune variante `max-*` : le CSS est bien construit d'abord pour le mobile.
- **Les grands écrans sont adaptés sans ajouter de structure.** Onglets en haut, colonne de 640 px, paroles à 720 px, diff sur deux colonnes à 1024 px. Rien ne déborde, à aucune largeur.
- **Le titre arabe de la fiche chanson en Reem Kufi est validé.** La tâche 8 demandait de le trancher ici. Il donne sa voix à la fiche, reste lisible (ى coufique correct, `review-chanson-visiteur-titre-fr-light-375.png`) et laisse les paroles en Naskh.
- **Les formulaires sont exemplaires.** Résumé des erreurs, erreurs au-dessus des champs, encadré « existe peut-être déjà » au bon moment (`review-contribuer-erreurs-fr-light-375.png`, `review-contribuer-proches-fr-light-375.png`).

## Captures réalisées

> Toutes les captures sont dans `.design/ghnaya/screenshots/`. Leur nom suit le modèle `review-<écran>-<langue>-<thème>-<largeur>.png`, ou `review-lecteur-<état>-<langue>-<largeur>.png` pour le lecteur, qui est sombre par défaut quel que soit le thème du système.
>
> Hauteurs de fenêtre : 375 × 812, 768 × 1024 et 1280 × 800. Les pages sont capturées en entier, sauf le lecteur et la feuille, capturés à hauteur d'écran.

| Écran (`review-…`) | Variantes |
|---|---|
| `accueil-membre` | FR clair 375 · 768 · 1280 ; FR sombre 375 · 768 · 1280 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `accueil-animateur` | FR clair 375 ; AR sombre 375 |
| `accueil-sans-club` | FR clair 375 ; AR sombre 375 |
| `accueil-visiteur` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `accueil-focus-clavier` | FR clair 375 ; FR sombre 375 (anneau bleu puis safran) |
| `chercher-resultats` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `chercher-vide`, `chercher-trop-court`, `chercher-aucun-resultat`, `chercher-dialecte`, `chercher-extrait-paroles` | FR clair 375 ; AR sombre 375 |
| `chercher-arabizi` | FR clair 375 |
| `chanson` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `chanson-visiteur` | FR clair 375 ; AR sombre 375 |
| `chanson-visiteur-titre` | FR clair 375 |
| `artiste` (après correction) | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 1280 |
| `artiste-page-vide`, `artiste-feuille-ajout`, `artiste-depuis-chanson` | FR clair 375 |
| `artiste-introuvable` | FR clair 375 ; AR sombre 375 |
| `feuille-ajout` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `feuille-ajout-apres` | AR sombre 375 |
| `toast-ajout` | FR clair 375 |
| `playlist-animateur` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `playlist-membre`, `playlist-edition`, `playlist-vide`, `mes-playlists` | FR clair 375 ; AR sombre 375 |
| `clubs-animateur`, `clubs-sans-club`, `club-membre`, `club-membres`, `club-reglages`, `rejoindre-changer` | FR clair 375 ; AR sombre 375 |
| `club-animateur` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `moi-membre` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `moi-moderateur`, `moi-visiteur` | FR clair 375 ; AR sombre 375 |
| `contribuer` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `contribuer-proches`, `contribuer-erreurs`, `mes-contributions` | FR clair 375 ; AR sombre 375 |
| `moderation-diff` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `moderation-file`, `moderation-signalements`, `moderation-signalement` | FR clair 375 ; AR sombre 375 |
| `signaler-visiteur`, `droits`, `connexion-verifier` | FR clair 375 ; AR sombre 375 |
| `connexion` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `introuvable` | FR clair 375 · 768 · 1280 ; FR sombre 375 ; AR clair 375 ; AR sombre 375 · 768 · 1280 |
| `chanson-introuvable`, `erreur` | FR clair 375 ; AR sombre 375 |
| `lecteur-defaut` | FR et AR, 375 · 768 · 1280 |
| `lecteur-defaut-systeme-sombre` | FR et AR, 375 (système en sombre : rendu identique au pixel près, le lecteur ne suit pas le système) |
| `lecteur-taille-1`, `lecteur-taille-6` | FR et AR, 375 (22 et 40 px) |
| `lecteur-arabe-latin` | FR et AR, 375 · 1280 (à 1280 : taille 5) |
| `lecteur-latin`, `lecteur-menu-affichage`, `lecteur-clair` | FR et AR, 375 |
| `lecteur-generation-en-cours`, `lecteur-limite-quotidienne` | FR et AR, 375 |
| `lecteur-generation-echec` | FR 375 (premier essai, échec simulé de « الأطلال ») |
| `lecteur-reessai-reussi` | AR 375 (même chanson, essai suivant réussi) |
| `lecteur-controles-masques` | FR et AR, 375 |
| `lecteur-fin`, `lecteur-playlist-vide`, `lecteur-chanson-seule` | FR et AR, 375 |
| `lecteur-focus-clavier`, `lecteur-clair-focus-clavier` | FR 375 (anneau safran sur indigo, bleu sur jasmin) |
| `lecteur-titre-rogne-zoom-navigateur-integre` | agrandissement du titre « سيدي منصور », pris dans le navigateur intégré (constat 1, avant) |
| `fix-lecteur-titre-…` (préfixe `fix-`) | après correction du constat 1 : FR et AR, 375 et 1280, AR clair 375, et `fix-lecteur-titre-avant-apres.png` (avant / après agrandis) |

Contrôle automatique sur chaque capture : `document.documentElement.scrollWidth` n'a jamais dépassé la largeur de la fenêtre. Aucun défilement horizontal, en français comme en arabe.
