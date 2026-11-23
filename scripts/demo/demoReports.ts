import type { ReportReason, ReportStatus } from "@/types/report";

/** Signalements de démonstration, repris de la maquette. Importé par `pnpm seed:demo`, jamais par l'application. */
export interface DemoReport {
  /** Identifiant fictif de la chanson (`s-enta-omri`). */
  song: string;
  /** Clé de la personne qui a signalé ; sans elle, c'est un visiteur, qui a laissé `contactEmail`. */
  reporter?: string;
  contactEmail?: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  /** Clé de la personne qui a traité, pour un signalement traité ou classé. */
  resolvedBy?: string;
  resolutionNote?: string;
  createdAt: string;
}

export const DEMO_REPORTS: DemoReport[] = [
  {
    song: "s-enta-omri",
    contactEmail: "droits@exemple-editions.com",
    reason: "copyright",
    details: "Nous représentons les ayants droit de cette chanson et demandons son retrait.",
    status: "open",
    createdAt: "2026-11-17T09:12:00Z",
  },
  {
    song: "s-ya-lili",
    reporter: "leila",
    reason: "wrong_lyrics",
    details: "Les deux derniers vers du premier couplet sont inversés.",
    status: "open",
    createdAt: "2026-11-16T20:40:00Z",
  },
  {
    song: "s-habaytak",
    reporter: "sami",
    reason: "duplicate",
    details: "La même chanson existe sous un autre titre latin.",
    status: "open",
    createdAt: "2026-11-18T07:30:00Z",
  },
  {
    song: "s-ala-nar",
    contactEmail: "visiteur@example.com",
    reason: "spam",
    details: "Publicité.",
    status: "dismissed",
    resolvedBy: "rania",
    resolutionNote: "Signalement sans rapport avec la chanson.",
    createdAt: "2026-11-10T11:05:00Z",
  },
];
