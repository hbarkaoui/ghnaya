// Lexique de INFORMATION_ARCHITECTURE.md (« Conventions de nommage ») : un mot par concept, le même partout.
// Outil de test (tâche 20), pas utilisé par l'application. Sert aussi à repérer les termes du lexique
// dans RELECTURE_ARABE.md.

export type Locale = "fr" | "ar";

export interface LexiconEntry {
  concept: string;
  fr: string;
  ar: string;
  /** Formes courantes du terme retenu (pluriel, article, suffixes), pour le repérer dans un libellé. */
  forms: Record<Locale, RegExp>;
  /** Synonymes écartés par le lexique. */
  avoid: Record<Locale, RegExp[]>;
  /** Clés témoins : chacune doit employer le terme retenu (sous la forme indiquée). */
  witnesses: { key: string; fr: string; ar: string }[];
}

// Bornes de mot pour le français (\b ne connaît pas les lettres accentuées).
const word = (pattern: string) => new RegExp(`(?<!\\p{L})(?:${pattern})(?!\\p{L})`, "iu");

export const LEXICON: LexiconEntry[] = [
  {
    concept: "Playlist",
    fr: "Playlist",
    ar: "قائمة",
    forms: { fr: word("playlists?"), ar: /قائم[ةت]|قوائم/ },
    avoid: { fr: [word("setlists?"), word("programmes?")], ar: [/لائحة/, /قائمة (?:ال)?تشغيل/, /بلاي ?ليست/] },
    witnesses: [
      { key: "clubs.tabs.playlists", fr: "Playlists", ar: "القوائم" },
      { key: "addToPlaylist.button", fr: "playlist", ar: "قائمة" },
    ],
  },
  {
    concept: "Séance",
    fr: "Séance",
    ar: "جلسة",
    forms: { fr: word("séances?"), ar: /جلس[ةت]|جلسات/ },
    avoid: { fr: [], ar: [/حصّ?ة/] },
    witnesses: [
      { key: "home.sessions", fr: "séances", ar: "جلسات" },
      { key: "song.sessionMode", fr: "séance", ar: "الجلسة" },
    ],
  },
  {
    concept: "Lecteur",
    fr: "Lecteur",
    ar: "القارئ",
    forms: { fr: word("lecteur"), ar: /القارئ/ },
    avoid: { fr: [], ar: [/مشغّ?ل/] },
    witnesses: [{ key: "reader.close", fr: "lecteur", ar: "القارئ" }],
  },
  {
    concept: "Lire",
    fr: "Lire",
    ar: "اقرأ",
    forms: { fr: word("lire"), ar: /اقرأ/ },
    avoid: { fr: [], ar: [/(?<!م)شغّ?ل/] },
    witnesses: [
      { key: "playlists.read", fr: "Lire", ar: "اقرأ" },
      { key: "playlistPage.readFromStart", fr: "Lire", ar: "اقرأ" },
    ],
  },
  {
    concept: "Club",
    fr: "Club",
    ar: "نادي",
    forms: { fr: word("clubs?"), ar: /ناد[يٍ]|نوادي/ },
    avoid: { fr: [word("chorales?"), word("groupes?")], ar: [/جوقة/, /كورال/, /مجموعة/] },
    witnesses: [
      { key: "nav.clubs", fr: "Clubs", ar: "النوادي" },
      { key: "nav.myClub", fr: "club", ar: "النادي" },
    ],
  },
  {
    concept: "Animateur",
    fr: "Animateur",
    ar: "منشّط",
    forms: { fr: word("animat(?:eur|rice)s?"), ar: /منشّ?ط/ },
    avoid: { fr: [], ar: [/منسّ?ق/] },
    witnesses: [{ key: "clubs.roles.animator", fr: "Animateur", ar: "منشّط" }],
  },
  {
    concept: "Membre",
    fr: "Membre",
    ar: "عضو",
    forms: { fr: word("membres?"), ar: /عضو|أعضاء/ },
    avoid: { fr: [], ar: [] },
    witnesses: [{ key: "clubs.roles.member", fr: "Membre", ar: "عضو" }],
  },
  {
    concept: "Paroles",
    fr: "Paroles",
    ar: "الكلمات",
    forms: { fr: word("paroles"), ar: /كلمات/ },
    avoid: { fr: [], ar: [] },
    witnesses: [{ key: "lyrics.title", fr: "Paroles", ar: "الكلمات" }],
  },
  {
    concept: "Translittération",
    fr: "Translittération",
    ar: "الحروف اللاتينية",
    forms: { fr: word("translittérations?"), ar: /الحروف اللاتينية/ },
    avoid: { fr: [word("transcriptions?")], ar: [/(?:ال)?كتابة (?:ال)?لاتينية/, /نقحرة/] },
    witnesses: [
      { key: "moderation.proposal.translitTitle", fr: "Translittération", ar: "الحروف اللاتينية" },
      { key: "lyrics.translit.auto", fr: "Translittération", ar: "الحروف اللاتينية" },
    ],
  },
  {
    concept: "Proposition",
    fr: "Proposition",
    ar: "اقتراح",
    forms: { fr: word("propos(?:ition|itions|er|ez|ée|ées|é)"), ar: /اقترا?ح/ },
    // « Contribution » ne s'emploie que dans « Mes contributions » ; « مساهماتي » de même.
    avoid: { fr: [/(?<!mes )contributions?/iu], ar: [/مساهم(?!اتي)/] },
    witnesses: [
      { key: "moderation.proposal.title", fr: "Proposition", ar: "اقتراح" },
      { key: "me.propose", fr: "Proposer", ar: "اقتراح" },
    ],
  },
  {
    concept: "Modération",
    fr: "Modération",
    ar: "الإشراف",
    forms: { fr: word("modération"), ar: /الإشراف/ },
    avoid: { fr: [], ar: [/المراقبة/] },
    witnesses: [{ key: "me.moderation", fr: "Modération", ar: "الإشراف" }],
  },
  {
    concept: "Modérateur",
    fr: "Modérateur",
    ar: "مشرف",
    forms: { fr: word("modérat(?:eur|rice)s?"), ar: /مشرف/ },
    avoid: { fr: [], ar: [/مراقب/] },
    witnesses: [{ key: "moderation.proposal.reviewNote", fr: "modérateur", ar: "المشرف" }],
  },
  {
    concept: "Signalement",
    fr: "Signalement",
    ar: "إبلاغ",
    forms: { fr: word("signal(?:ement|ements|er|ez|é|ée)"), ar: /إبلاغ|أبلغ/ },
    avoid: { fr: [], ar: [/(?<!إ)بلاغ/, /تبليغ/] },
    witnesses: [
      { key: "moderation.report.title", fr: "Signalement", ar: "إبلاغ" },
      { key: "song.report", fr: "Signaler", ar: "إبلاغ" },
    ],
  },
  {
    concept: "Source",
    fr: "Source",
    ar: "المصدر",
    forms: { fr: word("sources?"), ar: /مصدر/ },
    avoid: { fr: [], ar: [] },
    witnesses: [{ key: "song.sourceLabel", fr: "Source", ar: "المصدر" }],
  },
  {
    concept: "Dialecte",
    fr: "Dialecte",
    ar: "اللهجة",
    forms: { fr: word("dialectes?"), ar: /لهج/ },
    avoid: { fr: [], ar: [] },
    witnesses: [{ key: "song.dialectLabel", fr: "Dialecte", ar: "اللهجة" }],
  },
];

