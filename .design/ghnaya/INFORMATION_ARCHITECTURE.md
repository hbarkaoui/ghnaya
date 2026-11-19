# Architecture de l'information : Ghnaya (غناية)

> **Sources** :
> - le design brief `.design/ghnaya/DESIGN_BRIEF.md` ;
> - la spec produit, §4.4 (pages) ;
> - le plan 1, pour les routes déjà prévues : `/`, `/recherche`, `/chanson/[id]`, `/artiste/[id]`.
>
> **Langue** : elle est choisie par un cookie, sans préfixe dans l'URL. Chaque page a donc une seule adresse, en français, quelle que soit la langue d'affichage.

## Plan du site

Légende des rôles :
- 🔓 : visiteur sans compte
- 👤 : membre connecté
- 🎙 : animateur (rôle attribué par un admin ; il crée et anime un ou plusieurs clubs)

> **Règle des clubs** (rectification du 19/11/2026) : un membre appartient à **un seul club**. Seul l'animateur peut voir, modifier et choisir **ses** clubs, et lui seul peut en créer.
- 🛡 : modérateur

- **Accueil** `/` 🔓 👤 (onglet 1)
- **Chercher** `/recherche?q=&page=&dialecte=` 🔓 (onglet 2)
  - Chanson `/chanson/[id]` 🔓
    - Mode séance, pour cette seule chanson `/chanson/[id]/lecture` 🔓
    - Proposer une correction `/contribuer/[songId]` 👤
    - Signaler `/signaler/[songId]` 🔓
  - Artiste `/artiste/[id]?page=` 🔓
