# Relecture de l'arabe : Ghnaya (غناية)

> **Pour qui** : une personne arabophone, idéalement tunisienne, qui relit l'interface avant l'ouverture.
> **Quoi** : chaque libellé visible, écran par écran, en français et en arabe côte à côte, avec les termes du lexique
> repérés et les points où j'ai hésité.
> **Sources** : `messages/fr.json` et `messages/ar.json` (état du 20/11/2026, tâche 20), lexique de
> `INFORMATION_ARCHITECTURE.md` (« Conventions de nommage »), ton des textes du `DESIGN_BRIEF.md`.
> Ce document est généré à partir des fichiers de messages : chaque clé y figure une fois, sous l'écran où elle
> apparaît le plus.

## Comment relire

- **Colonne « Lexique »** : les concepts du lexique présents dans le libellé arabe. Le lexique impose un mot par
  concept, le même partout (voir le tableau ci-dessous). Si un mot vous semble mal choisi, c'est le lexique entier
  qu'il faut revoir : signalez-le une fois, on le changera partout.
- **`{name}`, `{n}`…** : des valeurs insérées au moment de l'affichage (un nom de club, un nombre). Elles ne se
  traduisent pas. `<club>…</club>`, `<person>…</person>`, `<ltr>…</ltr>` : des balises de mise en forme
  (nom isolé, gras, fragment de gauche à droite), à garder autour du même mot.
- **`{count, plural, zero {…} one {…} two {…} few {…} many {…} other {…}}`** : les formes du pluriel arabe,
  choisies selon le nombre : `zero` pour 0, `one` pour 1, `two` pour 2, `few` de 3 à 10, `many` de 11 à 99,
  `other` pour 100 et au-delà (puis selon les deux derniers chiffres : 103 → `few`, 111 → `many`).
- **« À valider par un arabophone »** : mes hésitations (formulation, registre, dialecte). Il suffit de répondre
  « OK » ou de proposer une autre formulation.

## Conventions retenues

- **Registre** : arabe standard simple. Le vouvoiement français devient le pluriel de politesse (أنتم) :
  « ابحثوا عن أغنية », « سجّلوا الدخول ». Les boutons sont le plus souvent des noms d'action, comme dans la plupart
  des interfaces arabes (« إضافة », « حفظ », « إلغاء »), sauf les verbes fixés par le lexique (« اقرأ ») et l'onglet
  « ابحث ».
- **Dialecte tunisien** : seulement aux moments chaleureux. Aujourd'hui : « يعيشك » après une proposition, la phrase
  « «غناية» تعني «أغنية» باللهجة التونسية » sur l'accueil, et les paroles elles-mêmes.
- **Chiffres** : occidentaux (0-9) partout, comme en Tunisie, y compris dans les dates (« 20 نوفمبر 2026 ») et les
  anciennetés (« قبل 3 أيام »). Les nombres passent en chaînes dans les messages, et les dates sont formatées en
  `ar-TN-u-nu-latn` : aucun navigateur ne peut afficher de chiffres arabo-indiens (٠-٩). C'est vérifié par un test.
- **Sens d'écriture** : l'interface arabe est en miroir (de droite à gauche). Les fragments latins (titres et noms
  d'artistes latins, noms de clubs et de playlists, e-mails, « Google », références d'erreur, translittération)
  restent de gauche à droite (`dir="ltr"`) ; dans l'interface française, les fragments arabes portent
  `lang="ar" dir="rtl"`.
- **Guillemets** : « » autour des noms et des titres cités (« أُضيفت إلى «جلسة الخميس» »).

## Lexique (INFORMATION_ARCHITECTURE.md)

| Concept | Français | العربية | Notes |
|---|---|---|---|
| Liste ordonnée de chansons | Playlist | قائمة | Jamais « لائحة » ni « قائمة تشغيل ». |
| Moment où le club chante | Séance | جلسة | « جلساتكم », « وضع الجلسة ». |
| Plein écran de lecture | Lecteur | القارئ | « إغلاق القارئ ». |
| Lancer le lecteur | Lire | اقرأ | Impératif singulier, comme l'onglet « ابحث ». |
| Groupe de chant | Club | نادي | « نادٍ », « النادي », « النوادي ». |
| Responsable d'un club | Animateur | منشّط | |
| Personne d'un club | Membre | عضو | Pluriel « أعضاء ». |
| Texte d'une chanson | Paroles | الكلمات | |
| Écriture latine des paroles | Translittération | الحروف اللاتينية | Modes : « عربي », « عربي + لاتيني », « لاتيني ». |
| Ajout ou correction soumis | Proposition | اقتراح | « مساهماتي » seulement pour « Mes contributions ». |
| Relecture des propositions | Modération | الإشراف | |
| Personne qui relit | Modérateur | مشرف | |
| Alerte sur un contenu | Signalement | إبلاغ | Pluriel « إبلاغات » (voir la modération). |
| Origine d'une chanson | Source | المصدر | Valeurs : LRCLIB, « ملك عام », « اقتراح ». |
| Variante d'arabe | Dialecte | اللهجة | |

Le respect du lexique est vérifié par un test (`tests/unit/i18n/lexicon.test.ts`) : synonymes écartés interdits,
clés témoins obligatoires.

## Questions générales (à valider par un arabophone)

1. **Boutons au singulier** : « ابحث », « اقرأ » (lexique) et « انضمّ » sont des impératifs singuliers, alors que
   les phrases sont au pluriel de politesse. Faut-il garder ce mélange (courant dans les interfaces), ou passer ces
   boutons au pluriel (« ابحثوا », « اقرؤوا », « انضمّوا ») ou à un nom d'action (« البحث », « القراءة »,
   « الانضمام ») ?
2. **« يعيشك »** : au singulier, comme dans le brief. Avec le vouvoiement, faut-il « يعيشكم » ?
3. **Plus de tunisien ?** Le brief prévoit « un accueil chaleureux sur l'écran d'ouverture ». L'accueil n'a pas
   encore de formule d'accueil en dialecte (par exemple « مرحبا بيكم ») : faut-il en ajouter une, et où ?
4. **« Lire » = « اقرأ »** : le bouton ouvre les paroles en plein écran pour chanter. « اقرأ » (lis) convient-il,
   ou un arabophone dirait-il plutôt « افتح » (ouvre) ou « غنِّ » (chante) ? Le lexique a fixé « اقرأ » : c'est le
   moment de le confirmer.

## Coque de l'app : en-tête, onglets, bascule de langue (toutes les pages)

Onglets en bas à 375 px, en haut à partir de 768 px ; en arabe, « الرئيسية » est à droite. Bascule « FR · ع » sur l'accueil et dans Moi. Le 3e onglet est « النوادي » pour un animateur ou un visiteur, « النادي » pour un membre.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `app.name` | Ghnaya | غناية |  |
| `app.nameAr` | غناية | غناية |  |
| `app.tagline` | Les paroles de vos chansons, pour chanter ensemble | كلمات أغانيكم، لنغنّي معًا | **Paroles** |
| `nav.label` | Navigation principale | التنقل الرئيسي |  |
| `nav.home` | Accueil | الرئيسية |  |
| `nav.search` | Chercher | ابحث |  |
| `nav.clubs` | Clubs | النوادي | **Club** |
| `nav.myClub` | Mon club | النادي | **Club** |
| `nav.me` | Moi | حسابي |  |
| `nav.back` | Retour | رجوع |  |
| `locale.label` | Langue de l'interface | لغة الواجهة |  |
| `locale.fr` | Français | Français |  |
| `locale.ar` | العربية | العربية |  |

**À valider par un arabophone**

- « حسابي » (mon compte) pour l'onglet « Moi » : le français dit « Moi » ; « حسابي » est plus courant en arabe. OK ?
- « ابحث » (impératif singulier) pour l'onglet, mais « ابحثوا عن أغنية » comme titre de la page de recherche (voir la question générale 1).

**Corrigé pendant la tâche 20**

