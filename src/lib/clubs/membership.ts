/**
 * Règle des clubs (spec §5 et §10, rectification du 19/11/2026), en fonctions pures.
 *  - Un membre appartient à un seul club : en rejoindre un autre lui fait quitter le premier, après confirmation.
 *  - Un animateur (rôle global `is_animator`, attribué par un admin) rejoint le club en plus des siens.
 *  - Un club garde toujours au moins un animateur : le dernier animateur ne peut pas partir.
 * Le plan 2 appliquera la même règle dans la transaction d'adhésion (`lib/clubs`).
 */

export type ClubRole = "animator" | "member";

export interface Membership {
  clubSlug: string;
  userId: string;
  role: ClubRole;
}

/** La personne qui rejoint : son identifiant et son rôle global d'animateur. */
export interface Joiner {
  id: string;
  isAnimator: boolean;
}

export type JoinDecision =
  | { kind: "join" }
  | { kind: "switch"; leaving: string[] }
  | { kind: "already-member" }
  | { kind: "blocked"; reason: "last-animator"; club: string };

export type JoinResult =
  | { ok: true; memberships: Membership[]; left: string[] }
  | { ok: false; reason: "already-member" }
  | { ok: false; reason: "last-animator"; club: string };

const animatorsOf = (memberships: readonly Membership[], clubSlug: string) =>
  memberships.filter((m) => m.clubSlug === clubSlug && m.role === "animator");

/** Vrai si `userId` est le seul animateur du club. */
export const isLastAnimator = (memberships: readonly Membership[], clubSlug: string, userId: string) => {
  const animators = animatorsOf(memberships, clubSlug);
  return animators.length === 1 && animators[0].userId === userId;
};

/** Ce que l'adhésion à `clubSlug` impliquerait, sans rien changer : de quoi afficher la bonne confirmation. */
export function decideJoin(memberships: readonly Membership[], user: Joiner, clubSlug: string): JoinDecision {
  const current = memberships.filter((m) => m.userId === user.id).map((m) => m.clubSlug);
  if (current.includes(clubSlug)) return { kind: "already-member" };
  if (user.isAnimator || current.length === 0) return { kind: "join" };

  const stuck = current.find((slug) => isLastAnimator(memberships, slug, user.id));
  if (stuck) return { kind: "blocked", reason: "last-animator", club: stuck };
  return { kind: "switch", leaving: current };
}

/** Applique l'adhésion : remplace le club d'un membre, ajoute le club d'un animateur, refuse sinon. */
export function join(memberships: readonly Membership[], user: Joiner, clubSlug: string): JoinResult {
  const decision = decideJoin(memberships, user, clubSlug);
  if (decision.kind === "already-member") return { ok: false, reason: "already-member" };
  if (decision.kind === "blocked") return { ok: false, reason: "last-animator", club: decision.club };

  const left = decision.kind === "switch" ? decision.leaving : [];
  const kept = memberships.filter((m) => !(m.userId === user.id && left.includes(m.clubSlug)));
  return { ok: true, memberships: [...kept, { clubSlug, userId: user.id, role: "member" }], left };
}

/** Donne le rôle d'animateur du club à l'un de ses membres. */
export const promoteToAnimator = (memberships: readonly Membership[], clubSlug: string, userId: string): Membership[] =>
  memberships.map((m) => (m.clubSlug === clubSlug && m.userId === userId ? { ...m, role: "animator" } : m));
