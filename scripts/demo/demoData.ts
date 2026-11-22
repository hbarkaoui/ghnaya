import type { GlobalRole } from "@/lib/auth/types";
import type { ClubRole } from "@/lib/clubs/membership";

/**
 * Données de démonstration reprises de la maquette. Importé par un script (`pnpm seed:demo`), jamais par l'application.
 * Leïla (membre), Sami (animateur), Nour (membre sans club) et Rania (modératrice) sont les quatre sessions de démonstration.
 */

export interface DemoPerson {
  /** Clé stable, utilisée par les adhésions. */
  key: string;
  name: string;
  /** `<clé>@example.com`. */
  email: string;
  isAnimator?: boolean;
  globalRole?: GlobalRole;
}

const person = (key: string, name: string, extra: Pick<DemoPerson, "isAnimator" | "globalRole"> = {}): DemoPerson => ({
  key,
  name,
  email: `${key}@example.com`,
  ...extra,
});

export const DEMO_PEOPLE: DemoPerson[] = [
  person("sami", "Sami", { isAnimator: true }),
  person("leila", "Leïla"),
  person("nour", "Nour"),
  person("rania", "Rania", { globalRole: "moderator" }),
  person("amira", "Amira Ben Salah"),
  person("karim", "Karim Trabelsi"),
  person("selma", "سلمى"),
  person("hedi", "Hédi Jaziri"),
  person("youssef", "Youssef"),
  person("mohamed", "Mohamed Gharbi", { isAnimator: true }),
  person("walid", "Walid Chaabane"),
  person("ines", "Inès"),
  person("olfa", "Olfa"),
  person("bilel", "بلال"),
  person("mariem", "مريم الزواري"),
  person("rim", "Rim Saïdi", { isAnimator: true }),
  person("aziz", "Aziz"),
  person("dorra", "درة"),
];

/** Codes fixes : /rejoindre/nghw5ntz7a invite dans un club où aucune session de démonstration n'est. */
export const DEMO_CLUBS: { slug: string; name: string; inviteCode: string }[] = [
  { slug: "les-jasmins", name: "Les Jasmins", inviteCode: "q7jasmyn42" },
  { slug: "malouf-sfax", name: "Malouf Sfax", inviteCode: "h4ttzr8wpc" },
  { slug: "chorale-du-bardo", name: "Chorale du Bardo", inviteCode: "b6rdq9kmxe" },
  { slug: "nghanniw", name: "Nghanniw", inviteCode: "nghw5ntz7a" },
];

const m = (club: string, personKey: string, role: ClubRole = "member") => ({ club, person: personKey, role });

export const DEMO_MEMBERSHIPS: { club: string; person: string; role: ClubRole }[] = [
  m("les-jasmins", "sami", "animator"),
  m("les-jasmins", "leila"),
  m("les-jasmins", "rania"),
  m("les-jasmins", "amira"),
  m("les-jasmins", "karim"),
  m("les-jasmins", "selma"),
  m("les-jasmins", "hedi"),
  m("les-jasmins", "youssef"),
  m("malouf-sfax", "sami", "animator"),
  m("malouf-sfax", "mohamed", "animator"),
  m("malouf-sfax", "walid"),
  m("malouf-sfax", "ines"),
  m("chorale-du-bardo", "sami", "animator"),
  m("chorale-du-bardo", "olfa"),
  m("chorale-du-bardo", "bilel"),
  m("chorale-du-bardo", "mariem"),
  m("nghanniw", "rim", "animator"),
  m("nghanniw", "aziz"),
  m("nghanniw", "dorra"),
];

export interface DemoPlaylist {
  name: string;
  /** Slug d'un club de DEMO_CLUBS, ou null pour une playlist personnelle. */
  club: string | null;
  /** Clé de DEMO_PEOPLE pour une playlist personnelle, sinon null. */
  owner: string | null;
  updatedAt: string;
  /** Identifiants fictifs des chansons de la maquette (`s-sidi-mansour`), dans l'ordre. */
  items: { songId: string; note: string | null }[];
}

