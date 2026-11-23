import type { ProposalStatus } from "@/types/proposal";
import type { ReportReason, ReportStatus } from "@/types/report";

/**
 * Ordre des deux files de la modération (IA, « Croissance du contenu ») :
 *  - propositions : de la plus ancienne à la plus récente ;
 *  - signalements : droits d'auteur en tête, puis les autres par ancienneté.
 * L'identifiant départage deux éléments du même instant, pour un ordre stable. Les requêtes en base
 * trient dans le même ordre ; ces fonctions servent à `nextInQueue` et aux listes en mémoire.
 */

type Queued = { id: string; createdAt: string };
type QueuedReport = Queued & { reason: ReportReason };

const byAge = (a: Queued, b: Queued) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export const compareProposals = (a: Queued, b: Queued): number => byAge(a, b);

export const compareReports = (a: QueuedReport, b: QueuedReport): number =>
  Number(b.reason === "copyright") - Number(a.reason === "copyright") || byAge(a, b);

export const proposalQueue = <T extends Queued & { status: ProposalStatus }>(proposals: readonly T[]): T[] =>
  proposals.filter((p) => p.status === "pending").sort(compareProposals);

export const reportQueue = <T extends QueuedReport & { status: ReportStatus }>(reports: readonly T[]): T[] =>
  reports.filter((r) => r.status === "open").sort(compareReports);

/** Nombre de propositions de chaque statut, et en tout : les filtres de Mes contributions. */
export function countByStatus(proposals: readonly { status: ProposalStatus }[]): Record<"all" | ProposalStatus, number> {
  const count = (status: ProposalStatus) => proposals.filter((p) => p.status === status).length;
  return { all: proposals.length, pending: count("pending"), approved: count("approved"), rejected: count("rejected") };
}

/**
 * L'élément à ouvrir après `current` (« Suivante ») : celui qui le suit dans l'ordre de la file, même
 * si `current` vient d'en sortir (relu) ; après le dernier, on revient au premier élément restant
 * (ceux qu'on a passés). `null` quand il ne reste rien d'autre : c'est l'état « Plus rien à relire ».
 */
export function nextInQueue<Item extends { id: string }, Current extends { id: string }>(
  queue: readonly Item[],
  current: Current,
  compare: (a: Item | Current, b: Item | Current) => number,
): Item | null {
  const others = queue.filter((item) => item.id !== current.id);
  return others.find((item) => compare(item, current) > 0) ?? others[0] ?? null;
}
