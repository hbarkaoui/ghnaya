import type { Proposal, ProposalPayload, ProposalStatus } from "@/types/proposal";
import { getSong } from "./catalog";

/**
 * Propositions fictives, en mémoire, en attendant la table `song_revisions` (plan 3).
 * Les paroles sont inventées, comme le reste des données fictives.
 */

const JOUINI = { id: "a-jouini", nameAr: "الهادي الجويني", nameLatin: "Hedi Jouini" };
const SABER = { id: "a-saber", nameAr: "صابر الرباعي", nameLatin: "Saber Rebai" };

const yaLella = getSong("s-ya-lella");

export const SEED_PROPOSALS: Proposal[] = [
  {
    id: "p-lamouni",
    songId: null,
    authorId: "u-leila",
    payload: {
      titleAr: "لاموني اللي غاروا مني",
      titleLatin: "Lamouni Elli Gharou Menni",
      artists: [JOUINI],
      lyrics: `قالوا عليّ كلام كثير
وأنا نغنّي ونسامح
والليل يسمع غنايتي
والقلب ديما فرحان`,
      lyricsTranslit: null,
      dialect: "tn",
    },
    rightsDeclared: true,
    status: "pending",
    reviewNote: null,
    createdAt: "2026-11-18T20:15:00Z",
    reviewedAt: null,
  },
  {
    id: "p-ya-lella-translit",
    songId: "s-ya-lella",
    authorId: "u-leila",
    payload: {
      titleAr: yaLella?.titleAr ?? "يا لالة",
      titleLatin: yaLella?.titleLatin ?? "Ya Lella",
      artists: [JOUINI],
      lyrics: yaLella?.lyrics ?? "",
      lyricsTranslit: `ya lella ghannili
ghannili ghnaya helwa
khalli ed-dar tdhawi
wel a7bab yetlammou

ya lella ya lella
el lila lilet fra7`,
      dialect: "tn",
    },
    rightsDeclared: true,
    status: "approved",
    reviewNote: null,
    createdAt: "2026-11-08T18:40:00Z",
    reviewedAt: "2026-11-10T09:05:00Z",
  },
  {
    id: "p-sidi-mansour-doublon",
    songId: null,
    authorId: "u-leila",
    payload: {
      titleAr: "سيدي منصور",
      titleLatin: "Sidi Mansour",
      artists: [SABER],
      lyrics: `يا ليل طوّل شوية
خلّي الغناية تكمّل`,
      lyricsTranslit: null,
      dialect: "tn",
    },
    rightsDeclared: true,
    status: "rejected",
    reviewNote:
      "Cette chanson est déjà dans Ghnaya. Pour la compléter, ouvrez sa fiche et touchez « Proposer une correction ».",
    createdAt: "2026-11-03T21:00:00Z",
    reviewedAt: "2026-11-04T08:30:00Z",
  },
];

export interface NewProposal {
  authorId: string;
  songId: string | null;
  payload: ProposalPayload;
}

export function createProposalStore(seed: readonly Proposal[]) {
  const items: Proposal[] = [...seed];
  return {
    add({ authorId, songId, payload }: NewProposal, now = new Date()): Proposal {
      const proposal: Proposal = {
        id: crypto.randomUUID(),
        songId,
        authorId,
        payload,
        rightsDeclared: true,
        status: "pending",
        reviewNote: null,
        createdAt: now.toISOString(),
        reviewedAt: null,
      };
      items.push(proposal);
      return proposal;
    },
    get: (id: string): Proposal | undefined => items.find((p) => p.id === id),
    /** De la plus récente à la plus ancienne. */
    listFor: (authorId: string): Proposal[] =>
      items.filter((p) => p.authorId === authorId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    /** Une seule correction en attente par auteur et par chanson (spec §8.3). */
    hasPending: (authorId: string, songId: string): boolean =>
      items.some((p) => p.authorId === authorId && p.songId === songId && p.status === "pending"),
  };
}

export type ProposalStore = ReturnType<typeof createProposalStore>;

/**
 * Magasin partagé par les pages et les actions serveur. Gardé sur globalThis pour survivre au
 * rechargement à chaud du serveur de développement ; il repart des exemples à chaque redémarrage.
 */
const globalStore = globalThis as typeof globalThis & { __ghnayaProposals?: ProposalStore };
export const proposalStore: ProposalStore = (globalStore.__ghnayaProposals ??= createProposalStore(SEED_PROPOSALS));

export function countByStatus(proposals: readonly Proposal[]): Record<"all" | ProposalStatus, number> {
  const count = (status: ProposalStatus) => proposals.filter((p) => p.status === status).length;
  return { all: proposals.length, pending: count("pending"), approved: count("approved"), rejected: count("rejected") };
}

/** Date d'une proposition, dans la langue de l'interface ; chiffres occidentaux en arabe (usage tunisien). */
export function formatProposalDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Tunis",
  }).format(new Date(iso));
}