const songs = (songIds: string[]) => songIds.map((songId) => ({ songId, note: null }));

/** Playlists de la maquette (anciennement `SEED_PLAYLISTS` de `src/mocks/catalog.ts`). */
export const DEMO_PLAYLISTS: DemoPlaylist[] = [
  {
    name: "Séance du jeudi",
    club: "les-jasmins",
    owner: null,
    updatedAt: "2026-11-18T19:30:00Z",
    items: [
      { songId: "s-sidi-mansour", note: "On commence tous ensemble, tonalité Ré." },
      { songId: "s-ala-nar", note: null },
      { songId: "s-ana-wel-azab", note: null },
      { songId: "s-enta-omri", note: "Seulement le 1er couplet." },
      { songId: "s-habaytak", note: null },
      { songId: "s-ya-lella", note: "Les voix de femmes commencent, les hommes reprennent au refrain." },
      { songId: "s-iradat-al-hayat", note: null },
      { songId: "s-taht-el-yasmina", note: null },
      { songId: "s-nassam-alayna", note: null },
      { songId: "s-el-atlal", note: "Lentement." },
      { songId: "s-alf-leila", note: null },
      { songId: "s-ya-lili", note: "Pour finir en rythme." },
    ],
  },
  {
    name: "Répétition malouf",
    club: "malouf-sfax",
    owner: null,
    updatedAt: "2026-11-16T18:00:00Z",
    items: songs(["s-ya-lella", "s-taht-el-yasmina", "s-ana-wel-azab", "s-sidi-mansour", "s-ala-nar"]),
  },
  {
    name: "Soirée de printemps",
    club: "les-jasmins",
    owner: null,
    updatedAt: "2026-11-12T20:00:00Z",
    // La 3e chanson a été retirée : la playlist l'affiche « chanson retirée », le lecteur la saute.
    items: songs(["s-habaytak", "s-nassam-alayna", "s-lamouni", "s-ya-lella", "s-sidi-mansour", "s-alf-leila", "s-ya-lili"]),
  },
  {
    // Playlist vide : « L'animateur n'a pas encore ajouté de chansons ».
    name: "Séance de décembre",
    club: "les-jasmins",
    owner: null,
    updatedAt: "2026-11-08T10:00:00Z",
    items: [],
  },
  {
    name: "Fête de fin d'année",
    club: "chorale-du-bardo",
    owner: null,
    updatedAt: "2026-11-10T17:45:00Z",
    items: songs(["s-sidi-mansour", "s-ya-lili", "s-ala-nar", "s-ya-lella", "s-habaytak", "s-enta-omri", "s-alf-leila", "s-iradat-al-hayat"]),
  },
  {
    name: "Classiques égyptiens",
    club: "malouf-sfax",
    owner: null,
    updatedAt: "2026-11-02T16:00:00Z",
    items: songs(["s-enta-omri", "s-el-atlal", "s-alf-leila", "s-nassam-alayna"]),
  },
  {
    name: "Chants du Bardo",
    club: "chorale-du-bardo",
    owner: null,
    updatedAt: "2026-10-28T19:00:00Z",
    items: songs(["s-iradat-al-hayat", "s-taht-el-yasmina", "s-ya-lella", "s-sidi-mansour", "s-ana-wel-azab", "s-habaytak", "s-ya-lili"]),
  },
  {
    name: "Mes préférées",
    club: null,
    owner: "leila",
    updatedAt: "2026-11-17T21:10:00Z",
    items: songs(["s-habaytak", "s-enta-omri", "s-taht-el-yasmina", "s-sidi-mansour"]),
  },
  {
    name: "À apprendre",
    club: null,
    owner: "leila",
    updatedAt: "2026-11-05T09:00:00Z",
    items: songs(["s-el-atlal", "s-nassam-alayna", "s-alf-leila"]),
  },
];
