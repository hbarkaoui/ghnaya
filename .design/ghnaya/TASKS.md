# Tâches de construction : Ghnaya (غناية), interface

Généré à partir de : `.design/ghnaya/DESIGN_BRIEF.md`, `INFORMATION_ARCHITECTURE.md` et `DESIGN_TOKENS.css` / `DESIGN_TOKENS.tailwind.css`.
Date : 18/11/2026

## Hypothèses de construction

- **Stack** : la même que le plan 1, c'est-à-dire Next.js (App Router), Tailwind CSS v4, next-intl en français et en arabe, et les polices chargées par `next/font/google`. Les composants construits ici sont donc directement ceux de l'app finale.
- **Données** : tant que le back-end des plans 1 à 4 n'existe pas, les écrans lisent des **données fictives typées** (`src/mocks/`), avec les mêmes types que le plan 1 : `SongHit`, `SongDetail`… Le jeu de données reprend les chansons de test du plan 1 : vrais titres, paroles inventées ou du domaine public.
- **Couleurs** : chaque composant n'utilise **que** les tokens (`bg-page`, `text-ink`, `bg-accent`…), jamais un code hexadécimal en dur, sauf dans le logo et les couvertures de club, qui utilisent les couleurs de marque.
- **Langues** : chaque tâche est terminée seulement quand l'écran fonctionne **en français et en arabe** (de droite à gauche), en **mode clair et en mode sombre**, à **375 px de large**.
- **Règle des clubs** (rectification du 19/11/2026) : un membre appartient à **un seul club**. L'animateur est un rôle attribué par un admin : lui seul crée des clubs, en anime plusieurs, et voit, modifie et choisit ses clubs. Un membre qui rejoint un autre club quitte le premier, après confirmation.
- **État existant** : aucun code. Les composants du plan 1 (`SearchBar`, `SongResultItem`, `ArtistNames`, `LyricsView`, `LocaleSwitcher`, la mise en page) ne sont pas encore écrits. Leur maquette est restylée ici, et la tâche correspondante du plan 1 reprendra ce résultat.

## Fondations

- [x] **Coque de l'app « médina contemporaine »** _(faite le 19/11/2026)_
  - **À construire** : l'`AppShell`, avec une barre de 4 onglets en bas (Accueil, Chercher, Clubs, Moi), l'onglet actif marqué par le losange safran et un libellé en graisse 500.
  - **Avec** :
    - le `PageHeader`, en deux variantes : logo et bascule FR · ع au premier niveau ; retour et titre au second niveau ;
    - l'intégration des tokens dans `globals.css` ;
    - le chargement des 4 familles de polices ;
    - le thème qui suit le système ;
    - le retournement immédiat de l'interface en arabe, onglets inversés compris.
  - **Terminé quand** quatre pages vides, une par onglet, s'enchaînent dans les deux langues et les deux thèmes.
  - **Philosophie** : « médina contemporaine », pour fixer la direction dès le début.
  - _Réutilise : `DESIGN_TOKENS.css`. Modifie : la mise en page et le `LocaleSwitcher` du plan 1. Crée : `AppShell`, `TabBar`, `PageHeader`._
- [x] **Logo Bulle zellige définitif** _(fait le 19/11/2026)_
  - **À construire** :
    - le redessin propre en SVG du symbole, sur une grille de 100 unités : étoile à 8 branches dont une pointe forme la queue de la bulle, trois lignes alignées à droite, la dernière safran ;
    - ses déclinaisons : sur fond sombre (contour jasmin), sur fond clair, logo avec le nom « غناية / Ghnaya » en Reem Kufi, icône d'app 512/192 px, favicon simplifié à deux lignes ;
    - son branchement dans `PageHeader`, `manifest.ts` et `icon.svg`.
  - **Terminé quand** le logo est net de 16 à 512 px dans les deux thèmes.
  - _Crée : `Logo` (variantes `symbol` / `lockup`), les fichiers d'icônes._

## Interface principale

