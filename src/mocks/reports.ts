/**
 * MAQUETTE : signalements (`reports`, spec §5), en mémoire en attendant le back-end.
 * Module partagé par la tâche 14 (modération) et la tâche 15 (formulaire « Signaler ») : ne pas le
 * modifier ; étendre dans un autre module si besoin.
 */
export const REPORT_REASONS = ["copyright", "wrong_lyrics", "duplicate", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  id: string;
  songId: string;
  /** Auteur connecté, ou `null` pour un visiteur (qui laisse alors un e-mail). */
  reporterId: string | null;
  contactEmail: string | null;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export type NewReport = Pick<Report, "songId" | "reporterId" | "contactEmail" | "reason" | "details">;

const SEED_REPORTS: Report[] = [
  {
    id: "r-1",
    songId: "s-enta-omri",
    reporterId: null,
    contactEmail: "droits@exemple-editions.com",
    reason: "copyright",
    details: "Nous représentons les ayants droit de cette chanson et demandons son retrait.",
    status: "open",
    resolutionNote: null,
    resolvedBy: null,
    createdAt: "2026-11-17T09:12:00Z",
  },
  {
    id: "r-2",
    songId: "s-ya-lili",
    reporterId: "u-leila",
    contactEmail: null,
    reason: "wrong_lyrics",
    details: "Les deux derniers vers du premier couplet sont inversés.",
    status: "open",
    resolutionNote: null,
    resolvedBy: null,
    createdAt: "2026-11-16T20:40:00Z",
  },
  {
    id: "r-3",
    songId: "s-habaytak",
    reporterId: "u-sami",
    contactEmail: null,
    reason: "duplicate",
    details: "La même chanson existe sous un autre titre latin.",
    status: "open",
    resolutionNote: null,
    resolvedBy: null,
    createdAt: "2026-11-18T07:30:00Z",
  },
  {
    id: "r-4",
    songId: "s-ala-nar",
    reporterId: null,
    contactEmail: "visiteur@example.com",
    reason: "spam",
    details: "Publicité.",
    status: "dismissed",
    resolutionNote: "Signalement sans rapport avec la chanson.",
    resolvedBy: "u-rania",
    createdAt: "2026-11-10T11:05:00Z",
  },
];

const store = globalThis as typeof globalThis & { __ghnayaReports?: Report[] };
const REPORTS: Report[] = (store.__ghnayaReports ??= structuredClone(SEED_REPORTS));

export const listReports = (): readonly Report[] => REPORTS;

export const getReport = (id: string): Report | undefined => REPORTS.find((r) => r.id === id);

export function addReport(input: NewReport, now = new Date().toISOString()): Report {
  const report: Report = {
    ...input,
    id: `r-${crypto.randomUUID()}`,
    status: "open",
    resolutionNote: null,
    resolvedBy: null,
    createdAt: now,
  };
  REPORTS.push(report);
  return report;
}

export function resolveReport(
  id: string,
  change: { status: Exclude<ReportStatus, "open">; note: string | null; by: string },
): Report | undefined {
  const report = getReport(id);
  if (!report) return undefined;
  Object.assign(report, { status: change.status, resolutionNote: change.note, resolvedBy: change.by });
  return report;
}
