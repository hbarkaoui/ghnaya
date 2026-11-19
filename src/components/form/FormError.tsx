import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Erreur d'un champ, affichée sous son libellé et reliée au champ par `aria-describedby` (`id`).
 * Toujours un texte et une icône : la couleur seule ne signale jamais une erreur.
 */
export function FormError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-medium text-error">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
