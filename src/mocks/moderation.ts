import { proposalQueue, reportQueue } from "@/lib/moderation/queue";
import { CONTRIBUTOR_NAMES } from "./moderationSeed";
import { proposalStore } from "./proposals";
import { listReports } from "./reports";

/**
 * MAQUETTE : lectures de la modération (tâche 14) sur les données en mémoire : les deux files, leur
 * taille (compteur de la page Moi) et le nom des auteurs.
 */

export const pendingProposals = () => proposalQueue(proposalStore.listPending());
export const openReports = () => reportQueue(listReports());

/** Éléments en file, propositions et signalements : le compteur « N à relire » de la page Moi. */
export const moderationQueueSize = (): number => pendingProposals().length + openReports().length;

/** Personnes de la maquette : les quatre personnes de démonstration, puis les contributeurs. */
const NAMES: Record<string, string> = {
  "u-leila": "Leïla",
  "u-sami": "Sami",
  "u-nour": "Nour",
  "u-rania": "Rania",
  ...CONTRIBUTOR_NAMES,
};

/** Nom affiché d'un auteur, ou `null` s'il est inconnu (compte supprimé : « sans votre nom »). */
export const personName = (userId: string): string | null => NAMES[userId] ?? null;
