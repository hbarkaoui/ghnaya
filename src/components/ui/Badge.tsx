import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "reader";

const TONES: Record<Tone, string> = {
  neutral: "bg-well text-ink-2",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
  // Dans le lecteur, qui a ses propres couleurs (sombre par défaut, indépendant du thème de l'app).
  reader: "bg-reader-control text-reader-control-ink",
};

/**
 * Pastille de statut. Elle porte toujours un libellé texte : la couleur seule ne signale jamais
 * un statut (accessibilité, brief).
 */
export function Badge({
  tone = "neutral",
  icon,
  children,
  className = "",
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
