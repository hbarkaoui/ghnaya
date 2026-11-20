import type { ArtistRef, Playlist, Song } from "@/types/catalog";
import { STORED_TRANSLIT, TRANSLIT_TEXTS } from "./translit";

/**
 * Données fictives de la maquette, en attendant le back-end des plans 1 à 4.
 *
 * Les titres et les artistes sont réels. Les PAROLES SONT INVENTÉES pour la maquette, à une exception :
 * « إرادة الحياة » d'Abou el Kacem Chebbi (mort en 1934), dans le domaine public. Ne jamais remplacer
 * ces textes par de vraies paroles protégées.
 */

const artist = (id: string, nameAr: string, nameLatin: string): ArtistRef => ({
  id,
  nameAr,
  nameLatin,
  role: "main",
});

const SABER = artist("a-saber", "صابر الرباعي", "Saber Rebai");
const BOUCHNAK = artist("a-bouchnak", "لطفي بوشناق", "Lotfi Bouchnak");
const OUM = artist("a-oum", "أم كلثوم", "Oum Kalthoum");
const FAIRUZ = artist("a-fairuz", "فيروز", "Fairuz");
const JOUINI = artist("a-jouini", "الهادي الجويني", "Hedi Jouini");
const CHEBBI = artist("a-chebbi", "أبو القاسم الشابي", "Abou el Kacem Chebbi");
const BALTI = artist("a-balti", "بلطي", "Balti");

const RAW_SONGS: Omit<Song, "lyricsTranslit" | "translitStatus">[] = [
  {
    id: "s-sidi-mansour",
    titleAr: "سيدي منصور",
    titleLatin: "Sidi Mansour",
    dialect: "tn",
    source: "lrclib",
    artists: [SABER],
    lyrics: `يا ليل طوّل شوية
خلّي الغناية تكمّل
نغنّيو مع بعضنا
والقلب فرحان ومهلّل

يا قمر ضوّي علينا
والنجوم تسهر معانا`,
  },
  {
    id: "s-ala-nar",
    titleAr: "على نار",
    titleLatin: null,
    dialect: "tn",
    source: "lrclib",
    artists: [SABER],
    lyrics: `نستنّى الصباح يطلّ
والشوق في قلبي ما ارتاح
نكتب اسمك في الرياح
ونرجع نغنّي من جديد

يا ليلي طوّل شوية
خلّي الكلمة تبقى بينا`,
  },
  {
    id: "s-ana-wel-azab",
    titleAr: "أنا والعذاب",
    titleLatin: "Ana Wel 3azab",
    dialect: "tn",
    source: "lrclib",
    artists: [BOUCHNAK],
    lyrics: `الليل والذكريات
نحكيو على اللي فات
والغناية تجمعنا
كيف الورد في الجنينات

نرجعو للكلمة الحلوة
ونسهرو حتى الصباح`,
  },
  {
    id: "s-enta-omri",
    titleAr: "انت عمري",
    titleLatin: null,
    dialect: "eg",
    source: "lrclib",
    artists: [OUM],
    lyrics: `رجعت أغنّي من تاني
والقلب صافي وهاني
والليل يسمع كلامي
والفرح نور زماني

يا ليل خلّيك معانا
لحد ما يطلع نهار`,
  },
  {
    id: "s-habaytak",
    titleAr: "حبيتك بالصيف",
    titleLatin: "Habaytak Bel Saif",
    dialect: "lev",
    source: "lrclib",
    artists: [FAIRUZ],
    lyrics: `على البحر كنا نغنّي
تحت الشجر والسما
ونرجع آخر الليل
نحكي عن القمر

والضيعة ناطرتنا
والطريق بعدو طويل`,
  },
  {
    id: "s-ya-lella",
    titleAr: "يا لالة",
    titleLatin: "Ya Lella",
    dialect: "tn",
    source: "lrclib",
    artists: [JOUINI],
    lyrics: `يا لالة غنّيلي
غنّيلي غنية حلوة
خلّي الدار تضوي
والأحباب يتلمّوا

يا لالة يا لالة
الليلة ليلة فرح`,
  },
  {
    id: "s-iradat-al-hayat",
    titleAr: "إرادة الحياة",
    titleLatin: "Iradat al Hayat",
    dialect: "msa",
    source: "public_domain",
    artists: [CHEBBI],
    lyrics: `إذا الشعب يوما أراد الحياة
فلا بد أن يستجيب القدر

ولا بد لليل أن ينجلي
ولا بد للقيد أن ينكسر`,
  },
  {
    id: "s-taht-el-yasmina",
    titleAr: "تحت الياسمينة",
    titleLatin: "Taht el Yasmina",
    dialect: "tn",
    source: "lrclib",
    artists: [JOUINI],
    lyrics: `والريح تجيب الريحة
من الجنينة للدار
نغنّيو للّي غايب
والكلمة تمشي صحيحة

يا ياسمينة يا بيضا
خلّي الليل يطوّل`,
  },
  {
    id: "s-nassam-alayna",
    titleAr: "نسّم علينا الهوا",
    titleLatin: "Nassam Alayna el Hawa",
    dialect: "lev",
    source: "lrclib",
    artists: [FAIRUZ],
    lyrics: `يا هوا خدنا معك
عالضيعة اللي منحبّها
والقمر سهران هونيك
والغنية بتحرسها`,
  },
  {
    id: "s-el-atlal",
    titleAr: "الأطلال",
    titleLatin: "El Atlal",
    dialect: "eg",
    source: "lrclib",
    artists: [OUM],
    lyrics: `الليل طويل والسهر حلو
والكلمة تجمع اللي بعيد
نغنّي للدار وللناس
ونرجع للحكاية من جديد

الليل طويل والسهر حلو
والكلمة تجمع اللي بعيد
نغنّي للدار وللناس
ونرجع للحكاية من جديد

يا ليل يا عين
خلّي الغنوة تكمل`,
  },
  {
    id: "s-alf-leila",
    titleAr: "ألف ليلة وليلة",
    titleLatin: "Alf Leila wa Leila",
    dialect: "eg",
    source: "lrclib",
    artists: [OUM],
    lyrics: `الليلة دي ليلة فرح
والقلوب كلها هنا
نغنّي ونفرح سوا
والصبح لسه بعيد`,
  },
  {
    id: "s-ya-lili",
    titleAr: null,
    titleLatin: "Ya Lili",
    dialect: "tn",
    source: "lrclib",
    artists: [BALTI],
    lyrics: `نمشي في الحومة بالليل
ونغنّي على الزمان
الصحاب الكل معايا
والدنيا تولّي أمان`,
  },
];