- **Clubs** `/clubs` 👤 (onglet 3) : pour 🎙, la liste de ses clubs, à choisir ; pour un membre, l'onglet « Mon club » ouvre directement son club
  - Créer un club `/clubs/nouveau` 🎙
  - Club `/clubs/[slug]` 👤 membre du club (sous-onglet Playlists)
    - Membres et invitation `/clubs/[slug]/membres` 👤 (le lien d'invitation et la gestion des rôles sont réservés à 🎙)
    - Réglages `/clubs/[slug]/reglages` 🎙 (renommer, régénérer le lien, supprimer le club)
  - Rejoindre un club `/rejoindre/[code]` 🔓 (demande de se connecter avant de rejoindre ; un membre qui a déjà un club confirme qu'il change de club)
- **Moi** `/moi` 👤 (onglet 4 ; un visiteur y voit une invitation à se connecter)
  - Mes playlists `/playlists` 👤
  - Playlist, personnelle ou de club `/playlists/[id]` 👤
  - Proposer une chanson `/contribuer` 👤
  - Mes contributions `/mes-contributions?statut=` 👤
  - Compte `/moi/compte` 👤 (nom, e-mail, langue, supprimer le compte)
  - Modération `/moderation` 🛡 (sous-onglet Propositions)
    - Une proposition `/moderation/[revisionId]` 🛡 (vue des différences, approuver ou rejeter)
    - Signalements `/moderation/signalements` 🛡
      - Un signalement `/moderation/signalements/[id]` 🛡
- **Lecteur de séance** `/lecture/[playlistId]/[position]` 👤 (plein écran, en dehors des onglets)
- **Connexion** `/connexion?retour=` 🔓
  - Vérifiez vos e-mails `/connexion/verifier` 🔓
- **Vos droits et le retrait de contenus** `/a-propos/droits` 🔓
- **Pages système** : introuvable (404, qui couvre aussi les chansons retirées) et erreur.

## Modèle de navigation

- **Navigation principale** : une barre de 4 onglets **en bas de l'écran sur mobile**.

  | Onglet (français) | Onglet (arabe) | Icône |
  |---|---|---|
  | Accueil | الرئيسية | maison |
  | Chercher | ابحث | loupe |
  | Clubs (animateur) · Mon club (membre) | النوادي · النادي | groupe |
  | Moi | حسابي | profil |

  - Chaque onglet a toujours son libellé sous l'icône.
  - Le 3e onglet s'appelle « Clubs » pour un animateur (il en a plusieurs) et « Mon club » pour un membre (il n'en a qu'un).
  - L'onglet actif est marqué par le **losange safran** au-dessus de l'icône et par un libellé de graisse 500.
  - En arabe, l'ordre s'inverse avec l'interface : Accueil se trouve à droite.
  - La barre est **masquée** dans le lecteur de séance et pendant la connexion.
- **Navigation secondaire** :
  - **sous-onglets** en haut de page, par exemple Club (*Playlists · Membres · Réglages*, ce dernier pour 🎙 seulement) ou Modération (*Propositions · Signalements*) ;
  - **liens contextuels** dans le contenu : une chanson mène à son artiste, un résultat à sa fiche ;
  - **feuille « Ajouter à une playlist »**, un panneau qui monte du bas de l'écran, ouvert depuis un résultat ou une fiche chanson.
- **Navigation utilitaire** :
  - **en-tête des pages de premier niveau** : le logo à gauche (à droite en arabe), et sur l'Accueil la bascule de langue **FR · ع**, visible par tous, y compris les visiteurs, dès le premier écran ;
  - **en-tête des pages de second niveau** : un bouton retour, puis le titre de la page ;
  - le compte, la langue et la modération sont regroupés dans **Moi**.
- **Mobile, la référence** : comme décrit ci-dessus, avec deux niveaux de profondeur au maximum sous un onglet (Clubs, puis un club, puis une playlist). Le lecteur est une couche plein écran au-dessus de la navigation.
- **768 px et plus** :
  - les 4 onglets passent dans **une barre en haut de l'écran**, à côté du logo ;
  - le contenu reste une colonne centrée d'au plus 640 px de large ;
  - aucune autre structure ne change.
- **Lecteur** : il a ses propres contrôles :
  - **en haut** : fermer ✕, le titre, la position « 3 / 12 » et la note de l'animateur, que l'on peut replier ;
  - **en bas** : précédent, A−, A+, mode d'affichage, thème, suivant.
  - Fermer le lecteur ramène à la page d'où l'on venait.

## Hiérarchie du contenu

### Accueil, membre connecté
1. **Barre de recherche** : elle reste le premier geste possible, même pour un membre.
2. **« Vos séances »** : les playlists de votre club (de vos clubs pour un animateur), de la plus récemment modifiée à la plus ancienne, avec au plus 5 cartes puis « Tout voir ». Chaque carte montre la couverture du club, le nom de la playlist, le nombre de chansons et un bouton **Lire**. C'est le parcours qui compte le plus (principe « un geste pour chanter »).
3. **« Vos playlists »** : vos playlists personnelles, au plus 3, puis « Tout voir ».
4. **État vide**, si vous n'êtes membre d'aucun club : « Rejoignez votre club », avec un rappel sur le lien d'invitation. Le bouton « Créer un club » n'apparaît que pour un animateur.

### Accueil, visiteur
1. Le logo, puis la phrase « Les paroles de vos chansons, pour chanter ensemble ».
2. La barre de recherche.
3. Une invitation : « Votre club utilise Ghnaya ? Connectez-vous pour retrouver ses playlists. »
4. La bascule de langue, dans l'en-tête.

### Chercher
1. La barre de recherche, avec le texte de la requête conservé.
2. Le nombre de résultats et le filtre de dialecte (une pastille, facultative).
3. Les résultats, 20 par page : titre arabe, titre latin, artistes, extrait des paroles. Chacun propose l'action **Ajouter à une playlist**.
4. La pagination.
5. **Aucun résultat** : un état vide avec « Proposer cette chanson », qui pré-remplit le titre.

### Chanson
1. Les titres (arabe, puis latin) et les artistes, avec leurs liens.
2. Les actions principales : **Mode séance** (bouton primaire) et **Ajouter à une playlist**.
3. Les paroles, avec la bascule du mode d'affichage.
4. Les métadonnées : dialecte, source (« Source : LRCLIB »).
5. Les actions secondaires, en bas : Proposer une correction, Signaler.

### Lecteur de séance, la vue où l'on passe 80 % du temps
1. **Les paroles**, et rien d'autre en grand : c'est la seule chose qui compte en plein chant.
2. **La position « 3 / 12 » et le titre**, pour savoir où on en est dans la séance.
3. **La note de l'animateur**, si elle existe, parce qu'elle change la façon de chanter (tonalité, couplets).
4. **Les contrôles** : ils s'escamotent d'un toucher sur les paroles et reviennent de la même façon.

### Clubs, pour un animateur
1. La liste de ses clubs (couverture, nom, nombre de membres), dans laquelle il choisit le club à gérer.
2. « Créer un club ».

### Club
1. Le nom et la couverture zellige du club, le nombre de membres et votre rôle. Pour un membre, c'est la page de l'onglet « Mon club ».
2. Les sous-onglets Playlists, Membres et Réglages.
3. **Playlists**, de la plus récemment modifiée à la plus ancienne, chacune avec **Lire**. Pour un animateur, s'y ajoute « Nouvelle playlist ».
4. Pour un animateur : « Inviter des membres », qui permet de copier ou partager le lien.

### Playlist
1. Le nom, le club ou « Personnelle », et le nombre de chansons.
2. **Lire depuis le début** (bouton primaire).
3. La liste des chansons, numérotées, avec leur note. Un toucher sur une chanson ouvre le lecteur à cette position.
4. Si vous pouvez modifier la playlist : le mode édition (↑ ↓, note, retrait), « Ajouter des chansons » (qui mène à Chercher) et « Renommer ». Pour un membre qui consulte la playlist d'un club : « Copier dans mes playlists ».

### Moi
1. Votre nom et votre club (vos clubs pour un animateur), sous forme de pastilles.
2. Mes playlists, Mes contributions (avec le nombre de propositions en attente) et Proposer une chanson.
3. Modération, avec le nombre d'éléments en file, pour 🛡 seulement.
4. Langue, Compte, Vos droits et le retrait de contenus, Se déconnecter.

### Proposer une chanson
1. Le titre (arabe et/ou latin) et les artistes.
2. **L'encadré « existe peut-être déjà »**, qui apparaît dès qu'un titre et un artiste sont saisis.
3. Les paroles, dans une grande zone de saisie de droite à gauche.
4. Le dialecte, la translittération facultative et la case des droits.
5. **Envoyer la proposition**.

### Une proposition, côté modération
1. Le type (ajout ou correction), l'auteur et l'ancienneté.
2. La vue des différences : sur une colonne en mobile, sur deux colonnes à partir de 1024 px.
3. **Approuver** et **Rejeter** ; le rejet demande une note obligatoire.
4. « Suivante », pour enchaîner.

## Parcours utilisateurs

### 1. Ouvrir la séance (le parcours principal)
1. Le membre ouvre Ghnaya, sur l'**Accueil**.
2. Il voit « Vos séances », avec en tête la playlist « Séance du jeudi ».
3. Il touche **Lire** :
   - **s'il n'est pas connecté** : il passe par `/connexion?retour=…`, puis revient au lecteur ;
   - **si la playlist est vide** : un état vide s'affiche, avec « L'animateur n'a pas encore ajouté de chansons ».
4. Le lecteur s'ouvre sur la chanson 1/12, en sombre et en 28 px, et l'écran reste allumé.
5. Le membre glisse ou touche « suivant » pour passer à la chanson 2/12, et ainsi de suite jusqu'à 12/12, où un écran de fin propose de revenir à la playlist.

### 2. Rejoindre son club par un lien
1. Le membre reçoit un lien `/rejoindre/[code]` par WhatsApp.
2. La page affiche le nom et la couverture du club, avec **Rejoindre**.
   - **S'il n'est pas connecté**, il passe par la connexion (lien magique ou Google), puis revient.
   - **Si le lien a été régénéré**, il voit « Ce lien n'est plus valide. Demandez le nouveau lien à votre animateur. »
   - **S'il fait déjà partie d'un autre club**, il voit « Vous faites partie de [A]. Rejoindre [B] vous fera quitter [A]. » Il confirme (il quitte A, ses copies personnelles restent) ou annule. Un animateur, lui, rejoint B en plus de ses clubs.
3. Il arrive sur `/clubs/[slug]`, et la confirmation « Vous avez rejoint [club] » s'affiche.
4. Les playlists du club apparaissent ensuite sur son Accueil, dans « Vos séances ».

### 3. Préparer une playlist de séance (animateur)
1. Il va dans **Clubs**, choisit son club, puis **Nouvelle playlist**, et la nomme « Séance du jeudi ».
2. Il touche **Ajouter des chansons**, ce qui ouvre Chercher avec ce contexte.
3. Il cherche « sidi mansour », puis touche **Ajouter** sur un résultat :
   - **si la chanson est déjà dans la playlist** : « Déjà dans Séance du jeudi », sans doublon ;
   - **sinon** : la confirmation « Ajoutée à Séance du jeudi » s'affiche, et la recherche reste ouverte pour continuer.
4. Il revient à la playlist et passe en mode édition : il réordonne avec ↑ ↓ et ajoute une note (« tonalité Ré »).
5. Il touche **Terminer**. La playlist apparaît dans « Vos séances » de tous les membres.

### 4. Chanter une chanson seule (visiteur)
1. Le visiteur arrive sur **Accueil**, puis tape « 3la nar » dans la recherche.
2. Il touche le résultat, ce qui ouvre la fiche **Chanson**.
3. Il touche **Mode séance**, ce qui ouvre le lecteur en 1/1, sans connexion.
4. Il veut l'ajouter à une playlist : on l'invite à se connecter, puis il revient à la fiche.

### 5. Proposer une chanson manquante
1. La recherche ne donne **aucun résultat**, et l'état vide propose **Proposer cette chanson**.
2. Si la personne n'est pas connectée, elle passe par la connexion, puis revient.
3. Elle arrive sur `/contribuer`, avec le titre pré-rempli. Elle saisit l'artiste.
   - **Si l'encadré « existe peut-être déjà » trouve des chansons proches**, elle peut ouvrir l'une d'elles (et s'arrêter là) ou continuer.
4. Elle saisit les paroles, choisit le dialecte, coche la case des droits, puis **Envoyer**.
5. Une confirmation s'affiche : « يعيشك — votre proposition sera relue ». Elle est ensuite redirigée vers **Mes contributions**, où sa proposition apparaît « En attente ».

### 6. Modérer une proposition
1. Le modérateur va dans **Moi**, puis **Modération**, qui affiche le nombre d'éléments en file.
2. Il ouvre la première proposition, la plus ancienne, et lit la vue des différences.
3. Il décide :
   - **Approuver** : la chanson est publiée ou mise à jour ;
   - **Rejeter** : il doit écrire une note, que l'auteur verra.
4. **Suivante** ouvre la proposition suivante, jusqu'à l'état vide « Plus rien à relire ».

### 7. Signaler une chanson (par exemple un ayant droit)
1. Sur la fiche **Chanson**, il touche **Signaler**.
2. Il choisit le motif (droits d'auteur, paroles erronées, doublon, spam, autre) et écrit des détails. S'il n'a pas de compte, l'e-mail est obligatoire.
3. Il envoie. La confirmation s'affiche, avec un lien vers **Vos droits et le retrait de contenus**.

## Conventions de nommage

Le principe : un mot par concept, et le même partout.

| Concept | Libellé français | Libellé arabe | Notes |
|---|---|---|---|
| Liste ordonnée de chansons | Playlist | قائمة | Le seul mot pour l'objet. On n'emploie pas « liste », « setlist » ou « programme ». |
| Moment où le club chante | Séance | جلسة | Sert uniquement de contexte : la section « Vos séances » et le bouton « Mode séance ». |
| Plein écran de lecture | Lecteur | القارئ | Le bouton qui l'ouvre s'appelle « Lire » depuis une playlist, et « Mode séance » depuis une chanson. |
| Lancer le lecteur | Lire | اقرأ | Un verbe, sur toutes les cartes et playlists. |
| Groupe de chant | Club | نادي | On n'emploie pas « groupe » ou « chorale ». |
| Responsable d'un club | Animateur | منشّط | Rôle attribué par un admin ; il crée et anime un ou plusieurs clubs. |
| Personne d'un club | Membre | عضو | |
| Texte d'une chanson | Paroles | الكلمات | |
| Écriture latine des paroles | Translittération | الحروف اللاتينية | Les modes d'affichage s'appellent « Arabe », « Arabe + latin » et « Latin ». |
| Ajout ou correction soumis | Proposition | اقتراح | Le verbe est « Proposer ». « Contribution » ne s'emploie que dans « Mes contributions ». |
| Relecture des propositions | Modération | الإشراف | |
| Personne qui relit | Modérateur | مشرف | |
| Alerte sur un contenu | Signalement | إبلاغ | Le verbe est « Signaler ». |
| Origine d'une chanson | Source | المصدر | Les valeurs sont LRCLIB, Domaine public et Proposition. |
| Variante d'arabe | Dialecte | اللهجة | |

## Composants partagés

| Composant | Utilisé sur | Variantes |
|---|---|---|
| `AppShell` (en-tête et barre d'onglets) | Toutes les pages, sauf le lecteur et la connexion | Onglets en bas sur mobile, en haut à partir de 768 px |
| `PageHeader` | Toutes les pages sous un onglet | Premier niveau : logo (et bascule de langue sur l'Accueil). Second niveau : retour et titre |
| `SubTabs` | Club, Modération | Le sous-onglet Réglages n'apparaît que pour 🎙 |
| `ReaderShell` | `/lecture/…`, `/chanson/[id]/lecture` | La chanson seule s'affiche en 1/1, sans navigation précédent / suivant |
| `SongResultItem` | Chercher, Artiste, l'encadré « existe peut-être déjà », la playlist en mode édition | Avec ou sans extrait ; actions « Ajouter » ou ↑ ↓ ✕ |
| `PlaylistCard` | Accueil (« Vos séances », « Vos playlists »), Club, Mes playlists | Avec couverture de club ou marquée « Personnelle » |
| `ClubCover` | Carte de club, en-tête du club, `/rejoindre`, `PlaylistCard` | Tailles S (40 px), M (64 px) et L (en-tête pleine largeur) |
| `AddToPlaylistSheet` | Chercher, Chanson | Liste les playlists modifiables par l'utilisateur, plus « Nouvelle playlist » |
| `EmptyState` | Accueil sans club, aucun résultat, playlist vide, file de modération vide, aucune contribution | Le motif, le titre et l'action changent selon le cas |
| `AuthGate` | Toute action réservée aux membres | Redirige vers `/connexion?retour=` |

## Croissance du contenu

- **Chansons**, des centaines de milliers après l'import : on y accède **uniquement par la recherche** et par les pages artiste. Il n'y a jamais de liste « toutes les chansons ». Les résultats sont paginés par 20.
- **Artistes** : on y accède par la recherche et par les liens des chansons. Une page artiste est paginée par 50 chansons.
- **Playlists d'un club** : elles sont triées de la plus récemment modifiée à la plus ancienne. Au-delà de 10, les plus anciennes sont regroupées dans une section repliée « Anciennes playlists ».
- **Clubs** : un membre n'en a qu'un. La liste des clubs d'un animateur reste courte, sans pagination.
- **Propositions** : « Mes contributions » se filtre par statut (`?statut=en-attente|acceptee|refusee`). La file de modération est triée de la plus ancienne à la plus récente, avec un compteur dans l'onglet Moi.
- **Signalements** : ceux qui concernent les droits d'auteur passent en tête de file, puis les autres sont triés par ancienneté.

## Stratégie d'URL

- **Forme générale** : `/section/[identifiant]/sous-page`, avec des noms de sections **en français**, quelle que soit la langue d'affichage (la langue est dans un cookie).
- **Paramètres dans le chemin** :
  - `[id]` : un UUID, pour les chansons, les artistes, les playlists, les propositions et les signalements ;
  - `[slug]` : l'identifiant lisible d'un club, tiré de son nom, avec un suffixe `-2`, `-3`… en cas de doublon ;
  - `[code]` : l'invitation, 10 caractères ;
  - `[position]` : la position dans le lecteur, numérotée à partir de 1.
- **Paramètres de requête** :
  - `q` : la requête ;
  - `page` : la pagination, à partir de 1 ;
  - `dialecte` : le filtre de dialecte (`tn`, `eg`, `lev`…) ;
  - `statut` : le filtre de Mes contributions ;
  - `retour` : la page où revenir après la connexion. Il n'accepte qu'un chemin interne commençant par `/`, pour éviter les redirections vers un site externe.
- **Lien partageable** :
  - la position du lecteur est dans l'URL, donc « ouvre la chanson 4 » peut s'envoyer par message ;
  - les filtres et la page de résultats sont aussi dans l'URL.