- [x] **Lecteur de séance de bout en bout** (la partie la plus risquée, donc construite en premier) _(fait le 19/11/2026)_
  - **À construire** : le `ReaderShell` plein écran sur `/lecture/[playlistId]/[position]`, sombre par défaut. Il comprend :
    - en haut : fermer ✕, le titre, la position « 3 / 12 » en safran, la note de l'animateur repliable ;
    - les paroles en Noto Naskh 28 px, interligne 1,9 ;
    - en bas : précédent, A−, A+, thème, suivant, tous de 48 px ;
    - la navigation par glissement, dont le sens suit celui de l'interface (en arabe, « suivant » se fait en glissant vers la droite), avec les mêmes actions en boutons ;
    - un toucher sur les paroles qui masque ou affiche les contrôles ;
    - l'écran maintenu allumé (Wake Lock), avec une astuce si le navigateur ne le permet pas ;
    - un écran de fin après la dernière chanson ;
    - la mémorisation de la taille et du thème (localStorage, avec un repli si le stockage est indisponible).
  - **Terminé quand** une playlist fictive de 12 chansons se lit entièrement au doigt, en français et en arabe.
  - _Modifie : `LyricsView` (plan 1). Crée : `ReaderShell`, `ReaderControls`, `useWakeLock`, `useReaderPrefs`._