/**
 * Chansons publiées et retirées, rangées sur globalThis comme les playlists (voir plus bas) : la
 * modération (tâche 14) en publie, en corrige et en retire, et toutes les copies du module doivent
 * voir ces changements. Un redémarrage du serveur revient au jeu de départ.
 */
const songMemory = globalThis as typeof globalThis & {
  __ghnayaSongs?: Song[];
  __ghnayaRemovedSongs?: Pick<Song, "id" | "titleAr" | "titleLatin" | "artists">[];
};

/** Les translittérations déjà en base : relue pour Chebbi, automatiques pour deux chansons, absentes sinon. */
export const SONGS: Song[] = (songMemory.__ghnayaSongs ??= RAW_SONGS.map((song) => {
  const stored = STORED_TRANSLIT[song.id];
  return stored
    ? { ...song, lyricsTranslit: TRANSLIT_TEXTS[song.id] ?? null, translitStatus: stored }
    : { ...song, lyricsTranslit: null, translitStatus: "none" };
}));

/**
 * Chansons retirées (spec §5, retrait doux : `status = removed`). Elles ne sont ni cherchables ni
 * lisibles, et leur fiche répond « introuvable ou retirée » (`getSong` ne les renvoie pas). Une playlist
 * qui en contient une l'affiche « chanson retirée », sans lien vers le lecteur.
 */
export const REMOVED_SONGS: Pick<Song, "id" | "titleAr" | "titleLatin" | "artists">[] = (songMemory.__ghnayaRemovedSongs ??= [
  { id: "s-lamouni", titleAr: "لاموني اللي غاروا مني", titleLatin: "Lamouni Elli Gharou Menni", artists: [JOUINI] },
]);

/** Propriétaire des playlists personnelles de la maquette : Leïla, le membre de démonstration (mocks/session). */
const LEILA_ID = "u-leila";

const LES_JASMINS = { slug: "les-jasmins", name: "Les Jasmins" };
const MALOUF_SFAX = { slug: "malouf-sfax", name: "Malouf Sfax" };
const CHORALE_DU_BARDO = { slug: "chorale-du-bardo", name: "Chorale du Bardo" };

/** Clubs fictifs qui ont des playlists dans la maquette. */
export const CLUBS = [LES_JASMINS, MALOUF_SFAX, CHORALE_DU_BARDO];

const items = (songIds: string[]) => songIds.map((songId, i) => ({ position: i + 1, songId, note: null }));