/** Synonymes écartés trouvés dans les messages : un résultat par clé et par concept. */
export function findLexiconViolations(
  messages: Record<string, string>,
  locale: Locale,
): { key: string; concept: string; found: string }[] {
  return Object.entries(messages).flatMap(([key, text]) =>
    LEXICON.flatMap(({ concept, avoid }) => {
      const match = avoid[locale].map((pattern) => text.match(pattern)).find(Boolean);
      return match ? [{ key, concept, found: match[0] }] : [];
    }),
  );
}

/** Clés témoins qui n'emploient pas le terme retenu (ou qui manquent). */
export function missingLexiconTerms(
  messages: Record<string, string>,
  locale: Locale,
): { key: string; concept: string; expected: string }[] {
  return LEXICON.flatMap(({ concept, witnesses }) =>
    witnesses
      .filter(({ key, [locale]: expected }) => !(messages[key] ?? "").toLowerCase().includes(expected.toLowerCase()))
      .map(({ key, [locale]: expected }) => ({ key, concept, expected })),
  );
}

/** Concepts du lexique présents dans un libellé, triés. */
export const lexiconTermsIn = (text: string, locale: Locale): string[] =>
  LEXICON.filter(({ forms }) => forms[locale].test(text))
    .map(({ concept }) => concept)
    .sort();