- Bascule de langue : « FR » porte maintenant `dir="ltr"` et « ع » `dir="rtl"` (chacun dans son sens d'écriture).

## Accueil `/` (membre, animateur, membre sans club, visiteur)

Membre : « جلساتكم » (au plus 5 cartes avec « اقرأ »), « قوائمكم ». Sans club : « انضمّوا إلى ناديكم ». Visiteur : logo, phrase d'accroche en Reem Kufi, recherche, invitation à se connecter.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `home.title` | Accueil | الرئيسية |  |
| `home.meaning` | « Ghnaya » veut dire « chanson » en tunisien. | «غناية» تعني «أغنية» باللهجة التونسية. | **Dialecte** |
| `home.sessions` | Vos séances | جلساتكم | **Séance** |
| `home.playlists` | Vos playlists | قوائمكم | **Playlist** |
| `home.seeAll` | Tout voir | عرض الكل |  |
| `home.noClubTitle` | Rejoignez votre club | انضمّوا إلى ناديكم | **Club** |
| `home.noClubBody` | Demandez le lien d'invitation à l'animateur de votre club, puis ouvrez-le sur ce téléphone. | اطلبوا رابط الدعوة من منشّط ناديكم، ثم افتحوه على هذا الهاتف. | **Animateur**, **Club** |
| `home.noClubBodyAnimator` | Créez votre club, ou rejoignez-en un avec un lien d'invitation. | أنشئوا ناديكم، أو انضمّوا إلى نادٍ برابط دعوة. | **Club** |
| `home.createClub` | Créer un club | إنشاء نادٍ | **Club** |
| `home.joinClub` | Rejoindre avec un lien | الانضمام برابط |  |
| `home.visitorInviteTitle` | Votre club utilise Ghnaya ? | ناديكم يستعمل غناية؟ | **Club** |
| `home.visitorInviteBody` | Connectez-vous pour retrouver ses playlists et les lire en séance. | سجّلوا الدخول لتجدوا قوائمه وتقرؤوها في الجلسة. | **Playlist**, **Séance** |
| `home.signIn` | Se connecter | تسجيل الدخول |  |
| `playlists.personal` | Personnelle | شخصية |  |
| `playlists.songCount` | {count, plural, one {{n} chanson} other {{n} chansons}} | {count, plural, zero {لا أغاني} one {أغنية واحدة} two {أغنيتان} few {{n} أغانٍ} many {{n} أغنية} other {{n} أغنية}} |  |
| `playlists.read` | Lire | اقرأ | **Lire** |
| `playlists.readNamed` | Lire « {name} » | اقرأ «{name}» | **Lire** |

**À valider par un arabophone**

- Phrase d'accroche « كلمات أغانيكم، لنغنّي معًا » : naturelle ? Le français dit « Les paroles de vos chansons, pour chanter ensemble ».
- « ناديكم يستعمل غناية؟ » : « يستعمل » est l'usage maghrébin, « يستخدم » celui de l'arabe standard. Lequel préférer ?
- « شخصية » (Personnelle) sur une carte de playlist personnelle : accordé avec « قائمة » (féminin). OK ?

**Corrigé pendant la tâche 20**

- Un nom de playlist latin (« Séance du jeudi ») s'alignait à gauche dans la carte en arabe : il reste maintenant aligné à droite, dans son propre sens d'écriture (signalé par la tâche 12).

## Chercher `/recherche`

Barre de recherche (écriture détectée), nombre de résultats, filtre de dialecte, résultats avec « إضافة », pagination ; états : requête trop courte, aucun résultat (« اقتراح هذه الأغنية »), limite atteinte.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `search.title` | Chercher une chanson | ابحثوا عن أغنية |  |
| `search.intro` | Titre, artiste ou paroles, en arabe ou en lettres latines. | العنوان أو الفنان أو الكلمات، بالعربية أو بالحروف اللاتينية. | **Paroles**, **Translittération** |
| `search.label` | Chercher une chanson | ابحثوا عن أغنية |  |
| `search.placeholder` | Titre, artiste ou paroles… | عنوان، فنان أو كلمات… | **Paroles** |
| `search.submit` | Chercher | ابحث |  |
| `search.metaTitle` | Recherche « {query} » | البحث عن «{query}» |  |
| `search.examples` | Essayez : | جرّبوا: |  |
| `search.tooShort` | Tapez au moins 2 lettres pour lancer la recherche. | اكتبوا حرفين على الأقل لبدء البحث. |  |
| `search.results` | {count, plural, =0 {Aucun résultat} one {{n} résultat} other {{n} résultats}} | {count, plural, =0 {لا نتائج} one {نتيجة واحدة} two {نتيجتان} few {{n} نتائج} many {{n} نتيجة} other {{n} نتيجة}} |  |
| `search.loading` | Recherche en cours… | جارٍ البحث… |  |
| `search.snippetLabel` | Dans les paroles : | في الكلمات: | **Paroles** |
| `search.noResultsTitle` | Aucune chanson trouvée | لم نجد أي أغنية |  |
| `search.noResultsBody` | « {query} » n'est pas encore dans Ghnaya. Proposez-la : un modérateur la relira avant de la publier. | «{query}» غير موجودة بعد في غناية. اقترحوها وسيراجعها مشرف قبل نشرها. | **Modérateur**, **Proposition** |
| `search.propose` | Proposer cette chanson | اقتراح هذه الأغنية | **Proposition** |
| `search.noResultsDialectTitle` | Aucune chanson dans ce dialecte | لا توجد أغنية بهذه اللهجة | **Dialecte** |
| `search.noResultsDialectBody` | Aucun résultat pour « {query} » avec le filtre « {dialect} ». | لا نتائج لـ«{query}» مع تصفية «{dialect}». |  |
| `search.allDialects` | Chercher dans tous les dialectes | البحث في كل اللهجات | **Dialecte** |
| `search.emptyPageTitle` | Plus de résultats sur cette page | لا نتائج في هذه الصفحة |  |
| `search.emptyPageBody` | Les résultats de cette recherche tiennent sur moins de pages. | نتائج هذا البحث موزّعة على صفحات أقل. |  |
| `search.firstPage` | Revenir à la première page | العودة إلى الصفحة الأولى |  |
| `search.rateLimitedTitle` | Trop de recherches d'un coup | عمليات بحث كثيرة في وقت قصير |  |
| `search.rateLimitedBody` | Pour protéger Ghnaya, le nombre de recherches est limité. Réessayez dans une minute. | لحماية غناية، عدد عمليات البحث محدود. أعيدوا المحاولة بعد دقيقة. |  |
| `search.dialect.button` | Dialecte | اللهجة | **Dialecte** |
| `search.dialect.current` | Filtre de dialecte : | تصفية اللهجة: | **Dialecte** |
| `search.dialect.all` | Tous les dialectes | كل اللهجات | **Dialecte** |
| `search.dialect.clear` | Retirer le filtre « {dialect} » | إزالة تصفية «{dialect}» |  |
| `addToPlaylist.buttonShort` | Ajouter | إضافة |  |
| `addToPlaylist.buttonNamed` | Ajouter « {title} » à une playlist | إضافة «{title}» إلى قائمة | **Playlist** |
| `dialects.tn` | Tunisien | تونسي |  |
| `dialects.eg` | Égyptien | مصري |  |
| `dialects.lev` | Levantin | شامي |  |
| `dialects.gulf` | Golfe | خليجي |  |
| `dialects.maghreb_other` | Maghreb | مغاربي |  |
| `dialects.msa` | Arabe littéral | فصحى |  |
| `dialects.other` | Autre | أخرى |  |
| `pagination.label` | Pages de résultats | صفحات النتائج |  |
| `pagination.previous` | Précédent | السابق |  |
| `pagination.next` | Suivant | التالي |  |
| `pagination.position` | Page {current} sur {total} | الصفحة {current} من {total} |  |

**À valider par un arabophone**

- « تصفية اللهجة » pour « Filtre de dialecte » : « تصفية » est-il compris, ou faut-il « فلتر » ?
- Noms des dialectes : « مغاربي » pour « Maghreb (hors Tunisie) », « فصحى » pour « Arabe littéral », « شامي » pour « Levantin ». OK ?
- « «{query}» غير موجودة بعد في غناية » : accord au féminin (la chanson). OK ?

## Feuille « Ajouter à une playlist » et toasts

Feuille qui monte du bas (✕ à gauche en arabe), playlists modifiables, « قائمة جديدة » ; toasts « أُضيفت إلى «…» », « موجودة مسبقًا في «…» ».

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `addToPlaylist.button` | Ajouter à une playlist | إضافة إلى قائمة | **Playlist** |
| `addToPlaylist.title` | Ajouter à une playlist | إضافة إلى قائمة | **Playlist** |
| `addToPlaylist.close` | Fermer | إغلاق |  |
| `addToPlaylist.listLabel` | Playlists que vous pouvez modifier | القوائم التي يمكنكم تعديلها | **Playlist** |
| `addToPlaylist.alreadyIn` | Déjà ajoutée | مضافة مسبقًا |  |
| `addToPlaylist.adding` | Ajout en cours… | جارٍ الإضافة… |  |
| `addToPlaylist.newPlaylist` | Nouvelle playlist | قائمة جديدة | **Playlist** |
| `addToPlaylist.empty` | Vous n'avez pas encore de playlist. Créez-en une pour y ranger cette chanson. | ليست لديكم قائمة بعد. أنشئوا قائمة لتحفظوا فيها هذه الأغنية. | **Playlist** |
| `addToPlaylist.nameLabel` | Nom de la playlist | اسم القائمة | **Playlist** |
| `addToPlaylist.namePlaceholder` | Par exemple : Séance du jeudi | مثلًا: جلسة الخميس | **Séance** |
| `addToPlaylist.destinationLabel` | Ranger dans | الحفظ في |  |
| `addToPlaylist.destinationPersonal` | Mes playlists personnelles | قوائمي الشخصية | **Playlist** |
| `addToPlaylist.create` | Créer et ajouter | إنشاء وإضافة |  |
| `addToPlaylist.creating` | Création en cours… | جارٍ الإنشاء… |  |
| `addToPlaylist.cancel` | Annuler | إلغاء |  |
| `addToPlaylist.errors.empty` | Donnez un nom à la playlist. | أعطوا القائمة اسمًا. | **Playlist** |
| `addToPlaylist.errors.tooLong` | Le nom ne doit pas dépasser {max} caractères. | يجب ألّا يتجاوز الاسم {max} حرفًا. |  |
| `addToPlaylist.toast.added` | Ajoutée à « {name} » | أُضيفت إلى «{name}» |  |
| `addToPlaylist.toast.addedToNew` | Ajoutée à la nouvelle playlist « {name} » | أُضيفت إلى القائمة الجديدة «{name}» | **Playlist** |
| `addToPlaylist.toast.duplicate` | Déjà dans « {name} » | موجودة مسبقًا في «{name}» |  |
| `addToPlaylist.toast.failed` | L'ajout n'a pas pu être enregistré. Réessayez. | تعذّرت الإضافة. أعيدوا المحاولة. |  |

**À valider par un arabophone**

- « الحفظ في » pour « Ranger dans » (choix du club ou des playlists personnelles) : OK ?
- « مضافة مسبقًا » / « موجودة مسبقًا في «…» » : « مسبقًا » ou « من قبل » ?

## Chanson `/chanson/[id]` (et 404 « introuvable ou retirée »)

Titres arabe puis latin, artistes, pastille de dialecte, « وضع الجلسة », « إضافة إلى قائمة », paroles avec la bascule « عربي / عربي + لاتيني / لاتيني », source, « اقتراح تصحيح » et « إبلاغ » en bas.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `lyrics.modeLabel` | Affichage des paroles | عرض الكلمات | **Paroles** |
| `lyrics.modes.ar` | Arabe | عربي |  |
| `lyrics.modes.both` | Arabe + latin | عربي + لاتيني |  |
| `lyrics.modes.latin` | Latin | لاتيني |  |
| `lyrics.translit.generating` | Translittération en cours… | جارٍ إعداد الحروف اللاتينية… | **Translittération** |
| `lyrics.translit.auto` | Translittération automatique, peut contenir des erreurs | الحروف اللاتينية آلية، قد تحتوي على أخطاء | **Translittération** |
| `lyrics.translit.reviewed` | Translittération relue | الحروف اللاتينية مُراجَعة | **Translittération** |
| `lyrics.translit.failed` | La translittération n'a pas pu être générée. Les paroles arabes restent affichées. | تعذّر إعداد الحروف اللاتينية. تبقى الكلمات العربية معروضة. | **Paroles**, **Translittération** |
| `lyrics.translit.retry` | Réessayer | أعيدوا المحاولة |  |
| `lyrics.translit.limit` | Translittération indisponible aujourd'hui : la limite quotidienne est atteinte. Les paroles arabes restent affichées. | الحروف اللاتينية غير متاحة اليوم: تمّ بلوغ الحدّ اليومي. تبقى الكلمات العربية معروضة. | **Paroles**, **Translittération** |
| `lyrics.title` | Paroles | الكلمات | **Paroles** |
| `song.with` | avec | مع |  |
| `song.dialectLabel` | Dialecte : | اللهجة: | **Dialecte** |
| `song.sessionMode` | Mode séance | وضع الجلسة | **Séance** |
| `song.sourceLabel` | Source : | المصدر: | **Source** |
| `song.sources.lrclib` | LRCLIB | LRCLIB |  |
| `song.sources.public_domain` | Domaine public | ملك عام |  |
| `song.sources.contribution` | Proposition | اقتراح | **Proposition** |
| `song.suggestCorrection` | Proposer une correction | اقتراح تصحيح | **Proposition** |
| `song.report` | Signaler | إبلاغ | **Signalement** |
| `song.notFoundTitle` | Cette chanson est introuvable ou a été retirée | هذه الأغنية غير موجودة أو تمّ سحبها |  |
| `song.notFoundBody` | Le lien est peut-être incorrect, ou la chanson a été retirée de Ghnaya, par exemple à la demande de ses ayants droit. | ربما الرابط غير صحيح، أو سُحبت الأغنية من غناية، مثلًا بطلب من أصحاب حقوقها. |  |
| `song.notFoundAction` | Chercher une chanson | ابحثوا عن أغنية |  |
| `song.notFoundMeta` | Chanson introuvable | أغنية غير موجودة |  |

**À valider par un arabophone**

- Pastille de translittération « الحروف اللاتينية آلية، قد تحتوي على أخطاء » : un peu raide ? Variante : « حروف لاتينية آلية، قد تحتوي على أخطاء ».
- « إبلاغ » (nom) comme bouton « Signaler », à côté de « اقتراح تصحيح » : cohérent avec le lexique. OK ?
- « ملك عام » pour « Domaine public » : terme juridique attendu en Tunisie ?

**Corrigé pendant la tâche 20**

- Translittération : « الكتابة اللاتينية » remplacé par « الحروف اللاتينية » (lexique) dans les cinq messages d'état de la translittération.

## Artiste `/artiste/[id]` (et 404 « introuvable ») — ajoutée le 21/11/2026, après la revue de design

Les noms arabe puis latin, le nombre de chansons, « الأغاني », puis les chansons, avec « إضافة » sur chacune et 50 chansons par page.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `artist.metaNotFound` | Artiste introuvable | فنان غير موجود |  |
| `artist.songsTitle` | Chansons | الأغاني |  |
| `artist.songCount` | {count, plural, one {{n} chanson} other {{n} chansons}} | {count, plural, zero {لا أغاني} one {أغنية واحدة} two {أغنيتان} few {{n} أغانٍ} many {{n} أغنية} other {{n} أغنية}} |  |
| `artist.notFoundTitle` | Cet artiste est introuvable | هذا الفنان غير موجود |  |
| `artist.notFoundBody` | Le lien est peut-être incorrect, ou aucune chanson de cet artiste n'est publiée sur Ghnaya. | ربما الرابط غير صحيح، أو لا توجد أي أغنية منشورة لهذا الفنان في غناية. |  |
| `artist.emptyPageTitle` | Plus de chansons sur cette page | لا أغاني في هذه الصفحة |  |
| `artist.emptyPageBody` | Les chansons de cet artiste tiennent sur moins de pages. | أغاني هذا الفنان موزّعة على صفحات أقل. |  |
| `artist.firstPage` | Revenir à la première page | العودة إلى الصفحة الأولى |  |

**À valider par un arabophone**

- « فنان » pour « artiste », comme dans le champ de recherche (« عنوان، فنان أو كلمات ») : convient aussi pour un groupe ou un poète (Chebbi) ?
- Pluriel de `artist.songCount` : mêmes formes que `playlists.songCount`, déjà à relire plus haut.

## Lecteur de séance `/lecture/[playlistId]/[position]` et `/chanson/[id]/lecture`

Plein écran, sombre. En haut : ✕ (à droite en arabe), titre, position « 3 / 12 » (toujours en chiffres occidentaux, de gauche à droite), note de l'animateur. En bas : précédent (à droite en arabe), A−, mode d'affichage, thème, A+, suivant (à gauche). Écran de fin après la dernière chanson. Les libellés des boutons à icône seule sont lus par les lecteurs d'écran.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `reader.close` | Fermer le lecteur | إغلاق القارئ | **Lecteur** |
| `reader.previous` | Chanson précédente | الأغنية السابقة |  |
| `reader.next` | Chanson suivante | الأغنية التالية |  |
| `reader.smaller` | Réduire le texte | تصغير النص |  |
| `reader.larger` | Agrandir le texte | تكبير النص |  |
| `reader.themeToLight` | Passer en mode clair | التبديل إلى الوضع الفاتح |  |
| `reader.themeToDark` | Passer en mode sombre | التبديل إلى الوضع الداكن |  |
| `reader.position` | {current} / {total} | {current} / {total} |  |
| `reader.showNote` | Afficher la note de l'animateur | عرض ملاحظة المنشّط | **Animateur** |
| `reader.hideNote` | Masquer la note de l'animateur | إخفاء ملاحظة المنشّط | **Animateur** |
| `reader.noteLabel` | Note de l'animateur | ملاحظة المنشّط | **Animateur** |
| `reader.announce` | Chanson {current} sur {total} : &lt;song&gt;{title}&lt;/song&gt; | الأغنية {current} من {total}: &lt;song&gt;{title}&lt;/song&gt; |  |
| `reader.endTitle` | Fin de la séance | انتهت الجلسة | **Séance** |
| `reader.endBody` | {count, plural, one {Vous avez chanté la chanson de « {name} ».} other {Vous avez chanté les {n} chansons de « {name} ».}} | {count, plural, one {غنّيتم أغنية «{name}» الوحيدة.} two {غنّيتم الأغنيتين من «{name}».} few {غنّيتم {n} أغانٍ من «{name}».} many {غنّيتم {n} أغنية من «{name}».} other {غنّيتم {n} أغنية من «{name}».}} |  |
| `reader.restart` | Reprendre au début | العودة إلى البداية |  |
| `reader.wakeHint` | Votre navigateur ne peut pas garder l'écran allumé. Pendant la séance, désactivez la mise en veille automatique dans les réglages du téléphone. | لا يستطيع متصفحكم إبقاء الشاشة مضاءة. خلال الجلسة، أوقفوا القفل التلقائي من إعدادات الهاتف. | **Séance** |
| `reader.wakeHintDismiss` | Compris | فهمت |  |
| `reader.controls` | Contrôles du lecteur | أزرار القارئ | **Lecteur** |

Écran de fin, rendu selon le nombre de chansons : 1 → « غنّيتم أغنية «…» الوحيدة. », 2 → « غنّيتم الأغنيتين من «…». », 5 → « غنّيتم 5 أغانٍ من «…». », 12 → « غنّيتم 12 أغنية من «…». »

**À valider par un arabophone**

- Écran de fin, formes pour 1 et 2 chansons (nouvelles) : naturelles ?
- « فهمت » (Compris) pour fermer l'astuce de l'écran allumé : première personne du singulier, comme en français. OK ?
- « تصغير النص » / « تكبير النص » (A− / A+) : OK ?

**Corrigé pendant la tâche 20**

- Écran de fin : « غنّيتم {total} أغنية » donnait « 5 أغنية » ; le message suit maintenant les formes du pluriel (« 5 أغانٍ », « 12 أغنية »). En français, « les 1 chansons » devient « la chanson ».
- Boutons de thème : « الوضع الفاتح » / « الوضع الداكن » décrivaient un état ; ils disent maintenant l'action, comme en français (« التبديل إلى الوضع الفاتح »).
- Titre de la chanson (en haut et dans l'annonce « الأغنية 3 من 12: … ») balisé selon son écriture (`lang="ar"` pour un titre arabe dans l'interface française).

## Playlist `/playlists/[id]` (consultation, édition, vide, 404)

Nom, club ou « شخصية », nombre de chansons, « اقرأ من البداية », liste numérotée avec notes ; édition : ↑ ↓ ✕ (en miroir), note dans la ligne, « إضافة أغانٍ », « إنهاء » ; chanson retirée « أغنية مسحوبة » ; « نسخ إلى قوائمي » pour un membre.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `playlistPage.metaNotFound` | Playlist introuvable | قائمة غير موجودة | **Playlist** |
| `playlistPage.readFromStart` | Lire depuis le début | اقرأ من البداية | **Lire** |
| `playlistPage.edit` | Modifier | تعديل |  |
| `playlistPage.copy` | Copier dans mes playlists | نسخ إلى قوائمي | **Playlist** |
| `playlistPage.copying` | Copie en cours… | جارٍ النسخ… |  |
| `playlistPage.copied` | Copiée dans vos playlists. | نُسخت القائمة إلى قوائمكم. | **Playlist** |
| `playlistPage.openCopy` | Ouvrir la copie | فتح النسخة |  |
| `playlistPage.copyFailed` | La copie n'a pas pu être faite. Réessayez. | تعذّر النسخ. أعيدوا المحاولة. |  |
| `playlistPage.songsTitle` | Chansons | الأغاني |  |
| `playlistPage.noteLabel` | Note : | ملاحظة: |  |
| `playlistPage.removed` | Chanson retirée | أغنية مسحوبة |  |
| `playlistPage.removedLabel` | Chanson retirée, non lisible | أغنية مسحوبة، لا يمكن قراءتها |  |
| `playlistPage.emptyTitle` | L'animateur n'a pas encore ajouté de chansons | لم يُضف المنشّط أغاني بعد | **Animateur** |
| `playlistPage.emptyBody` | Revenez avant la séance : les chansons apparaîtront ici dès que la playlist sera prête. | عودوا قبل الجلسة: ستظهر الأغاني هنا حين تصبح القائمة جاهزة. | **Playlist**, **Séance** |
| `playlistPage.emptyEditableTitle` | Cette playlist est vide | هذه القائمة فارغة | **Playlist** |
| `playlistPage.emptyEditableBody` | Ajoutez des chansons depuis la recherche, puis placez-les dans l'ordre de votre choix. | أضيفوا أغاني من البحث، ثم رتّبوها كما تريدون. |  |
| `playlistPage.addSongs` | Ajouter des chansons | إضافة أغانٍ |  |
| `playlistPage.backToPlaylist` | Revenir à la playlist | العودة إلى القائمة | **Playlist** |
| `playlistPage.notFoundTitle` | Cette playlist est introuvable | هذه القائمة غير موجودة | **Playlist** |
| `playlistPage.notFoundBody` | Le lien est peut-être incorrect, ou la playlist appartient à un club dont vous n'êtes pas membre. | ربما الرابط غير صحيح، أو القائمة تابعة لنادٍ لستم أعضاء فيه. | **Club**, **Membre**, **Playlist** |
| `playlistPage.notFoundAction` | Revenir à l'accueil | العودة إلى الرئيسية |  |
| `playlistPage.editor.title` | Modifier la playlist | تعديل القائمة | **Playlist** |
| `playlistPage.editor.hint` | Vos modifications sont enregistrées au fur et à mesure. | تُحفظ تعديلاتكم أولًا بأول. |  |
| `playlistPage.editor.nameLabel` | Nom de la playlist | اسم القائمة | **Playlist** |
| `playlistPage.editor.nameEmpty` | Donnez un nom à la playlist. | أعطوا القائمة اسمًا. | **Playlist** |
| `playlistPage.editor.renamed` | Playlist renommée « {name} ». | أصبح اسم القائمة «{name}». | **Playlist** |
| `playlistPage.editor.done` | Terminer | إنهاء |  |
| `playlistPage.editor.moveUp` | Monter « {title} » | رفع «{title}» |  |
| `playlistPage.editor.moveDown` | Descendre « {title} » | إنزال «{title}» |  |
| `playlistPage.editor.remove` | Retirer « {title} » de la playlist | إزالة «{title}» من القائمة | **Playlist** |
| `playlistPage.editor.noteFor` | Note pour « {title} » | ملاحظة لـ«{title}» |  |
| `playlistPage.editor.notePlaceholder` | Note : tonalité, couplets… | ملاحظة: المقام، المقاطع… |  |
| `playlistPage.editor.noteSaved` | Note enregistrée pour « {title} ». | حُفظت الملاحظة لـ«{title}». |  |
| `playlistPage.editor.moved` | « {title} » est maintenant en position {position} sur {total}. | «{title}» الآن في المرتبة {position} من {total}. |  |
| `playlistPage.editor.removedRow` | « {title} » retirée de la playlist. | أُزيلت «{title}» من القائمة. | **Playlist** |
| `playlistPage.editor.undo` | Annuler | تراجع |  |
| `playlistPage.editor.restored` | « {title} » remise dans la playlist. | أُعيدت «{title}» إلى القائمة. | **Playlist** |

**À valider par un arabophone**

- Texte indicatif de la note « ملاحظة: المقام، المقاطع… » : « المقام » pour « tonalité » est un choix musical (maqâm) plutôt qu'une traduction littérale (« الطبقة »). OK pour un club de chant tunisien ?
- « رفع «…» » / « إنزال «…» » pour monter / descendre une chanson dans la liste : OK ?
- « تُحفظ تعديلاتكم أولًا بأول » : OK ?

## Mes playlists `/playlists`

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `myPlaylists.title` | Mes playlists | قوائمي | **Playlist** |
| `myPlaylists.intro` | Vos playlists personnelles. Elles ne sont visibles que par vous. | قوائمكم الشخصية. لا يراها أحد غيركم. | **Playlist** |
| `myPlaylists.emptyTitle` | Pas encore de playlist personnelle | لا توجد قائمة شخصية بعد | **Playlist** |
| `myPlaylists.emptyBody` | Depuis une chanson, touchez « Ajouter à une playlist » pour créer la vôtre, ou copiez une playlist de votre club. | من صفحة أغنية، اضغطوا على «إضافة إلى قائمة» لإنشاء قائمتكم، أو انسخوا قائمة من ناديكم. | **Club**, **Playlist** |
| `myPlaylists.emptyAction` | Chercher une chanson | ابحثوا عن أغنية |  |
| `myPlaylists.visitorBody` | Connectez-vous pour retrouver vos playlists. | سجّلوا الدخول لتجدوا قوائمكم. | **Playlist** |

**Corrigé pendant la tâche 20**

- « المسوا «إضافة إلى قائمة» » remplacé par « اضغطوا على «إضافة إلى قائمة» », le verbe employé partout ailleurs.

## Clubs `/clubs` et Créer un club `/clubs/nouveau`

Animateur : liste de ses clubs (chevron vers la gauche en arabe) et « إنشاء نادٍ ». Membre sans club : « انضمّوا إلى ناديكم » et le champ du lien. Visiteur : invitation à se connecter.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `clubs.title` | Vos clubs | نواديكم | **Club** |
| `clubs.create` | Créer un club | إنشاء نادٍ | **Club** |
| `clubs.memberCount` | {count, plural, one {{n} membre} other {{n} membres}} | {count, plural, zero {لا أعضاء} one {عضو واحد} two {عضوان} few {{n} أعضاء} many {{n} عضوًا} other {{n} عضو}} | **Membre** |
| `clubs.roles.animator` | Animateur | منشّط | **Animateur** |
| `clubs.roles.member` | Membre | عضو | **Membre** |
| `clubs.open` | Ouvrir {name} | فتح {name} |  |
| `clubs.emptyAnimatorTitle` | Créez votre premier club | أنشئوا ناديكم الأول | **Club** |
| `clubs.emptyAnimatorBody` | Un club réunit vos membres autour des playlists de séance. Vous les inviterez ensuite avec un lien. | يجمع النادي أعضاءه حول قوائم الجلسات. بعد ذلك تدعونهم برابط. | **Club**, **Membre**, **Playlist**, **Séance** |
| `clubs.visitorTitle` | Retrouvez votre club | اعثروا على ناديكم | **Club** |
| `clubs.visitorBody` | Connectez-vous pour voir les playlists de votre club et les lire en séance. | سجّلوا الدخول لتروا قوائم ناديكم وتقرؤوها في الجلسة. | **Club**, **Playlist**, **Séance** |
| `clubs.signIn` | Se connecter | تسجيل الدخول |  |
| `clubs.noClub.title` | Rejoignez votre club | انضمّوا إلى ناديكم | **Club** |
| `clubs.noClub.body` | Pour rejoindre un club, il faut le lien d'invitation que partage son animateur, souvent par WhatsApp. Ouvrez ce lien sur ce téléphone, ou collez-le ici. | للانضمام إلى نادٍ، تحتاجون إلى رابط الدعوة الذي يشاركه منشّطه، غالبًا عبر واتساب. افتحوا الرابط على هذا الهاتف، أو الصقوه هنا. | **Animateur**, **Club** |
| `clubs.noClub.label` | Lien ou code d'invitation | رابط الدعوة أو رمزها |  |
| `clubs.noClub.submit` | Rejoindre avec un lien | الانضمام برابط |  |
| `clubs.noClub.invalid` | Ce texte ne contient pas de lien d'invitation. Copiez le lien entier reçu de votre animateur. | هذا النص لا يحتوي على رابط دعوة. انسخوا الرابط كاملًا كما وصلكم من المنشّط. | **Animateur** |
| `clubs.new.title` | Créer un club | إنشاء نادٍ | **Club** |
| `clubs.new.nameLabel` | Nom du club | اسم النادي | **Club** |
| `clubs.new.nameHint` | Par exemple « Les Jasmins ». Vous pourrez le changer ensuite dans les réglages. | مثلًا «الياسمين». يمكنكم تغييره لاحقًا من الإعدادات. |  |
| `clubs.new.submit` | Créer le club | إنشاء النادي | **Club** |
| `clubs.new.forbiddenTitle` | Seul un animateur peut créer un club | إنشاء النوادي خاص بالمنشّطين | **Animateur**, **Club** |
| `clubs.new.forbiddenBody` | Le rôle d'animateur est attribué par l'équipe de Ghnaya. Pour rejoindre un club, demandez le lien d'invitation à son animateur. | يمنح فريق غناية دور المنشّط. للانضمام إلى نادٍ، اطلبوا رابط الدعوة من منشّطه. | **Animateur**, **Club** |
| `clubs.new.backToClub` | Revenir à mon club | العودة إلى ناديكم | **Club** |
| `clubs.errors.required` | Indiquez un nom. | اكتبوا اسمًا. |  |
| `clubs.errors.tooLong` | Le nom ne doit pas dépasser {max} caractères. | يجب ألا يتجاوز الاسم {max} حرفًا. |  |

**À valider par un arabophone**

- « واتساب » écrit en arabe dans le texte d'invitation : OK, ou garder « WhatsApp » ?
- « يمنح فريق غناية دور المنشّط » : OK ?

## Club `/clubs/[slug]` : Playlists, Membres, Réglages

Grande couverture (médaillon à droite en arabe), nom, nombre de membres, rôle, sous-onglets « القوائم · الأعضاء · الإعدادات ». Membres : lien d'invitation (de gauche à droite), liste avec avatars. Réglages : renommer, nouveau lien, suppression en retapant le nom.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `clubs.yourRole` | Votre rôle : | دوركم: |  |
| `clubs.you` | vous | أنتم |  |
| `clubs.status.created` | &lt;club&gt;{name}&lt;/club&gt; est créé. Invitez vos membres depuis l'onglet Membres. | تم إنشاء &lt;club&gt;{name}&lt;/club&gt;. ادعوا أعضاءكم من قسم الأعضاء. | **Membre** |
| `clubs.status.joined` | Vous avez rejoint &lt;club&gt;{name}&lt;/club&gt;. | انضممتم إلى &lt;club&gt;{name}&lt;/club&gt;. |  |
| `clubs.status.deleted` | Le club a été supprimé. | تم حذف النادي. | **Club** |
| `clubs.tabs.label` | Sections du club | أقسام النادي | **Club** |
| `clubs.tabs.playlists` | Playlists | القوائم | **Playlist** |
| `clubs.tabs.members` | Membres | الأعضاء | **Membre** |
| `clubs.tabs.settings` | Réglages | الإعدادات |  |
| `clubs.playlists.new` | Nouvelle playlist | قائمة جديدة | **Playlist** |
| `clubs.playlists.nameLabel` | Nom de la playlist | اسم القائمة | **Playlist** |
| `clubs.playlists.create` | Créer | إنشاء |  |
| `clubs.playlists.cancel` | Annuler | إلغاء |  |
| `clubs.playlists.created` | Playlist « {name} » créée. Ouvrez-la pour ajouter des chansons. | تم إنشاء القائمة «{name}». افتحوها لإضافة الأغاني. | **Playlist** |
| `clubs.playlists.emptyTitle` | Aucune playlist pour l'instant | لا توجد قوائم بعد | **Playlist** |
| `clubs.playlists.emptyBodyAnimator` | Préparez la playlist de votre prochaine séance : vos membres la retrouveront sur leur accueil. | حضّروا قائمة جلستكم القادمة: سيجدها أعضاؤكم في صفحتهم الرئيسية. | **Playlist**, **Séance** |
| `clubs.playlists.emptyBodyMember` | L'animateur n'a pas encore préparé de playlist. Elle apparaîtra ici et sur votre accueil. | لم يحضّر المنشّط أي قائمة بعد. ستظهر هنا وفي صفحتكم الرئيسية. | **Animateur**, **Playlist** |
| `clubs.playlists.older` | Anciennes playlists ({n}) | قوائم أقدم ({n}) | **Playlist** |
| `clubs.members.title` | Membres | الأعضاء | **Membre** |
| `clubs.members.inviteTitle` | Inviter des membres | دعوة أعضاء | **Membre** |
| `clubs.members.inviteBody` | Envoyez ce lien à vos membres, par exemple sur WhatsApp : il suffit de l'ouvrir pour rejoindre &lt;club&gt;{name}&lt;/club&gt;. | أرسلوا هذا الرابط إلى أعضائكم، عبر واتساب مثلًا: يكفي فتحه للانضمام إلى &lt;club&gt;{name}&lt;/club&gt;. |  |
| `clubs.members.linkLabel` | Lien d'invitation | رابط الدعوة |  |
| `clubs.members.copy` | Copier le lien | نسخ الرابط |  |
| `clubs.members.copied` | Lien copié | تم نسخ الرابط |  |
| `clubs.members.copyFailed` | La copie n'a pas fonctionné : sélectionnez le lien et copiez-le à la main. | لم ينجح النسخ: حدّدوا الرابط وانسخوه يدويًا. |  |
| `clubs.members.share` | Partager | مشاركة |  |
| `clubs.members.shareText` | Rejoignez {name} sur Ghnaya pour chanter ensemble : | انضمّوا إلى {name} على غناية لنغنّي معًا: |  |
| `clubs.members.count` | {count, plural, one {{n} membre} other {{n} membres}} | {count, plural, zero {لا أعضاء} one {عضو واحد} two {عضوان} few {{n} أعضاء} many {{n} عضوًا} other {{n} عضو}} | **Membre** |
| `clubs.members.promote` | Donner le rôle d'animateur | منح دور المنشّط | **Animateur** |
| `clubs.members.promoteNamed` | Donner le rôle d'animateur à {name} | منح دور المنشّط إلى {name} | **Animateur** |
| `clubs.members.promoteConfirm` | &lt;person&gt;{name}&lt;/person&gt; pourra gérer les playlists, les membres et les réglages de &lt;club&gt;{clubName}&lt;/club&gt;. | سيتمكّن &lt;person&gt;{name}&lt;/person&gt; من إدارة قوائم &lt;club&gt;{clubName}&lt;/club&gt; وأعضائه وإعداداته. | **Playlist** |
| `clubs.members.confirm` | Confirmer | تأكيد |  |
| `clubs.members.cancel` | Annuler | إلغاء |  |
| `clubs.members.promoted` | &lt;person&gt;{name}&lt;/person&gt; a maintenant le rôle d'animateur. | تم منح دور المنشّط إلى &lt;person&gt;{name}&lt;/person&gt;. | **Animateur** |
| `clubs.settings.title` | Réglages | الإعدادات |  |
| `clubs.settings.renameTitle` | Nom du club | اسم النادي | **Club** |
| `clubs.settings.save` | Enregistrer | حفظ |  |
| `clubs.settings.saved` | Nom enregistré. | تم حفظ الاسم. |  |
| `clubs.settings.inviteTitle` | Lien d'invitation | رابط الدعوة |  |
| `clubs.settings.inviteBody` | Si le lien a circulé au-delà de votre club, créez-en un nouveau : l'ancien ne fonctionnera plus. | إذا انتشر الرابط خارج ناديكم، أنشئوا رابطًا جديدًا: لن يعمل الرابط القديم بعد ذلك. | **Club** |
| `clubs.settings.regenerate` | Créer un nouveau lien | إنشاء رابط جديد |  |
| `clubs.settings.regenerateConfirm` | L'ancien lien ne fonctionnera plus. Les membres actuels restent dans le club. | لن يعمل الرابط القديم بعد الآن. يبقى الأعضاء الحاليون في النادي. | **Club**, **Membre** |
| `clubs.settings.regenerated` | Nouveau lien créé. Partagez-le depuis l'onglet Membres. | تم إنشاء رابط جديد. شاركوه من قسم الأعضاء. | **Membre** |
| `clubs.settings.deleteTitle` | Supprimer le club | حذف النادي | **Club** |
| `clubs.settings.deleteBody` | Les playlists du club seront supprimées pour tous ses membres. Les copies personnelles qu'ils en ont faites sont conservées. Cette action est définitive. | ستُحذف قوائم النادي لدى جميع أعضائه، وتبقى نسخهم الشخصية منها محفوظة. لا يمكن التراجع عن هذا الإجراء. | **Club**, **Playlist** |
| `clubs.settings.deleteStart` | Supprimer le club… | حذف النادي… | **Club** |
| `clubs.settings.deleteLabel` | Pour confirmer, tapez le nom du club : &lt;club&gt;{name}&lt;/club&gt; | للتأكيد، اكتبوا اسم النادي: &lt;club&gt;{name}&lt;/club&gt; | **Club** |
| `clubs.settings.deleteSubmit` | Supprimer définitivement | حذف نهائي |  |
| `clubs.settings.deleteMismatch` | Le nom ne correspond pas. Tapez « {name} ». | الاسم غير مطابق. اكتبوا «{name}». |  |
| `clubs.notFound.title` | Ce club est introuvable | هذا النادي غير موجود | **Club** |
| `clubs.notFound.body` | Le lien est peut-être incorrect, le club a été supprimé, ou vous n'en faites pas partie : seuls ses membres le voient. | ربما الرابط غير صحيح، أو حُذف النادي، أو لستم من أعضائه: لا يراه إلا أعضاؤه. | **Club** |
| `clubs.notFound.action` | Revenir à l'accueil | العودة إلى الرئيسية |  |

**À valider par un arabophone**

- « (أنتم) » après son propre nom dans la liste des membres (« Sami (أنتم) ») : le pluriel de politesse sonne-t-il bien pour une seule personne ? Variantes : « (أنت) », « (حسابكم) ».
- « منح دور المنشّط » pour « Donner le rôle d'animateur » : OK ?
- « حذف نهائي » pour « Supprimer définitivement » : OK ?

**Corrigé pendant la tâche 20**

- Noms de clubs et de personnes balisés selon leur écriture : un nom arabe (« سلمى ») porte `lang="ar"` dans l'interface française, un nom latin reste de gauche à droite en arabe.

## Rejoindre un club `/rejoindre/[code]`

Lien valide, lien invalide, visiteur (se connecter pour rejoindre), déjà membre, changement de club confirmé (« الانضمام إلى B يعني مغادرة A »), animateur qui rejoint en plus.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `clubs.join.title` | Rejoindre un club | الانضمام إلى نادٍ | **Club** |
| `clubs.join.invitedTo` | Invitation à rejoindre | دعوة للانضمام إلى |  |
| `clubs.join.submit` | Rejoindre | انضمّ |  |
| `clubs.join.signIn` | Se connecter pour rejoindre | تسجيل الدخول للانضمام |  |
| `clubs.join.signInHint` | Connectez-vous ou créez votre compte : vous rejoindrez le club juste après. | سجّلوا الدخول أو أنشئوا حسابكم: تنضمّون إلى النادي مباشرة بعد ذلك. | **Club** |
| `clubs.join.invalidTitle` | Ce lien n'est plus valide | هذا الرابط لم يعد صالحًا |  |
| `clubs.join.invalidBody` | Demandez le nouveau lien à votre animateur. | اطلبوا الرابط الجديد من منشّطكم. | **Animateur** |
| `clubs.join.home` | Revenir à l'accueil | العودة إلى الرئيسية |  |
| `clubs.join.alreadyTitle` | Vous faites déjà partie de &lt;club&gt;{name}&lt;/club&gt; | أنتم أعضاء في &lt;club&gt;{name}&lt;/club&gt; | **Membre** |
| `clubs.join.openClub` | Ouvrir le club | فتح النادي | **Club** |
| `clubs.join.switchBody` | Vous faites partie de &lt;club&gt;{current}&lt;/club&gt;. Rejoindre &lt;club&gt;{target}&lt;/club&gt; vous fera quitter &lt;club&gt;{current}&lt;/club&gt;. | أنتم أعضاء في &lt;club&gt;{current}&lt;/club&gt;. الانضمام إلى &lt;club&gt;{target}&lt;/club&gt; يعني مغادرة &lt;club&gt;{current}&lt;/club&gt;. | **Membre** |
| `clubs.join.switchKeep` | Vos copies personnelles de ses playlists sont conservées. | تبقى نسخكم الشخصية من قوائمه محفوظة. | **Playlist** |
| `clubs.join.switchSubmit` | Changer de club | تغيير النادي | **Club** |
| `clubs.join.stay` | Rester dans mon club | البقاء في ناديكم | **Club** |
| `clubs.join.animatorNote` | Vous êtes animateur : vous rejoignez &lt;club&gt;{name}&lt;/club&gt; en plus de vos clubs. | بصفتكم منشّطًا، تنضمّون إلى &lt;club&gt;{name}&lt;/club&gt; إضافةً إلى نواديكم. | **Animateur**, **Club** |
| `clubs.join.blockedBody` | Vous êtes le seul animateur de &lt;club&gt;{current}&lt;/club&gt;. Avant de rejoindre &lt;club&gt;{target}&lt;/club&gt;, donnez le rôle d'animateur à un autre membre de &lt;club&gt;{current}&lt;/club&gt;. | أنتم المنشّط الوحيد في &lt;club&gt;{current}&lt;/club&gt;. قبل الانضمام إلى &lt;club&gt;{target}&lt;/club&gt;، امنحوا دور المنشّط لعضو آخر في &lt;club&gt;{current}&lt;/club&gt;. | **Animateur**, **Membre** |
| `clubs.join.blockedAction` | Voir les membres | عرض الأعضاء | **Membre** |
| `clubs.join.pending` | Un instant… | لحظة… |  |

**À valider par un arabophone**

- « انضمّ » (impératif singulier) pour le bouton « Rejoindre » : voir la question générale 1.
- « الانضمام إلى <club>{target}</club> يعني مغادرة <club>{current}</club> » : clair ?

## Moi `/moi`

Nom, pastilles du club (des clubs pour un animateur), Mes playlists, Mes contributions (avec « 2 في الانتظار »), Proposer une chanson, Modération (« 8 للمراجعة »), Langue, Compte, Vos droits, Se déconnecter. Visiteur : invitation à se connecter.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `me.title` | Moi | حسابي |  |
| `me.clubsLabel` | {count, plural, one {Votre club} other {Vos clubs}} | {count, plural, one {ناديكم} other {نواديكم}} | **Club** |
| `me.noClub` | Vous ne faites partie d'aucun club pour l'instant. | لستم أعضاء في أي نادٍ حاليًا. | **Club**, **Membre** |
| `me.joinClub` | Rejoindre avec un lien | الانضمام برابط |  |
| `me.createClub` | Créer un club | إنشاء نادٍ | **Club** |
| `me.myPlaylists` | Mes playlists | قوائمي | **Playlist** |
| `me.myContributions` | Mes contributions | مساهماتي |  |
| `me.pending` | {n} en attente | {n} في الانتظار |  |
| `me.propose` | Proposer une chanson | اقتراح أغنية | **Proposition** |
| `me.moderation` | Modération | الإشراف | **Modération** |
| `me.moderationQueue` | {n} à relire | {n} للمراجعة |  |
| `me.language` | Langue | اللغة |  |
| `me.account` | Compte | الحساب |  |
| `me.rights` | Vos droits et le retrait de contenus | حقوقكم وسحب المحتوى |  |
| `me.signOut` | Se déconnecter | تسجيل الخروج |  |
| `me.visitorTitle` | Connectez-vous à Ghnaya | سجّلوا الدخول إلى غناية |  |
| `me.visitorBody` | Retrouvez les playlists de votre club, vos playlists personnelles et vos propositions. | تجدون قوائم ناديكم وقوائمكم الشخصية واقتراحاتكم. | **Club**, **Playlist**, **Proposition** |
| `me.accountDeleted` | Votre compte a été supprimé. Vos propositions restent dans Ghnaya, sans votre nom. | تمّ حذف حسابكم. تبقى اقتراحاتكم في غناية، دون اسمكم. | **Proposition** |

**À valider par un arabophone**

- « مساهماتي » (Mes contributions) : seule exception au lexique, voulue (le français fait la même exception). OK ?
- « حقوقكم وسحب المحتوى » pour « Vos droits et le retrait de contenus » : « سحب » (retrait) est-il le bon mot ?

**Corrigé pendant la tâche 20**

- Icône de « قوائمي » (une liste) retournée en arabe, comme celle de « إضافة إلى قائمة ».

## Compte `/moi/compte`

Nom, e-mail (de gauche à droite), langue, suppression du compte avec confirmation, ou encadré « لا يوجد في هذا النادي منشّط غيركم » pour un animateur seul dans un club.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `account.title` | Compte | الحساب |  |
| `account.infoTitle` | Vos informations | معلوماتكم |  |
| `account.name` | Nom | الاسم |  |
| `account.email` | E-mail | البريد الإلكتروني |  |
| `account.language` | Langue | اللغة |  |
| `account.deleteTitle` | Supprimer le compte | حذف الحساب |  |
| `account.deleteBody` | {clubs, plural, =0 {Vos playlists personnelles seront supprimées.} one {Vos playlists personnelles seront supprimées et vous quitterez votre club.} other {Vos playlists personnelles seront supprimées et vous quitterez vos clubs.}} Vos propositions resteront dans Ghnaya, sans votre nom. | {clubs, plural, =0 {ستُحذف قوائمكم الشخصية.} one {ستُحذف قوائمكم الشخصية وستغادرون ناديكم.} other {ستُحذف قوائمكم الشخصية وستغادرون نواديكم.}} تبقى اقتراحاتكم في غناية، دون اسمكم. | **Club**, **Playlist**, **Proposition** |
| `account.deleteButton` | Supprimer mon compte | حذف حسابي |  |
| `account.confirmTitle` | Supprimer définitivement votre compte ? | حذف حسابكم نهائيًا؟ |  |
| `account.confirmBody` | Cette action ne peut pas être annulée. | لا يمكن التراجع عن هذا الإجراء. |  |
| `account.confirm` | Supprimer définitivement | حذف نهائي |  |
| `account.deleting` | Suppression… | جارٍ الحذف… |  |
| `account.cancel` | Annuler | إلغاء |  |
| `account.blockedTitle` | {count, plural, one {Ce club n'a pas d'autre animateur que vous} other {Ces clubs n'ont pas d'autre animateur que vous}} | {count, plural, one {لا يوجد في هذا النادي منشّط غيركم} other {لا يوجد في هذه النوادي منشّط غيركم}} | **Animateur**, **Club** |
| `account.blockedBody` | {count, plural, one {Avant de supprimer votre compte, désignez un autre animateur ou supprimez le club.} other {Avant de supprimer votre compte, désignez un autre animateur dans chacun de ces clubs ou supprimez-les.}} | {count, plural, one {قبل حذف حسابكم، عيّنوا منشّطًا آخر أو احذفوا النادي.} other {قبل حذف حسابكم، عيّنوا منشّطًا آخر في كل نادٍ من هذه النوادي أو احذفوها.}} | **Animateur**, **Club** |
| `account.designate` | Désigner un animateur | تعيين منشّط | **Animateur** |
| `account.deleteClub` | Supprimer le club | حذف النادي | **Club** |
| `account.visitorBody` | Connectez-vous pour gérer votre compte. | سجّلوا الدخول لإدارة حسابكم. |  |

## Proposer une chanson `/contribuer` et une correction `/contribuer/[songId]`

Titres arabe et latin, artistes (autocomplétion), encadré « ربما هذه الأغنية موجودة », paroles (de droite à gauche), dialecte, translittération facultative, case des droits, erreurs en ligne et récapitulatif (« 5 نقاط يجب تصحيحها قبل الإرسال »).

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `contribute.title` | Proposer une chanson | اقتراح أغنية | **Proposition** |
| `contribute.correctionTitle` | Proposer une correction | اقتراح تصحيح | **Proposition** |
| `contribute.intro` | Un modérateur relira votre proposition avant de la publier. | سيراجع مشرف اقتراحكم قبل نشره. | **Modérateur**, **Proposition** |
| `contribute.correctionIntro` | Corrigez ce qui doit l'être. Un modérateur comparera votre version à celle de Ghnaya avant de la publier. | صحّحوا ما يلزم تصحيحه. سيقارن مشرف نسختكم بنسخة غناية قبل نشرها. | **Modérateur** |
| `contribute.correcting` | Chanson à corriger | الأغنية المراد تصحيحها |  |
| `contribute.titles.legend` | Titre | العنوان |  |
| `contribute.titles.hint` | En arabe, en lettres latines, ou les deux. | بالعربية أو بالحروف اللاتينية أو بهما معًا. | **Translittération** |
| `contribute.titles.ar` | Titre en arabe | العنوان بالعربية |  |
| `contribute.titles.latin` | Titre en lettres latines | العنوان بالحروف اللاتينية | **Translittération** |
| `contribute.artists.legend` | Artistes | الفنانون |  |
| `contribute.artists.hint` | Choisissez dans la liste, ou écrivez le nom d'un nouvel artiste. | اختاروا من القائمة، أو اكتبوا اسم فنان جديد. | **Playlist** |
| `contribute.artists.label` | Artiste {n} | الفنان {n} |  |
| `contribute.artists.add` | Ajouter un artiste | إضافة فنان |  |
| `contribute.artists.remove` | Retirer « {name} » | حذف «{name}» |  |
| `contribute.artists.removeUnnamed` | Retirer l'artiste {n} | حذف الفنان {n} |  |
| `contribute.artists.suggestions` | Artistes connus | فنانون معروفون |  |
| `contribute.similar.title` | Cette chanson existe peut-être déjà | ربما هذه الأغنية موجودة |  |
| `contribute.similar.body` | Ouvrez-la pour vérifier. Si ce n'est pas la même, continuez votre proposition. | افتحوها للتأكد. إن لم تكن نفس الأغنية، واصلوا اقتراحكم. | **Proposition** |
| `contribute.lyrics.label` | Paroles | الكلمات | **Paroles** |
| `contribute.lyrics.hint` | En arabe, une ligne par vers, et une ligne vide entre deux couplets. | بالعربية، سطر لكل بيت، وسطر فارغ بين مقطعين. |  |
| `contribute.dialect.label` | Dialecte | اللهجة | **Dialecte** |
| `contribute.dialect.placeholder` | Choisissez le dialecte | اختاروا اللهجة | **Dialecte** |
| `contribute.translit.add` | Ajouter la translittération | إضافة الكلمات بالحروف اللاتينية | **Paroles**, **Translittération** |
| `contribute.translit.addHint` | Facultatif : les paroles en lettres latines, pour qui ne lit pas l'arabe. | اختياري: لمن لا يقرأ العربية. |  |
| `contribute.translit.label` | Translittération (facultatif) | الحروف اللاتينية (اختياري) | **Translittération** |
| `contribute.translit.hint` | Les paroles en lettres latines, une ligne pour chaque ligne arabe, dans le même ordre. | الكلمات بالحروف اللاتينية، سطر لكل سطر عربي، بنفس الترتيب. | **Paroles**, **Translittération** |
| `contribute.rights` | Ces paroles sont dans le domaine public, ou j'ai le droit de les partager. | هذه الكلمات ملك عام، أو يحقّ لي نشرها. | **Paroles** |
| `contribute.submit` | Envoyer la proposition | إرسال الاقتراح | **Proposition** |
| `contribute.submitting` | Envoi en cours… | جارٍ الإرسال… |  |
| `contribute.afterSubmit` | Vous suivrez sa relecture dans Mes contributions. | ستتابعون مراجعته في «مساهماتي». |  |
| `contribute.errorSummary` | {count, plural, one {Un point à corriger avant l'envoi} other {{n} points à corriger avant l'envoi}} | {count, plural, one {نقطة واحدة يجب تصحيحها قبل الإرسال} two {نقطتان يجب تصحيحهما قبل الإرسال} few {{n} نقاط يجب تصحيحها قبل الإرسال} many {{n} نقطة يجب تصحيحها قبل الإرسال} other {{n} نقطة يجب تصحيحها قبل الإرسال}} |  |
| `contribute.pendingTitle` | Votre correction attend déjà sa relecture | تصحيحكم ينتظر المراجعة |  |
| `contribute.pendingBody` | Vous avez déjà proposé une correction de cette chanson. Quand un modérateur l'aura relue, vous pourrez en proposer une autre. | سبق أن اقترحتم تصحيحًا لهذه الأغنية. بعد أن يراجعه مشرف، يمكنكم اقتراح تصحيح آخر. | **Modérateur**, **Proposition** |
| `contribute.pendingAction` | Voir mes contributions | عرض مساهماتي |  |
| `contribute.errors.titleMissing` | Indiquez le titre, en arabe ou en lettres latines. | اكتبوا العنوان، بالعربية أو بالحروف اللاتينية. | **Translittération** |
| `contribute.errors.titleTooLong` | Le titre ne doit pas dépasser {max} caractères. | يجب ألّا يتجاوز العنوان {max} حرف. |  |
| `contribute.errors.titleArNotArabic` | Écrivez ce titre en lettres arabes, ou mettez-le dans le titre en lettres latines. | اكتبوا هذا العنوان بالحروف العربية، أو ضعوه في خانة العنوان بالحروف اللاتينية. | **Translittération** |
| `contribute.errors.titleLatinHasArabic` | Écrivez ce titre en lettres latines ; le titre arabe a son propre champ. | اكتبوا هذا العنوان بالحروف اللاتينية؛ للعنوان العربي خانته الخاصة. | **Translittération** |
| `contribute.errors.artistsMissing` | Indiquez au moins un artiste. | اذكروا فنانًا واحدًا على الأقل. |  |
| `contribute.errors.artistsTooMany` | Indiquez {max} artistes au plus. | اذكروا {max} فنانين على الأكثر. |  |
| `contribute.errors.artistTooLong` | Un nom d'artiste ne doit pas dépasser {max} caractères. | يجب ألّا يتجاوز اسم الفنان {max} حرفًا. |  |
| `contribute.errors.lyricsMissing` | Écrivez les paroles de la chanson. | اكتبوا كلمات الأغنية. | **Paroles** |
| `contribute.errors.lyricsTooShort` | Les paroles doivent compter au moins {min} caractères. | يجب أن تتضمن الكلمات {min} حرفًا على الأقل. | **Paroles** |
| `contribute.errors.lyricsTooLong` | Les paroles ne doivent pas dépasser {max} caractères. | يجب ألّا تتجاوز الكلمات {max} حرف. | **Paroles** |
| `contribute.errors.lyricsNotArabic` | Écrivez les paroles en lettres arabes. L'écriture latine va dans la translittération. | اكتبوا الكلمات بالحروف العربية، وضعوا الكلمات بالحروف اللاتينية في خانتها الخاصة. | **Paroles**, **Translittération** |
| `contribute.errors.dialectMissing` | Choisissez le dialecte de la chanson. | اختاروا لهجة الأغنية. | **Dialecte** |
| `contribute.errors.translitTooLong` | La translittération ne doit pas dépasser {max} caractères. | يجب ألّا تتجاوز الحروف اللاتينية {max} حرف. | **Translittération** |
| `contribute.errors.translitHasArabic` | Écrivez la translittération en lettres latines. | اكتبوا هذه الخانة بالحروف اللاتينية. | **Translittération** |
| `contribute.errors.translitLines` | Il faut une ligne de translittération par ligne de paroles : les paroles en comptent {expected}, la translittération {actual}. | يلزم سطر لاتيني لكل سطر من الكلمات. عدد الأسطر في الكلمات: {expected}، وفي الحروف اللاتينية: {actual}. | **Paroles**, **Translittération** |
| `contribute.errors.rightsMissing` | Cochez cette case pour confirmer que vous pouvez partager ces paroles. | ضعوا علامة في هذه الخانة لتأكيد أنه يحقّ لكم نشر هذه الكلمات. | **Paroles** |
| `contribute.errors.unchanged` | Vous n'avez rien modifié. Corrigez au moins un champ avant d'envoyer. | لم تغيّروا شيئًا. صحّحوا خانة واحدة على الأقل قبل الإرسال. |  |
| `contribute.errors.pendingExists` | Vous avez déjà une correction en attente pour cette chanson. | لديكم تصحيح ينتظر المراجعة لهذه الأغنية. |  |
| `contribute.errors.songMissing` | Cette chanson est introuvable ou a été retirée. | هذه الأغنية غير موجودة أو تمّ سحبها. |  |

**À valider par un arabophone**

- « صاحب الاقتراح » pour « l'auteur » d'une proposition (ici et en modération) : OK ?
- « هذه الكلمات ملك عام، أو يحقّ لي نشرها. » : la case est à la première personne, comme en français (« j'ai le droit »). OK ?

**Corrigé pendant la tâche 20**

- « الكتابة اللاتينية مكانها خانة الحروف اللاتينية » (deux mots pour le même concept) devient « اكتبوا الكلمات بالحروف العربية، وضعوا الكلمات بالحروف اللاتينية في خانتها الخاصة ».
- « {max} حرف » pour 120 caractères devient « {max} حرفًا » (de 11 à 99, modulo 100, le nom est à l'accusatif singulier).

## Mes contributions `/mes-contributions`

Filtre par statut, pastilles « قيد المراجعة / مقبول / مرفوض », note du modérateur ; confirmation « يعيشك — سيراجع مشرف اقتراحكم » après un envoi.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `contributions.title` | Mes contributions | مساهماتي |  |
| `contributions.intro` | Vos propositions et leur relecture par les modérateurs. | اقتراحاتكم ومراجعتها من قبل المشرفين. | **Modérateur**, **Proposition** |
| `contributions.propose` | Proposer une chanson | اقتراح أغنية | **Proposition** |
| `contributions.sent.thanks` | يعيشك | يعيشك |  |
| `contributions.sent.title` | votre proposition sera relue | سيراجع مشرف اقتراحكم | **Modérateur**, **Proposition** |
| `contributions.sent.body` | Elle apparaît ci-dessous, en attente. Vous suivrez ici sa relecture. | يظهر أدناه في انتظار المراجعة، وهنا تتابعون مراجعته. |  |
| `contributions.filterLabel` | Filtrer par statut | التصفية حسب الحالة |  |
| `contributions.filters.all` | Toutes | الكل |  |
| `contributions.filters.pending` | En attente | قيد المراجعة |  |
| `contributions.filters.approved` | Acceptées | المقبولة |  |
| `contributions.filters.rejected` | Refusées | المرفوضة |  |
| `contributions.status.pending` | En attente | قيد المراجعة |  |
| `contributions.status.approved` | Acceptée | مقبول |  |
| `contributions.status.rejected` | Refusée | مرفوض |  |
| `contributions.statusLabel` | Statut : | الحالة: |  |
| `contributions.type.addition` | Ajout | إضافة |  |
| `contributions.type.correction` | Correction | تصحيح |  |
| `contributions.proposedOn` | Proposée le {date} | اقتُرح في {date} |  |
| `contributions.reviewNote` | Note du modérateur | ملاحظة المشرف | **Modérateur** |
| `contributions.seeSong` | Voir la chanson | عرض الأغنية |  |
| `contributions.emptyTitle` | Proposez votre première chanson | اقترحوا أول أغنية | **Proposition** |
| `contributions.emptyBody` | Une chanson manque à Ghnaya ? Proposez-la : un modérateur la relira, puis elle rejoindra la base de tous. | أغنية ناقصة في غناية؟ اقترحوها: سيراجعها مشرف، ثم تنضمّ إلى قاعدة الجميع. | **Modérateur**, **Proposition** |
| `contributions.emptyFiltered.pending` | Aucune proposition en attente | لا اقتراحات قيد المراجعة | **Proposition** |
| `contributions.emptyFiltered.approved` | Aucune proposition acceptée pour l'instant | لا اقتراحات مقبولة حتى الآن | **Proposition** |
| `contributions.emptyFiltered.rejected` | Aucune proposition refusée | لا اقتراحات مرفوضة | **Proposition** |
| `contributions.emptyFilteredBody` | Vos autres propositions sont dans « Toutes ». | بقية اقتراحاتكم في «الكل». | **Proposition** |
| `contributions.seeAll` | Voir toutes mes propositions | عرض كل اقتراحاتي | **Proposition** |

**À valider par un arabophone**

- « يعيشك » : voir la question générale 2. C'est le seul « merci » en dialecte de l'app.
- Filtres au féminin pluriel (« المقبولة », « المرفوضة ») et pastilles au masculin (« مقبول », accordé avec « اقتراح ») : cohérent ?

## Modération : propositions `/moderation` et `/moderation/[revisionId]`

Sous-onglets « الاقتراحات (5) · الإبلاغات (3) », file de la plus ancienne à la plus récente (« اقتراح من Youssef · قبل 7 أيام »), vue des différences (une colonne à 375 px ; à 1024 px, « قبل » à droite et « بعد » à gauche), « قبول » / « رفض » (note obligatoire), « التالي », toasts.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `moderation.title` | Modération | الإشراف | **Modération** |
| `moderation.tabs.label` | Sections de la modération | أقسام الإشراف | **Modération** |
| `moderation.tabs.proposals` | Propositions ({n}) | الاقتراحات ({n}) | **Proposition** |
| `moderation.tabs.reports` | Signalements ({n}) | الإبلاغات ({n}) | **Signalement** |
| `moderation.notFound.title` | Page introuvable | الصفحة غير موجودة |  |
| `moderation.notFound.body` | Cette page n'existe pas, ou elle n'est pas accessible avec votre compte. | هذه الصفحة غير موجودة، أو لا يمكن الوصول إليها بحسابكم. |  |
| `moderation.notFound.action` | Revenir à l'accueil | العودة إلى الرئيسية |  |
| `moderation.empty.title` | Plus rien à relire | لا شيء للمراجعة |  |
| `moderation.empty.proposalsBody` | Toutes les propositions ont été relues. Merci pour votre temps. | تمّت مراجعة كل الاقتراحات. شكرًا على وقتكم. | **Proposition** |
| `moderation.empty.reportsBody` | Aucun signalement n'attend d'être traité. | لا إبلاغ ينتظر المعالجة. | **Signalement** |
| `moderation.empty.toReports` | Voir les signalements | عرض الإبلاغات | **Signalement** |
| `moderation.empty.toProposals` | Voir les propositions | عرض الاقتراحات | **Proposition** |
| `moderation.queue.proposalsIntro` | {count, plural, one {{n} proposition à relire} other {{n} propositions à relire}}, de la plus ancienne à la plus récente. | {count, plural, zero {لا اقتراحات للمراجعة} one {اقتراح واحد للمراجعة} two {اقتراحان للمراجعة} few {{n} اقتراحات للمراجعة} many {{n} اقتراحًا للمراجعة} other {{n} اقتراح للمراجعة}}، من الأقدم إلى الأحدث. | **Proposition** |
| `moderation.queue.reportsIntro` | {count, plural, one {{n} signalement à traiter} other {{n} signalements à traiter}} : les droits d'auteur d'abord, puis les autres par ancienneté. | {count, plural, zero {لا إبلاغات للمعالجة} one {إبلاغ واحد للمعالجة} two {إبلاغان للمعالجة} few {{n} إبلاغات للمعالجة} many {{n} إبلاغًا للمعالجة} other {{n} إبلاغ للمعالجة}}: الإبلاغات عن حقوق المؤلف أولًا، ثم البقية حسب الأقدمية. | **Signalement** |
| `moderation.queue.treated` | {count, plural, one {{n} signalement traité} other {{n} signalements traités}} | {count, plural, zero {لا إبلاغات معالجة} one {إبلاغ واحد معالج} two {إبلاغان معالجان} few {{n} إبلاغات معالجة} many {{n} إبلاغًا معالجًا} other {{n} إبلاغ معالج}} | **Signalement** |
| `moderation.type.addition` | Ajout | إضافة |  |
| `moderation.type.correction` | Correction | تصحيح |  |
| `moderation.typeLabel` | Type : | النوع: |  |
| `moderation.own` | Votre proposition | اقتراحكم | **Proposition** |
| `moderation.by` | Proposée par &lt;person&gt;{name}&lt;/person&gt; | اقتراح من &lt;person&gt;{name}&lt;/person&gt; | **Proposition** |
| `moderation.unknownAuthor` | un compte supprimé | حساب محذوف |  |
| `moderation.position` | Proposition {i} sur {n} | الاقتراح {i} من {n} | **Proposition** |
| `moderation.proposal.title` | Proposition | اقتراح | **Proposition** |
| `moderation.proposal.seeSong` | Voir la chanson publiée | عرض الأغنية المنشورة |  |
| `moderation.proposal.rights` | L'auteur déclare que ce contenu est dans le domaine public ou qu'il a le droit de le partager. | يصرّح صاحب الاقتراح بأن هذا المحتوى في الملك العام أو بأن له حق مشاركته. | **Proposition** |
| `moderation.proposal.fieldsTitle` | Champs modifiés | الحقول المعدّلة |  |
| `moderation.proposal.fields.titleAr` | Titre arabe | العنوان بالعربية |  |
| `moderation.proposal.fields.titleLatin` | Titre latin | العنوان بالحروف اللاتينية | **Translittération** |
| `moderation.proposal.fields.artists` | Artistes | الفنانون |  |
| `moderation.proposal.fields.dialect` | Dialecte | اللهجة | **Dialecte** |
| `moderation.proposal.fields.translit` | Translittération | الحروف اللاتينية | **Translittération** |
| `moderation.proposal.before` | Avant | قبل |  |
| `moderation.proposal.after` | Après | بعد |  |
| `moderation.proposal.none` | Aucun | لا شيء |  |
| `moderation.proposal.lyricsTitle` | Paroles | الكلمات | **Paroles** |
| `moderation.proposal.proposedLyrics` | Paroles proposées | الكلمات المقترحة | **Paroles** |
| `moderation.proposal.translitTitle` | Translittération | الحروف اللاتينية | **Translittération** |
| `moderation.proposal.proposedTranslit` | Translittération proposée | الكلمات المقترحة بالحروف اللاتينية | **Paroles**, **Translittération** |
| `moderation.proposal.statusLabel` | Statut : | الحالة: |  |
| `moderation.proposal.status.approved` | Approuvée | مقبول |  |
| `moderation.proposal.status.rejected` | Rejetée | مرفوض |  |
| `moderation.proposal.reviewedOn` | Relue le {date} | روجع في {date} |  |
| `moderation.proposal.reviewNote` | Note du modérateur | ملاحظة المشرف | **Modérateur** |
| `moderation.diff.added` | {count, plural, one {{n} ligne ajoutée} other {{n} lignes ajoutées}} | {count, plural, zero {لا أسطر مضافة} one {سطر واحد مضاف} two {سطران مضافان} few {{n} أسطر مضافة} many {{n} سطرًا مضافًا} other {{n} سطر مضاف}} |  |
| `moderation.diff.removed` | {count, plural, one {{n} ligne retirée} other {{n} lignes retirées}} | {count, plural, zero {لا أسطر محذوفة} one {سطر واحد محذوف} two {سطران محذوفان} few {{n} أسطر محذوفة} many {{n} سطرًا محذوفًا} other {{n} سطر محذوف}} |  |
| `moderation.diff.unchanged` | Paroles inchangées. | الكلمات دون تغيير. | **Paroles** |
| `moderation.diff.unchangedTranslit` | Translittération inchangée. | الحروف اللاتينية دون تغيير. | **Translittération** |
| `moderation.diff.addedLine` | Ligne ajoutée : | سطر مضاف: |  |
| `moderation.diff.removedLine` | Ligne retirée : | سطر محذوف: |  |
| `moderation.diff.emptyLine` | ligne vide | سطر فارغ |  |
| `moderation.diff.showHidden` | {count, plural, one {Afficher {n} ligne identique} other {Afficher les {n} lignes identiques}} | {count, plural, zero {عرض الأسطر المتطابقة} one {عرض سطر متطابق} two {عرض سطرين متطابقين} few {عرض {n} أسطر متطابقة} many {عرض {n} سطرًا متطابقًا} other {عرض {n} سطر متطابق}} |  |
| `moderation.review.title` | Votre décision | قراركم |  |
| `moderation.review.noteLabel` | Note pour l'auteur | ملاحظة لصاحب الاقتراح | **Proposition** |
| `moderation.review.noteHint` | Obligatoire pour rejeter. L'auteur la lira dans Mes contributions. | إلزامية عند الرفض. سيقرؤها صاحب الاقتراح في «مساهماتي». | **Proposition** |
| `moderation.review.approve` | Approuver | قبول |  |
| `moderation.review.reject` | Rejeter | رفض |  |
| `moderation.review.ownNotice` | Vous ne pouvez pas approuver votre propre proposition : un autre modérateur la relira. | لا يمكنكم قبول اقتراحكم: سيراجعه مشرف آخر. | **Modérateur**, **Proposition** |
| `moderation.review.errors.noteRequired` | Écrivez une note pour expliquer le rejet à l'auteur. | اكتبوا ملاحظة تشرح سبب الرفض لصاحب الاقتراح. | **Proposition** |
| `moderation.review.errors.noteTooLong` | La note dépasse {max} caractères. | تتجاوز الملاحظة {max} حرف. |  |
| `moderation.review.errors.ownProposal` | Vous ne pouvez pas approuver votre propre proposition. | لا يمكنكم قبول اقتراحكم. | **Proposition** |
| `moderation.review.errors.notPending` | Cette proposition a déjà été relue. | تمّت مراجعة هذا الاقتراح من قبل. | **Proposition** |
| `moderation.review.errors.songGone` | Cette chanson a été retirée entre-temps : la correction ne peut plus être approuvée. | سُحبت هذه الأغنية في الأثناء: لم يعد بالإمكان قبول التصحيح. |  |
| `moderation.next` | Suivante | التالي |  |
| `moderation.done.approved` | Proposition approuvée | تمّ قبول الاقتراح | **Proposition** |
| `moderation.done.rejected` | Proposition rejetée | تمّ رفض الاقتراح | **Proposition** |
| `moderation.done.removed` | Chanson retirée | تمّ سحب الأغنية |  |
| `moderation.done.dismissed` | Signalement classé sans suite | تمّ حفظ الإبلاغ دون متابعة | **Signalement** |

**À valider par un arabophone**

- « اقتراح من {name} » (nouveau) pour « Proposée par {name} » : neutre en genre. OK ?
- « قبول » / « رفض » pour « Approuver » / « Rejeter » : OK, ou « الموافقة » / « الرفض » ?
- Formes du pluriel de « سطر » dans la vue des différences (« سطران مضافان », « 3 أسطر مضافة », « 12 سطرًا مضافًا ») : OK ?

**Corrigé pendant la tâche 20**

- « اقترحه {name} » était au masculin (« il l'a proposée ») alors que l'auteur peut être une femme (Amira) : remplacé par « اقتراح من {name} », neutre.
- Signalement : « بلاغ / البلاغات » remplacé par « إبلاغ / الإبلاغات » (lexique) dans les sous-onglets, la file, l'état vide et les toasts.
- Noms des auteurs isolés et balisés selon leur écriture (« اقتراح من Youssef »).

## Modération : signalements `/moderation/signalements` et `/moderation/signalements/[id]`

Droits d'auteur en tête, puis par ancienneté ; signalements traités repliés. Détail : motif, chanson, « إبلاغ من Leïla » ou « إبلاغ من زائر » avec l'e-mail de contact, détails, puis « سحب الأغنية / تصحيح الأغنية / حفظ دون متابعة » avec une note obligatoire.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `moderation.report.title` | Signalement | إبلاغ | **Signalement** |
| `moderation.report.reasonLabel` | Motif : | السبب: |  |
| `moderation.report.reasons.copyright` | Droits d'auteur | حقوق المؤلف |  |
| `moderation.report.reasons.wrong_lyrics` | Paroles erronées | كلمات خاطئة | **Paroles** |
| `moderation.report.reasons.duplicate` | Doublon | أغنية مكرّرة |  |
| `moderation.report.reasons.spam` | Spam | محتوى مزعج |  |
| `moderation.report.reasons.other` | Autre | سبب آخر |  |
| `moderation.report.by` | Signalé par &lt;person&gt;{name}&lt;/person&gt; | إبلاغ من &lt;person&gt;{name}&lt;/person&gt; | **Signalement** |
| `moderation.report.byVisitor` | Signalé par un visiteur | إبلاغ من زائر | **Signalement** |
| `moderation.report.contact` | Contact : | للتواصل: |  |
| `moderation.report.details` | Détails | التفاصيل |  |
| `moderation.report.noDetails` | Aucun détail. | لا تفاصيل. |  |
| `moderation.report.unknownSong` | Chanson inconnue | أغنية غير معروفة |  |
| `moderation.report.songRemoved` | Cette chanson est retirée : elle n'est plus ni cherchable ni lisible. | هذه الأغنية مسحوبة: لم يعد بالإمكان البحث عنها ولا قراءتها. |  |
| `moderation.report.seeSong` | Voir la chanson | عرض الأغنية |  |
| `moderation.report.statusLabel` | Statut : | الحالة: |  |
| `moderation.report.status.open` | À traiter | للمعالجة |  |
| `moderation.report.status.resolved` | Traité | تمّت المعالجة |  |
| `moderation.report.status.dismissed` | Classé sans suite | محفوظ دون متابعة |  |
| `moderation.report.resolvedBy` | Par &lt;person&gt;{name}&lt;/person&gt; | بواسطة &lt;person&gt;{name}&lt;/person&gt; |  |
| `moderation.report.resolutionNote` | Note de traitement | ملاحظة المعالجة |  |
| `moderation.report.form.title` | Traiter le signalement | معالجة الإبلاغ | **Signalement** |
| `moderation.report.form.noteLabel` | Note de traitement | ملاحظة المعالجة |  |
| `moderation.report.form.noteHint` | Obligatoire. Elle reste avec le signalement ; pour un retrait, elle en donne le motif. | إلزامية. تبقى مع الإبلاغ، وعند السحب تبيّن سببه. | **Signalement** |
| `moderation.report.form.remove` | Retirer la chanson | سحب الأغنية |  |
| `moderation.report.form.removeHint` | Retrait doux : la chanson disparaît de la recherche et des lectures, et peut être rétablie. | سحب قابل للتراجع: تختفي الأغنية من البحث ومن القراءة، ويمكن إعادتها لاحقًا. |  |
| `moderation.report.form.correct` | Corriger la chanson | تصحيح الأغنية |  |
| `moderation.report.form.correctHint` | Le signalement est marqué traité, puis le formulaire de correction s'ouvre. | يُعتبر الإبلاغ معالجًا، ثم تُفتح استمارة التصحيح. | **Signalement** |
| `moderation.report.form.dismiss` | Classer sans suite | حفظ دون متابعة |  |
| `moderation.report.form.dismissHint` | La chanson reste publiée telle quelle. | تبقى الأغنية منشورة كما هي. |  |
| `moderation.report.errors.noteRequired` | Écrivez une note : elle reste avec le signalement. | اكتبوا ملاحظة: تبقى مع الإبلاغ. | **Signalement** |
| `moderation.report.errors.noteTooLong` | La note dépasse {max} caractères. | تتجاوز الملاحظة {max} حرف. |  |
| `moderation.report.errors.notOpen` | Ce signalement a déjà été traité. | تمّت معالجة هذا الإبلاغ من قبل. | **Signalement** |
| `moderation.report.errors.songGone` | Cette chanson est déjà retirée : vous pouvez seulement classer le signalement. | هذه الأغنية مسحوبة من قبل: يمكنكم فقط حفظ الإبلاغ دون متابعة. | **Signalement** |

**À valider par un arabophone**

- « الإبلاغات » : pluriel de « إبلاغ » imposé par le lexique ; l'usage courant est « البلاغات ». Faut-il garder « إبلاغات », ou admettre « بلاغات » au pluriel ? (Le test du lexique refuse aujourd'hui « بلاغ ».)
- « حفظ دون متابعة » pour « Classer sans suite » : c'est le terme juridique (حفظ القضية). Compris par un modérateur non juriste ?
- « سحب الأغنية » pour « Retirer la chanson » : OK ?

**Corrigé pendant la tâche 20**

- « أبلغ عنها {name} » (masculin) remplacé par « إبلاغ من {name} », neutre ; « أبلغ عنها زائر » par « إبلاغ من زائر ».
- Motif « Spam » : « رسائل مزعجة » en modération et « محتوى مزعج » dans le formulaire ; unifié en « محتوى مزعج ».
- Le filet de la citation des détails reste du côté du début de l'interface (à droite en arabe), même quand le texte est en français.

## Signaler `/signaler/[songId]`

Chanson signalée, motif en boutons radio (« حقوق المؤلف » en tête), détails, e-mail obligatoire pour un visiteur (de gauche à droite), récapitulatif d'erreurs, confirmation « تمّ إرسال الإبلاغ ».

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `reportForm.metaTitle` | Signaler une chanson | الإبلاغ عن أغنية | **Signalement** |
| `reportForm.title` | Signaler une chanson | الإبلاغ عن أغنية | **Signalement** |
| `reportForm.songLabel` | Chanson signalée | الأغنية المعنيّة |  |
| `reportForm.intro` | Un modérateur examinera votre signalement. S'il s'agit de droits d'auteur, &lt;link&gt;voyez comment se passe un retrait&lt;/link&gt;. | سيدرس مشرف إبلاغكم. إذا تعلّق الأمر بحقوق المؤلف، &lt;link&gt;اطّلعوا على طريقة السحب&lt;/link&gt;. | **Modérateur**, **Signalement** |
| `reportForm.reasonLegend` | Motif | السبب |  |
| `reportForm.reasons.copyright.label` | Droits d'auteur | حقوق المؤلف |  |
| `reportForm.reasons.copyright.hint` | Vous détenez les droits de ces paroles, ou vous représentez ceux qui les détiennent. | تملكون حقوق هذه الكلمات، أو تمثّلون من يملكها. | **Paroles** |
| `reportForm.reasons.wrong_lyrics.label` | Paroles erronées | كلمات خاطئة | **Paroles** |
| `reportForm.reasons.wrong_lyrics.hint` | Des vers manquent, sont faux ou ne sont pas dans le bon ordre. | أبيات ناقصة أو خاطئة أو في غير ترتيبها. |  |
| `reportForm.reasons.duplicate.label` | Doublon | أغنية مكرّرة |  |
| `reportForm.reasons.duplicate.hint` | Cette chanson existe déjà sur Ghnaya. | هذه الأغنية موجودة من قبل في غناية. |  |
| `reportForm.reasons.spam.label` | Spam | محتوى مزعج |  |
| `reportForm.reasons.spam.hint` | Publicité, ou contenu sans rapport avec la chanson. | إعلان، أو محتوى لا علاقة له بالأغنية. |  |
| `reportForm.reasons.other.label` | Autre | سبب آخر |  |
| `reportForm.reasons.other.hint` | Un autre problème sur cette fiche. | مشكلة أخرى في صفحة هذه الأغنية. |  |
| `reportForm.detailsLabel` | Détails | التفاصيل |  |
| `reportForm.detailsHints.none` | Dites-nous ce qui ne va pas, le plus précisément possible. | أخبرونا بما هو غير صحيح، بأكبر دقّة ممكنة. |  |
| `reportForm.detailsHints.copyright` | Indiquez l'œuvre, qui en détient les droits et à quel titre vous agissez : auteur, compositeur, éditeur ou représentant. | اذكروا العمل، ومن يملك حقوقه، وبأيّ صفة تتصرّفون: مؤلّف أو ملحّن أو ناشر أو ممثّل. |  |
| `reportForm.detailsHints.wrong_lyrics` | Indiquez les vers concernés et, si vous la connaissez, la bonne version. | اذكروا الأبيات المعنيّة، والصيغة الصحيحة إن كنتم تعرفونها. |  |
| `reportForm.detailsHints.duplicate` | Indiquez le titre de l'autre fiche, ou copiez son lien. | اذكروا عنوان الصفحة الأخرى، أو انسخوا رابطها. |  |
| `reportForm.detailsHints.spam` | Dites-nous ce qui relève de la publicité ou du hors-sujet. | أخبرونا بما هو إعلان أو خارج عن الموضوع. |  |
| `reportForm.detailsHints.other` | Dites-nous ce qui ne va pas, le plus précisément possible. | أخبرونا بما هو غير صحيح، بأكبر دقّة ممكنة. |  |
| `reportForm.correctionTip` | Vous connaissez la bonne version ? &lt;link&gt;Proposez une correction&lt;/link&gt; : elle sera relue avant d'être publiée. | تعرفون الكلمات الصحيحة؟ &lt;link&gt;اقترحوا تصحيحًا&lt;/link&gt;، وسيُراجَع قبل نشره. | **Paroles**, **Proposition** |
| `reportForm.emailLabel` | Votre adresse e-mail | بريدكم الإلكتروني |  |
| `reportForm.emailHint` | Pour vous répondre si besoin. Elle n'est jamais publiée. | للرد عليكم عند الحاجة. لا يُنشر أبدًا. |  |
| `reportForm.emailPlaceholder` | nom@exemple.com | name@example.com |  |
| `reportForm.signInPrompt` | Vous avez un compte ? &lt;link&gt;Connectez-vous&lt;/link&gt; : vous n'aurez pas d'adresse à saisir. | لديكم حساب؟ &lt;link&gt;سجّلوا الدخول&lt;/link&gt;، ولن تحتاجوا إلى كتابة بريدكم. |  |
| `reportForm.signedInAs` | Vous signalez avec votre compte, &lt;b&gt;{name}&lt;/b&gt; : inutile de laisser une adresse e-mail. | ترسلون هذا الإبلاغ من حسابكم، &lt;b&gt;{name}&lt;/b&gt;، فلا حاجة إلى ترك بريد إلكتروني. | **Signalement** |
| `reportForm.submit` | Envoyer le signalement | إرسال الإبلاغ | **Signalement** |
| `reportForm.submitting` | Envoi en cours… | جارٍ الإرسال… |  |
| `reportForm.errorSummary` | {count, plural, one {Un point à corriger avant l'envoi} other {{n} points à corriger avant l'envoi}} | {count, plural, one {نقطة واحدة يجب تصحيحها قبل الإرسال} two {نقطتان يجب تصحيحهما قبل الإرسال} few {{n} نقاط يجب تصحيحها قبل الإرسال} many {{n} نقطة يجب تصحيحها قبل الإرسال} other {{n} نقطة يجب تصحيحها قبل الإرسال}} |  |
| `reportForm.errors.reasonMissing` | Choisissez un motif. | اختاروا سبب الإبلاغ. | **Signalement** |
| `reportForm.errors.detailsMissing` | Décrivez le problème. | صِفوا المشكلة. |  |
| `reportForm.errors.detailsTooShort` | Écrivez au moins {min} caractères. | اكتبوا {min} أحرف على الأقل. |  |
| `reportForm.errors.detailsTooLong` | Écrivez au plus {max} caractères. | يجب ألّا تتجاوز التفاصيل {max} حرف. |  |
| `reportForm.errors.emailMissing` | Saisissez votre adresse e-mail : elle nous permet de vous répondre. | أدخلوا بريدكم الإلكتروني لنتمكّن من الرد عليكم. |  |
| `reportForm.errors.emailInvalid` | Cette adresse n'est pas valide. Elle doit ressembler à &lt;ltr&gt;nom@exemple.com&lt;/ltr&gt; | هذا العنوان غير صحيح. يجب أن يكون على شكل &lt;ltr&gt;name@example.com&lt;/ltr&gt; |  |
| `reportForm.errors.songMissing` | Cette chanson est introuvable ou a été retirée. | هذه الأغنية غير موجودة أو تمّ سحبها. |  |
| `reportForm.sent.title` | Signalement envoyé | تمّ إرسال الإبلاغ | **Signalement** |
| `reportForm.sent.body` | Merci. Un modérateur va l'examiner ; les signalements pour droits d'auteur passent en priorité. | شكرًا لكم. سيدرسه مشرف، والأولوية للإبلاغ عن حقوق المؤلف. | **Modérateur**, **Signalement** |
| `reportForm.sent.contact` | S'il a besoin de précisions, il vous écrira à &lt;b&gt;{email}&lt;/b&gt;. | وإذا احتاج إلى توضيحات، سيراسلكم على &lt;b&gt;{email}&lt;/b&gt;. |  |
| `reportForm.sent.rightsTitle` | Vos droits et le retrait de contenus | حقوقكم وسحب المحتوى |  |
| `reportForm.sent.rightsHint` | Ce qui se passe après un signalement | ما يحدث بعد الإبلاغ | **Signalement** |
| `reportForm.sent.backToSong` | Revenir à la chanson | العودة إلى الأغنية |  |

**À valider par un arabophone**

- Aides des motifs (« تملكون حقوق هذه الكلمات، أو تمثّلون من يملكها. ») : OK ?
- « صِفوا المشكلة. » : OK ?

**Corrigé pendant la tâche 20**

- Adresse d'exemple « name@example.com » dans l'erreur d'e-mail : isolée de gauche à droite (balise `<ltr>`).

## Vos droits et le retrait de contenus `/a-propos/droits`

Page de texte : ce que Ghnaya publie (les trois sources), demander un retrait (4 étapes), ce qui se passe ensuite, un retrait réversible, les autres signalements.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `rightsPage.metaDescription` | Ce que Ghnaya publie, comment demander le retrait d'une chanson et ce qui se passe ensuite. | ما تنشره غناية، وكيف تطلبون سحب أغنية، وما يحدث بعد ذلك. |  |
| `rightsPage.title` | Vos droits et le retrait de contenus | حقوقكم وسحب المحتوى |  |
| `rightsPage.lead` | Ghnaya aide les clubs de chant à lire des paroles en séance. Si une chanson publiée ici vous appartient, ou si vous représentez ses ayants droit, vous pouvez demander son retrait. | تساعد غناية نوادي الغناء على قراءة الكلمات في الجلسات. إذا كانت أغنية منشورة هنا ملكًا لكم، أو كنتم تمثّلون أصحاب حقوقها، يمكنكم طلب سحبها. | **Club**, **Paroles**, **Séance** |
| `rightsPage.publish.title` | Ce que Ghnaya publie | ما تنشره غناية |  |
| `rightsPage.publish.body` | Ghnaya publie des paroles, en texte seul : ni enregistrement, ni partition, ni publicité. Chaque fiche de chanson indique la source de ses paroles : | تنشر غناية الكلمات نصًّا فقط: لا تسجيلات ولا نوتات ولا إعلانات. وتذكر صفحة كل أغنية مصدر كلماتها: | **Paroles**, **Source** |
| `rightsPage.publish.lrclib` | &lt;source&gt;LRCLIB&lt;/source&gt;, une base de paroles ouverte et collaborative ; | &lt;source&gt;LRCLIB&lt;/source&gt;: قاعدة كلمات مفتوحة وتشاركية؛ | **Paroles** |
| `rightsPage.publish.publicDomain` | &lt;source&gt;Domaine public&lt;/source&gt; : des chants traditionnels, ou des textes dont l'auteur est mort depuis plus de 50 ans ; | &lt;source&gt;ملك عام&lt;/source&gt;: أغانٍ تراثية، أو نصوص توفّي مؤلّفوها منذ أكثر من 50 سنة؛ |  |
| `rightsPage.publish.contribution` | &lt;source&gt;Proposition&lt;/source&gt; : des paroles envoyées par un membre, qui déclare avoir le droit de les partager, puis relues par un modérateur avant d'être publiées. | &lt;source&gt;اقتراح&lt;/source&gt;: كلمات أرسلها عضو يُقرّ بأنه يحقّ له نشرها، ثم راجعها مشرف قبل نشرها. | **Membre**, **Modérateur**, **Paroles**, **Proposition** |
| `rightsPage.request.title` | Demander un retrait | طلب السحب |  |
| `rightsPage.request.open` | Ouvrez la fiche de la chanson, puis touchez &lt;strong&gt;Signaler&lt;/strong&gt;, en bas de la page. | افتحوا صفحة الأغنية، ثم اضغطوا على &lt;strong&gt;إبلاغ&lt;/strong&gt; أسفل الصفحة. | **Signalement** |
| `rightsPage.request.reason` | Choisissez le motif &lt;strong&gt;Droits d'auteur&lt;/strong&gt;. | اختاروا السبب &lt;strong&gt;حقوق المؤلف&lt;/strong&gt;. |  |
| `rightsPage.request.details` | Dans les détails, indiquez l'œuvre, qui en détient les droits et à quel titre vous agissez : auteur, compositeur, éditeur ou représentant. | في التفاصيل، اذكروا العمل، ومن يملك حقوقه، وبأيّ صفة تتصرّفون: مؤلّف أو ملحّن أو ناشر أو ممثّل. |  |
| `rightsPage.request.email` | Laissez une adresse e-mail pour que nous puissions vous répondre. Vous n'avez pas besoin de compte. | اتركوا بريدًا إلكترونيًا لنتمكّن من الرد عليكم. لا تحتاجون إلى حساب. |  |
| `rightsPage.after.title` | Ce qui se passe ensuite | ماذا يحدث بعد ذلك |  |
| `rightsPage.after.body` | Les signalements pour droits d'auteur passent en tête de la file de modération. Un modérateur examine le vôtre, puis : | يُنظر في الإبلاغ عن حقوق المؤلف قبل غيره. يدرس مشرف إبلاغكم، ثم: | **Modérateur**, **Signalement** |
| `rightsPage.after.remove` | retire la chanson ; | يسحب الأغنية؛ |  |
| `rightsPage.after.correct` | la corrige, si le problème ne porte que sur une partie du texte ; | أو يصحّحها، إذا كانت المشكلة تخصّ جزءًا من النص فقط؛ |  |
| `rightsPage.after.dismiss` | ou classe le signalement sans suite, s'il n'est pas fondé. | أو يحفظ الإبلاغ دون متابعة، إذا لم يكن له أساس. | **Signalement** |
| `rightsPage.after.contact` | S'il a besoin de précisions, il vous écrit à l'adresse que vous avez laissée. | وإذا احتاج إلى توضيحات، يراسلكم على البريد الذي تركتموه. |  |
| `rightsPage.reversible.title` | Un retrait réversible | سحب يمكن التراجع عنه |  |
| `rightsPage.reversible.hidden` | Une chanson retirée n'apparaît plus dans la recherche, et sa fiche indique qu'elle est introuvable ou retirée. Dans les playlists, elle est marquée « Chanson retirée ». | لا تظهر الأغنية المسحوبة في البحث، وتشير صفحتها إلى أنها غير موجودة أو تمّ سحبها. وفي القوائم، تظهر عليها عبارة «أغنية مسحوبة». | **Playlist** |
| `rightsPage.reversible.restore` | Elle n'est pas effacée pour autant : un modérateur peut la rétablir si le retrait était une erreur, ou si les droits ont été accordés depuis. | لكنها لا تُحذف نهائيًا: يمكن لمشرف إعادتها إذا كان السحب خطأً، أو إذا مُنحت الحقوق لاحقًا. | **Modérateur** |
| `rightsPage.other.title` | Les autres signalements | أسباب أخرى للإبلاغ | **Signalement** |
| `rightsPage.other.body` | Le même formulaire sert à signaler des paroles erronées, un doublon ou du spam. Si vous connaissez la bonne version des paroles, vous pouvez aussi proposer une correction depuis la fiche de la chanson : elle sera relue avant d'être publiée. | يُستعمل النموذج نفسه للإبلاغ عن كلمات خاطئة أو أغنية مكرّرة أو محتوى مزعج. وإذا كنتم تعرفون الكلمات الصحيحة، يمكنكم أيضًا اقتراح تصحيح من صفحة الأغنية، وسيُراجَع قبل نشره. | **Paroles**, **Proposition**, **Signalement** |
| `rightsPage.searchAction` | Chercher une chanson | ابحثوا عن أغنية |  |

**À valider par un arabophone**

- Page à faire relire aussi par un juriste (spec §14) : « توفّي مؤلّفوها منذ أكثر من 50 سنة » suit la durée tunisienne (50 ans après la mort de l'auteur).
- « قاعدة كلمات مفتوحة وتشاركية » pour LRCLIB : OK ?

## Connexion `/connexion` et Vérifiez vos e-mails `/connexion/verifier`

Lien magique par e-mail et bouton Google, e-mail invalide, envoi en cours, « تفقّدوا بريدكم الإلكتروني ». Barre d'onglets masquée.

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `signIn.metaTitle` | Connexion | تسجيل الدخول |  |
| `signIn.title` | Connectez-vous | سجّلوا الدخول |  |
| `signIn.intro` | Retrouvez les séances de votre club, préparez vos playlists et proposez des chansons. | لتجدوا جلسات ناديكم، وتحضّروا قوائمكم، وتقترحوا أغاني. | **Club**, **Playlist**, **Séance** |
| `signIn.google` | Continuer avec &lt;brand&gt;Google&lt;/brand&gt; | المتابعة باستخدام &lt;brand&gt;Google&lt;/brand&gt; |  |
| `signIn.googlePending` | Connexion à &lt;brand&gt;Google&lt;/brand&gt;… | جارٍ الاتصال بـ &lt;brand&gt;Google&lt;/brand&gt;… |  |
| `signIn.or` | ou | أو |  |
| `signIn.emailLabel` | Adresse e-mail | البريد الإلكتروني |  |
| `signIn.emailPlaceholder` | nom@exemple.com | name@example.com |  |
| `signIn.emailHint` | Nous vous envoyons un lien de connexion, sans mot de passe. | سنرسل إليكم رابطًا لتسجيل الدخول، دون كلمة مرور. |  |
| `signIn.submit` | Recevoir un lien de connexion | إرسال رابط الدخول |  |
| `signIn.sending` | Envoi en cours… | جارٍ الإرسال… |  |
| `signIn.errors.missing` | Saisissez votre adresse e-mail. | أدخلوا بريدكم الإلكتروني. |  |
| `signIn.errors.invalid` | Cette adresse n'est pas valide. Elle doit ressembler à &lt;ltr&gt;nom@exemple.com&lt;/ltr&gt; | هذا العنوان غير صحيح. يجب أن يكون على شكل &lt;ltr&gt;name@example.com&lt;/ltr&gt; |  |
| `signIn.noAccount` | Pas encore de compte ? Il est créé à votre première connexion. | ليس لديكم حساب بعد؟ يُنشأ حسابكم عند أول تسجيل دخول. |  |
| `signIn.verify.metaTitle` | Vérifiez vos e-mails | تفقّدوا بريدكم الإلكتروني |  |
| `signIn.verify.title` | Vérifiez vos e-mails | تفقّدوا بريدكم الإلكتروني |  |
| `signIn.verify.sentTo` | Nous avons envoyé un lien de connexion à &lt;strong&gt;{email}&lt;/strong&gt;. | أرسلنا رابط الدخول إلى &lt;strong&gt;{email}&lt;/strong&gt;. |  |
| `signIn.verify.sent` | Nous vous avons envoyé un lien de connexion. | أرسلنا إليكم رابط الدخول. |  |
| `signIn.verify.openLink` | Touchez le lien dans l'e-mail pour vous connecter : vous reviendrez ensuite à la page que vous consultiez. | اضغطوا على الرابط في الرسالة لتسجيل الدخول، ثم تعودون إلى الصفحة التي كنتم تتصفّحونها. |  |
| `signIn.verify.notReceivedTitle` | Rien reçu ? | لم يصلكم شيء؟ |  |
| `signIn.verify.notReceivedBody` | Regardez dans vos courriers indésirables, ou recommencez avec une autre adresse. | ابحثوا في البريد غير المرغوب فيه، أو أعيدوا المحاولة بعنوان آخر. |  |
| `signIn.verify.changeEmail` | Modifier l'adresse | تغيير العنوان |  |

**À valider par un arabophone**

- « المتابعة باستخدام Google » reprend la formulation officielle de Google en arabe. OK ?
- « تفقّدوا بريدكم الإلكتروني » : OK, ou « راجعوا » ?

**Corrigé pendant la tâche 20**

- « Google » est un fragment de gauche à droite (`dir="ltr"`) dans le bouton arabe, et l'adresse d'exemple de l'erreur aussi.

## Pages système : chargement, erreur, introuvable (404)

Squelettes de chargement (annonce « جارٍ تحميل … » pour les lecteurs d'écran), page d'erreur avec la référence (de gauche à droite), 404 générale. La page d'erreur de dernier recours (`global-error.tsx`) affiche le français et l'arabe ensemble, avec des textes écrits dans le fichier : « تعذّر عرض غناية », « حدث خلل من جهتنا. أعيدوا المحاولة بعد قليل. », « أعيدوا المحاولة », « مرجع الخطأ للدعم ».

| Clé | Français | العربية | Lexique |
|---|---|---|---|
| `system.loading.list` | Chargement… | جارٍ التحميل… |  |
| `system.loading.playlists` | Chargement de vos playlists… | جارٍ تحميل قوائمكم… | **Playlist** |
| `system.loading.playlist` | Chargement de la playlist… | جارٍ تحميل القائمة… | **Playlist** |
| `system.loading.clubs` | Chargement des clubs… | جارٍ تحميل النوادي… | **Club** |
| `system.loading.club` | Chargement du club… | جارٍ تحميل النادي… | **Club** |
| `system.error.metaTitle` | Erreur | خطأ |  |
| `system.error.title` | Cette page n'a pas pu s'afficher | تعذّر عرض هذه الصفحة |  |
| `system.error.body` | Un problème est survenu de notre côté. Réessayez. S'il continue, revenez à l'accueil. | حدث خلل من جهتنا. أعيدوا المحاولة، وإن استمرّ فعودوا إلى الرئيسية. |  |
| `system.error.retry` | Réessayer | أعيدوا المحاولة |  |
| `system.error.home` | Revenir à l'accueil | العودة إلى الرئيسية |  |
| `system.error.reference` | Référence pour le support : | مرجع الخطأ للدعم: |  |
| `system.notFound.metaTitle` | Page introuvable | صفحة غير موجودة |  |
| `system.notFound.title` | Cette page est introuvable | هذه الصفحة غير موجودة |  |
| `system.notFound.body` | Le lien est peut-être incorrect, ou la page a été déplacée. | ربما الرابط غير صحيح، أو نُقلت الصفحة. |  |
| `system.notFound.home` | Revenir à l'accueil | العودة إلى الرئيسية |  |
| `system.notFound.search` | Chercher une chanson | ابحثوا عن أغنية |  |
| `system.actionFailed.network` | Connexion impossible. Vérifiez votre réseau, puis réessayez. | تعذّر الاتصال. تحقّقوا من الشبكة ثم أعيدوا المحاولة. |  |
| `system.actionFailed.server` | Ghnaya ne répond pas pour le moment. Réessayez dans un instant. | غناية لا تستجيب حاليًا. أعيدوا المحاولة بعد قليل. |  |

**À valider par un arabophone**

- « غناية لا تستجيب حاليًا » : nom de l'app au féminin (« غناية » est féminin). OK ?
- « ربما الرابط غير صحيح، أو نُقلت الصفحة. » : OK ?

## Icônes retournées en arabe

Règle (vérifiée par `tests/unit/i18n/rtlIcons.test.ts`) : une icône se retourne (`rtl:-scale-x-100`) si, et seulement
si, elle indique un sens de lecture ou dessine une liste.

- **Retournées** : chevrons et flèches horizontales (retour, précédent / suivant du lecteur et de la pagination,
  flèches en bout de ligne), entrée et sortie (`LogIn`, `LogOut`), envoi (`Send`), « اقرأ » (`Play`), listes
  (`ListPlus` de « إضافة », `ListMusic` des playlists personnelles et de « قوائمي »).
- **Non retournées** : loupe, croix, coche, plus, horloge, maison, personnes, drapeau, crayon, flèches circulaires
  (« أعيدوا المحاولة », « العودة إلى البداية »), « Aa », traduction, bulle de la note, partage, flèches ↑ ↓ de
  l'édition, logo et couvertures de club.
- Choix à confirmer : `ListMusic` n'était pas retournée (contrairement à `ListPlus`) ; elle l'est maintenant, pour
  que les deux dessins de liste suivent le sens de l'écriture.

## Ce qui a été vérifié

- **Automatiquement** (Vitest) : mêmes clés et mêmes variables ICU en français et en arabe ; aucun chiffre
  arabo-indien ; aucun `#` dans les pluriels (le nombre affiché arrive en chaîne) ; lexique respecté (synonymes
  écartés, clés témoins) ; icônes retournées selon la règle ci-dessus ; `scriptAttrs` (balisage d'un fragment selon
  son écriture).
- **Dans le navigateur, pages rendues par le serveur** : 43 routes × 5 sessions de démonstration en arabe et 2 en
  français, sans erreur serveur, sans chiffre ٠-٩, sans fragment latin hors `dir="ltr"` en arabe ni fragment arabe
  sans `lang="ar"` en français.
- **À l'œil** (arabe, 375 px clair et sombre, 1024 px) : accueil (membre, sans club, visiteur), recherche, feuille et
  toast, fiche chanson avec translittération, lecteur (contrôles, note, écran de fin), playlist et mode édition,
  clubs, membres, réglages, Moi, compte, formulaire de proposition en erreur, file de modération, proposition en
  deux colonnes, signalement, connexion en erreur, 404, erreur, chargement. En français : file de modération,
  membres, écran de fin.

## Hors de cette relecture

- **Langue des fragments latins dans l'interface arabe** : ils sont en `dir="ltr"`, mais sans `lang` (un nom de
  club latin peut être du français ou de l'arabizi) ; un lecteur d'écran arabe les lira avec la voix arabe. À
  trancher à la tâche 21 (accessibilité).
- **Français** : « Approuvée / Rejetée » (modération) et « Acceptée / Refusée » (Mes contributions) désignent le même
  statut d'une proposition ; à unifier si on le souhaite.
