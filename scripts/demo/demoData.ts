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
