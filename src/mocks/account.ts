import { getClub, memberships } from "./clubStore";
import type { DemoUser } from "./session";

/**
 * MAQUETTE : données du compte pour la page « Moi » (tâche 12), en attendant le plan 2 (comptes),
 * les contributions (tâche 13) et la file de modération (tâche 14). Les compteurs sont fictifs.
 */

export interface ClubRef {
  slug: string;
  name: string;
}

export interface DemoAccount {
  email: string;
  /** Propositions de l'utilisateur encore en attente de relecture (« Mes contributions »). */
  pendingContributions: number;
}

const ACCOUNTS: Record<string, DemoAccount> = {
  "u-leila": { email: "leila@example.com", pendingContributions: 2 },
  "u-sami": { email: "sami@example.com", pendingContributions: 0 },
  "u-nour": { email: "nour@example.com", pendingContributions: 0 },
  "u-rania": { email: "rania@example.com", pendingContributions: 1 },
};

/** Taille de la file de modération, montrée aux modérateurs seulement. */
export const MODERATION_QUEUE_SIZE = 7;

/** Nom d'un club, lu dans les clubs en mémoire (clubStore). */
const clubRef = (slug: string): ClubRef => ({ slug, name: getClub(slug)?.name ?? slug });

/** Les clubs de l'utilisateur (un seul pour un membre), dans l'ordre de ses adhésions. */
export const clubsOf = (user: DemoUser): ClubRef[] => user.clubSlugs.map(clubRef);

/**
 * Les clubs dont l'utilisateur est le seul animateur, d'après les adhésions en mémoire (clubStore).
 * Tant que la liste n'est pas vide, il ne peut pas supprimer son compte (spec §12) : il doit d'abord
 * désigner un autre animateur ou supprimer le club.
 */
export const soleAnimatorClubs = (user: DemoUser): ClubRef[] =>
  clubsOf(user).filter(({ slug }) => {
    const animators = memberships().filter((m) => m.clubSlug === slug && m.role === "animator");
    return animators.length === 1 && animators[0].userId === user.id;
  });

export const accountFor = (user: DemoUser): DemoAccount =>
  ACCOUNTS[user.id] ?? { email: `${user.id}@example.com`, pendingContributions: 0 };
