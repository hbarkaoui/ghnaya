"use client";

import { Check, Info, LoaderCircle, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import type { TranslitView } from "@/lib/translit/state";

/** « reader » : couleurs du lecteur (sombre par défaut) ; « page » : couleurs de l'app (fiche chanson). */
export type LyricsTone = "reader" | "page";

const TONES = {
  reader: {
    box: "bg-reader-control text-reader-control-ink",
    // Bouton « Réessayer » : 48 px dans le lecteur (brief), 44 px ailleurs.
    retry: "min-h-12 focus-visible:outline-reader-focus",
    generating: "reader",
    auto: "reader",
    reviewed: "reader",
  },
  page: {
    box: "bg-well text-ink",
    retry: "min-h-11",
    generating: "neutral",
    auto: "info",
    reviewed: "success",
  },
} as const;

/**
 * État de la translittération au-dessus des paroles : génération en cours (l'arabe reste affiché),
 * automatique (« peut contenir des erreurs ») ou relue, échec avec « Réessayer », limite quotidienne.
 * Rien en mode arabe seul. Chaque état porte un libellé, jamais une couleur seule.
 */
export function TranslitStatus({
  view,
  status,
  onRetry,
  tone,
}: {
  view: TranslitView;
  status: "auto" | "reviewed" | null;
  onRetry: () => void;
  tone: LyricsTone;
}) {
  const t = useTranslations("lyrics.translit");
  const styles = TONES[tone];

  if (view === "generating") {
    return (
      <p role="status" className="mb-5">
        <Badge tone={styles.generating} icon={<LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}>
          {t("generating")}
        </Badge>
      </p>
    );
  }

  if (view === "ready" && status) {
    return (
      <p className="mb-5">
        <Badge
          tone={styles[status]}
          icon={
            status === "auto" ? <Info aria-hidden="true" className="size-4" /> : <Check aria-hidden="true" className="size-4" />
          }
        >
          {status === "auto" ? t("auto") : t("reviewed")}
        </Badge>
      </p>
    );
  }

  if (view === "failed") {
    return (
      <div role="alert" className={`mb-5 rounded-md p-3 text-sm ${styles.box}`}>
        <p>{t("failed")}</p>
        <button
          type="button"
          onClick={onRetry}
          className={`mt-1 inline-flex items-center gap-2 rounded-md px-1 font-medium underline underline-offset-4 ${styles.retry}`}
        >
          <RotateCw aria-hidden="true" className="size-4" />
          {t("retry")}
        </button>
      </div>
    );
  }

  if (view === "limit") {
    return (
      <p role="status" className={`mb-5 rounded-md p-3 text-sm ${styles.box}`}>
        {t("limit")}
      </p>
    );
  }

  return null;
}
