import type { Report } from "@/mocks/reports";
import type { Proposal } from "@/types/proposal";

/**
 * Ordre des deux files de la modération (IA, « Croissance du contenu ») :
 *  - propositions : de la plus ancienne à la plus récente ;
 *  - signalements : droits d'auteur en tête, puis les autres par ancienneté.
 * L'identifiant départage deux éléments du même instant, pour un ordre stable.
 */

type Comparable = Pick<Proposal | Report, "id" | "createdAt">;
const byAge = (a: Comparable, b: Comparable) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export const compareProposals = (a: Proposal, b: Proposal): number => byAge(a, b);

export const compareReports = (a: Report, b: Report): number =>
  Number(b.reason === "copyright") - Number(a.reason === "copyright") || byAge(a, b);

export const proposalQueue = (proposals: readonly Proposal[]): Proposal[] =>
  proposals.filter((p) => p.status === "pending").sort(compareProposals);

export const reportQueue = (reports: readonly Report[]): Report[] =>
  reports.filter((r) => r.status === "open").sort(compareReports);

/**
 * L'élément à ouvrir après `current` (« Suivante ») : celui qui le suit dans l'ordre de la file, même
 * si `current` vient d'en sortir (relu) ; après le dernier, on revient au premier élément restant
 * (ceux qu'on a passés). `null` quand il ne reste rien d'autre : c'est l'état « Plus rien à relire ».
 */
export function nextInQueue<T extends { id: string }>(
  queue: readonly T[],
  current: T,
  compare: (a: T, b: T) => number,
): T | null {
  const others = queue.filter((item) => item.id !== current.id);
  return others.find((item) => compare(item, current) > 0) ?? others[0] ?? null;
}
