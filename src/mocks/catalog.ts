import type { ArtistRef, Playlist, Song } from "@/types/catalog";

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

export const SONGS: Song[] = [
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

export const PLAYLISTS: Playlist[] = [
  {
    id: "seance-du-jeudi",
    name: "Séance du jeudi",
    club: { slug: "les-jasmins", name: "Les Jasmins" },
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
  },
];

export const getSong = (id: string): Song | undefined => SONGS.find((s) => s.id === id);
export const getPlaylist = (id: string): Playlist | undefined => PLAYLISTS.find((p) => p.id === id);
