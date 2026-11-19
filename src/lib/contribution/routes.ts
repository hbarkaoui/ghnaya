import { detectScript } from "@/lib/text/detectScript";
import type { ProposalStatus } from "@/types/proposal";
import { ARTISTS_MAX } from "./validate";

type RawParam = string | string[] | undefined;

const all = (value: RawParam): string[] => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

/** Valeurs de ?statut= (IA, stratégie d'URL) : en français, quelle que soit la langue d'affichage. */
const STATUS_SLUGS: Record<ProposalStatus, string> = {
  pending: "en-attente",
  approved: "acceptee",
  rejected: "refusee",
};

export function parseStatusFilter(raw: RawParam): ProposalStatus | undefined {
  const slug = all(raw)[0];
  return (Object.keys(STATUS_SLUGS) as ProposalStatus[]).find((status) => STATUS_SLUGS[status] === slug);
}

/** Mes contributions, filtrées par statut ; `sent` désigne la proposition qui vient d'être envoyée. */
export function contributionsHref({ status, sent }: { status?: ProposalStatus; sent?: string } = {}): string {
  const params = new URLSearchParams();
  if (status) params.set("statut", STATUS_SLUGS[status]);
  if (sent) params.set("envoyee", sent);
  const query = params.toString();
  return query ? `/mes-contributions?${query}` : "/mes-contributions";
}

/**
 * Connexion, puis retour à `retour` (un chemin interne).
 * En attendant AuthGate (tâche 16), qui vérifiera aussi que `retour` commence par « / ».
 */
export function loginHref(retour: string): string {
  return `/connexion?${new URLSearchParams({ retour }).toString()}`;
}

export interface ContributePrefill {
  titleAr: string;
  titleLatin: string;
  artists: string[];
}

/**
 * Valeurs de départ de /contribuer : ?titre= (transmis par la recherche, ou titres déjà saisis) va
 * dans le titre arabe ou latin selon son écriture ; ?artiste= est répété, un par artiste.
 */
export function prefillFromParams(params: { titre?: RawParam; artiste?: RawParam }): ContributePrefill {
  const titles = all(params.titre).map((t) => t.trim()).filter(Boolean);
  return {
    titleAr: titles.find((t) => detectScript(t) !== "latin") ?? "",
    titleLatin: titles.find((t) => detectScript(t) === "latin") ?? "",
    artists: all(params.artiste)
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, ARTISTS_MAX),
  };
}

/**
 * Adresse de /contribuer avec les titres et artistes saisis. Le formulaire la tient à jour pendant la
 * saisie : l'encadré « existe peut-être déjà » est rendu par le serveur à partir de ces paramètres,
 * et un retour arrière depuis une chanson proche retrouve le titre et les artistes.
 */
export function contributeHref({ titleAr, titleLatin, artists }: ContributePrefill): string {
  const params = new URLSearchParams();
  for (const title of [titleAr, titleLatin].map((t) => t.trim())) if (title) params.append("titre", title);
  for (const artist of artists.map((a) => a.trim())) if (artist) params.append("artiste", artist);
  const query = params.toString();
  return query ? `/contribuer?${query}` : "/contribuer";
}