- [x] **Translittération dans le lecteur** _(faite le 19/11/2026)_
  - **À construire** : la bascule entre les modes « Arabe », « Arabe + latin » (une ligne latine sous chaque ligne arabe, à 72 % de la taille) et « Latin ».
  - **États à couvrir** :
    - arabe seul par défaut ;
    - génération en cours (indicateur, l'arabe reste affiché) ;
    - translittération automatique, avec la pastille « automatique, peut contenir des erreurs » ;
    - translittération relue ;
    - échec de la génération (message, arabe conservé) ;
    - limite quotidienne atteinte.
  - **Le choix est mémorisé.** Les données fictives simulent un délai de génération et un cas d'échec.
  - _Dépend de : le lecteur de séance. Crée : `TranslitToggle`, `Badge`._
- [x] **Couverture de club générée** _(faite le 19/11/2026)_
  - **À construire** : le composant `ClubCover`, qui choisit de façon déterministe l'une des 4 combinaisons `--cover-n`, l'orientation du motif khatam et l'initiale, à partir d'un hachage du nom du club.
  - **Tailles** : S (40 px), M (64 px) et L (en-tête pleine largeur).
  - **Terminé quand** le même nom donne toujours la même couverture, et que 10 noms différents donnent des couvertures variées et lisibles.
  - _Crée : `ClubCover`._
- [x] **Accueil, membre et visiteur** _(fait le 19/11/2026)_
  - **Accueil d'un membre** : la recherche ; la section « Vos séances », avec au plus 5 `PlaylistCard` (couverture, nom, nombre de chansons, bouton **Lire** qui ouvre le lecteur) puis « Tout voir » ; la section « Vos playlists » (au plus 3).
  - **Accueil d'un visiteur** : le logo, la phrase d'accroche, la recherche et l'invitation à se connecter.
  - **État vide** « Rejoignez votre club », avec le motif zellige.
  - _Rectification du 19/11/2026 (règle des clubs) : le membre de démonstration n'a plus qu'un club, un animateur de démonstration en a trois, et « Créer un club » n'apparaît dans l'état vide que pour un animateur._
  - _Dépend de : la coque de l'app et la couverture de club. Modifie : `SearchBar` (plan 1). Crée : `PlaylistCard`, `EmptyState`._
- [x] **Recherche** _(faite le 19/11/2026)_
  - **À construire** : `/recherche` avec la barre (écriture détectée automatiquement), le nombre de résultats, la pastille de filtre de dialecte, des `SongResultItem` restylés (titre arabe, titre latin, artistes, extrait avec le passage surligné, action « Ajouter »), et la pagination.
  - **États à couvrir** : requête trop courte, aucun résultat (avec « Proposer cette chanson », titre pré-rempli), chargement, limite de requêtes atteinte.
  - _Modifie : `SearchBar`, `SongResultItem`, `ArtistNames` (plan 1)._
- [x] **Fiche chanson et mode séance d'une chanson seule** _(faite le 19/11/2026)_
  - **À construire** : `/chanson/[id]` avec les titres, les artistes (avec liens), la pastille de dialecte, les actions **Mode séance** (bouton primaire) et **Ajouter à une playlist**, les paroles avec la bascule de mode, la source, puis « Proposer une correction » et « Signaler » en bas.
  - **Mode séance** : `/chanson/[id]/lecture` réutilise le lecteur en 1/1.
  - **Chanson inconnue ou retirée** : page 404 « introuvable ou retirée ».
  - _Dépend de : le lecteur. Modifie : la page chanson du plan 1._
- [ ] **Feuille « Ajouter à une playlist » et toasts**
  - **À construire** : une feuille qui monte du bas de l'écran, avec les playlists modifiables (personnelles et celles des clubs dont on est animateur) et « Nouvelle playlist » en création rapide.
  - **États à couvrir** :
    - ajout réussi, avec le toast « Ajoutée à … » ;
    - chanson déjà dans la playlist ;
    - utilisateur non connecté (redirection vers la connexion).
  - **La feuille se ferme** par un glissement vers le bas, avec la touche Échap, ou en touchant le fond. Le focus reste dans la feuille tant qu'elle est ouverte.
  - _Crée : `AddToPlaylistSheet`, `Sheet`, `Toast`._
- [ ] **Playlist, en consultation et en édition**
  - **À construire** : `/playlists/[id]` avec le nom, le club ou la mention « Personnelle », **Lire depuis le début**, et la liste numérotée avec les notes (un toucher sur une chanson ouvre le lecteur à cette position).
  - **Mode édition**, pour les playlists modifiables : ↑ / ↓, note écrite directement dans la ligne, retrait, renommage, « Ajouter des chansons » (vers la recherche avec ce contexte).
  - **Pour un membre** qui consulte la playlist d'un club : « Copier dans mes playlists ».
  - **États à couvrir** : playlist vide, chanson retirée affichée dans la liste.
  - _Réutilise : `SongResultItem`. Crée : `PlaylistRow`._
- [ ] **Clubs, club et invitation**
  - **À construire** :
    - `/clubs` : pour un animateur, la liste de ses clubs, où il choisit le club à gérer, avec « Créer un club » ; pour un membre, l'onglet devient « Mon club » (« النادي ») et ouvre directement son club, sans liste ni réglages ; pour un membre sans club, « Rejoindre avec un lien » ;
    - `/clubs/nouveau`, réservé aux animateurs ;
    - `/clubs/[slug]` : en-tête avec la grande couverture, et les sous-onglets Playlists, Membres et Réglages (ce dernier pour l'animateur) ;
    - les Membres : `Avatar` à initiales, rôles, copie et partage du lien d'invitation ;
    - les Réglages : renommer, régénérer le lien, supprimer le club en retapant son nom ;
    - `/rejoindre/[code]`, avec un lien valide, un lien invalide et un membre qui a déjà un club (confirmation « Rejoindre B vous fera quitter A »).
  - **Libellé du 3e onglet** : « Clubs » pour un animateur, « Mon club » pour un membre (la `TabBar` reçoit le rôle de l'utilisateur).
  - _Réutilise : `ClubCover`, `PlaylistCard`. Crée : `SubTabs`, `Avatar`._
- [x] **Moi** _(faite le 19/11/2026)_
  - **À construire** :
    - `/moi` : nom, pastille de son club (de ses clubs pour un animateur), Mes playlists, Mes contributions (avec le compteur des propositions en attente), Proposer une chanson, Modération (pour les modérateurs, avec compteur), Langue, Compte, Vos droits et le retrait de contenus, Se déconnecter ;
    - `/playlists` : la liste de mes playlists ;
    - `/moi/compte` : nom, e-mail, langue, suppression du compte avec confirmation ;
    - un visiteur voit à la place une invitation à se connecter.
  - _Réutilise : `PlaylistCard`._
- [ ] **Proposer une chanson et Mes contributions**
  - **À construire** : `/contribuer` et `/contribuer/[songId]`, avec :
    - le titre arabe et/ou latin, les artistes (avec autocomplétion) ;
    - l'encadré « existe peut-être déjà », avec les 3 chansons les plus proches ;
    - la zone de saisie des paroles en `dir="rtl"`, le dialecte, la translittération facultative, la case des droits ;
    - les erreurs en ligne ;
    - la confirmation « يعيشك — votre proposition sera relue ».
  - **Mes contributions** : `/mes-contributions`, avec un filtre par statut et les pastilles En attente, Acceptée et Refusée (avec la note du modérateur).
  - _Réutilise : `SongResultItem`, `Badge`. Crée : `TextField`, `LyricsTextarea`, `Select`, `Checkbox`, `FormError`._
- [ ] **Modération**
  - **À construire** :
    - `/moderation` : la file triée de la plus ancienne à la plus récente, chaque élément avec son type, son auteur et son ancienneté ;
    - `/moderation/[revisionId]` : la vue des différences ligne par ligne (une colonne en mobile), **Approuver**, et **Rejeter** qui exige une note, puis « Suivante » ;
    - `/moderation/signalements` et le détail d'un signalement : les droits d'auteur en tête, et les actions retirer, corriger ou classer.
  - **État vide** : « Plus rien à relire ».
  - _Réutilise : `SubTabs`, `Badge`, `EmptyState`. Crée : `DiffView`, `ModerationItem`._
- [ ] **Signaler et page « Vos droits »**
  - **À construire** : `/signaler/[songId]`, avec le motif, les détails et un e-mail obligatoire pour un visiteur, puis une confirmation qui renvoie vers `/a-propos/droits` (page de texte sobre).
  - _Réutilise : les composants de formulaire._
- [ ] **Connexion**
  - **À construire** : `/connexion`, avec le lien magique par e-mail et le bouton Google, puis `/connexion/verifier` (« Vérifiez vos e-mails »).
  - **`AuthGate`** : il renvoie vers `?retour=`, en n'acceptant que des chemins internes. La barre d'onglets est masquée pendant la connexion.
  - **États à couvrir** : e-mail invalide, envoi en cours, envoyé.
  - _Crée : `AuthGate`._

## Interactions et états

- [ ] **États de chargement, d'erreur et introuvable**
  - **À construire** : des squelettes de chargement pour les listes (résultats, playlists, file de modération) ; la page d'erreur qui affiche la référence `digest` ; les pages 404 générale et « chanson introuvable ou retirée » ; un toast en cas d'échec réseau.
  - **Couvre** : chargement, erreur, introuvable, page vide.
  - _Réutilise : `EmptyState`, `Toast`._
- [ ] **Transitions posées**
  - **À construire** : l'ouverture et la fermeture des feuilles, l'apparition des toasts, le passage d'une chanson à l'autre dans le lecteur (fondu de 250 ms) et l'affichage ou le masquage des contrôles du lecteur. Tout cela avec la courbe `--easing-default`, sans rebond.
  - **Couvre** : `prefers-reduced-motion`, qui coupe toutes les animations.

## Responsive et finitions

- [ ] **Adaptation aux grands écrans**
  - **À partir de 768 px** : les onglets passent dans une barre en haut à côté du logo ; le contenu est une colonne centrée de 640 px au plus ; les paroles du lecteur font 720 px de large au plus.
  - **À partir de 1024 px** : la vue des différences de la modération passe sur deux colonnes, avant / après.
  - **Points de rupture** : 375, 768 et 1024 px.
- [ ] **Vérification bilingue complète** : chaque écran est vérifié en arabe, avec :
  - la mise en page en miroir ;
  - les icônes de direction retournées (chevrons, retour, précédent / suivant) ;
  - les chiffres occidentaux (0-9) partout, puisque c'est l'usage en Tunisie ;
  - les fragments latins dans une interface arabe en `dir="ltr"` ;
  - les libellés du lexique de l'architecture de l'information, mis en face de chaque écran pour la relecture par un arabophone.
- [ ] **Vérification de l'accessibilité** : chaque point du brief est contrôlé :
  - contrastes AA (déjà garantis par les tokens, à confirmer à l'écran) ;
  - focus visible, bleu en clair et safran en sombre ;
  - `lang` et `dir` sur chaque fragment ;
  - `aria-label` bilingues sur les boutons sans texte ;
  - cibles de 48 px dans le lecteur et de 44 px ailleurs ;
  - annonce de la position « 3 / 12 » à chaque changement de chanson ;
  - navigation complète au clavier sur ordinateur ;
  - zoom à 200 % sans perte de contenu ;
  - statuts jamais signalés par la couleur seule.

## Revue

- [ ] **Revue de design** : lancer `/design-review` sur le brief, avec des captures à 375, 768 et 1280 px, en clair, en sombre, en arabe et dans le lecteur.