const SEED_PLAYLISTS: Playlist[] = [
  {
    id: "seance-du-jeudi",
    name: "Séance du jeudi",
    club: LES_JASMINS,
    ownerId: null,
    items: [
      { position: 1, songId: "s-sidi-mansour", note: "On commence tous ensemble, tonalité Ré." },
      { position: 2, songId: "s-ala-nar", note: null },
      { position: 3, songId: "s-ana-wel-azab", note: null },
      { position: 4, songId: "s-enta-omri", note: "Seulement le 1er couplet." },
      { position: 5, songId: "s-habaytak", note: null },
      { position: 6, songId: "s-ya-lella", note: "Les voix de femmes commencent, les hommes reprennent au refrain." },
      { position: 7, songId: "s-iradat-al-hayat", note: null },
      { position: 8, songId: "s-taht-el-yasmina", note: null },
      { position: 9, songId: "s-nassam-alayna", note: null },
      { position: 10, songId: "s-el-atlal", note: "Lentement." },
      { position: 11, songId: "s-alf-leila", note: null },
      { position: 12, songId: "s-ya-lili", note: "Pour finir en rythme." },
    ],
    updatedAt: "2026-11-18T19:30:00Z",
  },
  {
    id: "repetition-malouf",
    name: "Répétition malouf",
    club: MALOUF_SFAX,
    ownerId: null,
    items: items(["s-ya-lella", "s-taht-el-yasmina", "s-ana-wel-azab", "s-sidi-mansour", "s-ala-nar"]),
    updatedAt: "2026-11-16T18:00:00Z",
  },
  {
    id: "soiree-de-printemps",
    name: "Soirée de printemps",
    club: LES_JASMINS,
    ownerId: null,
    // La 3e chanson a été retirée : la playlist l'affiche « chanson retirée », le lecteur la saute.
    items: items(["s-habaytak", "s-nassam-alayna", "s-lamouni", "s-ya-lella", "s-sidi-mansour", "s-alf-leila", "s-ya-lili"]),
    updatedAt: "2026-11-12T20:00:00Z",
  },
  {
    // Playlist vide : « L'animateur n'a pas encore ajouté de chansons ».
    id: "seance-de-decembre",
    name: "Séance de décembre",
    club: LES_JASMINS,
    ownerId: null,
    items: [],
    updatedAt: "2026-11-08T10:00:00Z",
  },
  {
    id: "fete-de-fin-d-annee",
    name: "Fête de fin d'année",
    club: CHORALE_DU_BARDO,
    ownerId: null,
    items: items(["s-sidi-mansour", "s-ya-lili", "s-ala-nar", "s-ya-lella", "s-habaytak", "s-enta-omri", "s-alf-leila", "s-iradat-al-hayat"]),
    updatedAt: "2026-11-10T17:45:00Z",
  },
  {
    id: "classiques-egyptiens",
    name: "Classiques égyptiens",
    club: MALOUF_SFAX,
    ownerId: null,
    items: items(["s-enta-omri", "s-el-atlal", "s-alf-leila", "s-nassam-alayna"]),
    updatedAt: "2026-11-02T16:00:00Z",
  },
  {
    id: "chants-du-bardo",
    name: "Chants du Bardo",
    club: CHORALE_DU_BARDO,
    ownerId: null,
    items: items(["s-iradat-al-hayat", "s-taht-el-yasmina", "s-ya-lella", "s-sidi-mansour", "s-ana-wel-azab", "s-habaytak", "s-ya-lili"]),
    updatedAt: "2026-10-28T19:00:00Z",
  },
  {
    id: "mes-preferees",
    name: "Mes préférées",
    club: null,
    ownerId: LEILA_ID,
    items: items(["s-habaytak", "s-enta-omri", "s-taht-el-yasmina", "s-sidi-mansour"]),
    updatedAt: "2026-11-17T21:10:00Z",
  },
  {
    id: "a-apprendre",
    name: "À apprendre",
    club: null,
    ownerId: LEILA_ID,
    items: items(["s-el-atlal", "s-nassam-alayna", "s-alf-leila"]),
    updatedAt: "2026-11-05T09:00:00Z",
  },
];

/**
 * MAQUETTE : les playlists vivent en mémoire, et la feuille « Ajouter à une playlist » y ajoute des
 * chansons et en crée (src/mocks/playlistMemory.ts). Le tableau est rangé sur globalThis : Next peut
 * charger ce module plusieurs fois (pages, actions serveur, rechargement à chaud), et toutes ces
 * copies doivent lire les mêmes playlists. Un redémarrage du serveur revient au jeu de départ.
 */
const memory = globalThis as typeof globalThis & { __ghnayaPlaylists?: Playlist[] };
export const PLAYLISTS: Playlist[] = (memory.__ghnayaPlaylists ??= SEED_PLAYLISTS);

export const getSong = (id: string): Song | undefined => SONGS.find((s) => s.id === id);
export const getPlaylist = (id: string): Playlist | undefined => PLAYLISTS.find((p) => p.id === id);
export const getRemovedSong = (id: string) => REMOVED_SONGS.find((s) => s.id === id);
