"use client";

import { CircleAlert } from "lucide-react";
import { useId, type Ref } from "react";

export interface ErrorSummaryItem {
  /** Identifiant du champ à corriger (son `id`). Sans cible, le message s'affiche sans lien. */
  fieldId?: string;
  message: string;
}

/**
 * Récapitulatif des erreurs, en tête de formulaire après un envoi refusé. Le formulaire y place le
 * focus (`ref`) pour que le lecteur d'écran le lise ; chaque lien place le focus sur son champ.
 */
export function FormErrorSummary({
  title,
  items,
  ref,
}: {
  title: string;
  items: readonly ErrorSummaryItem[];
  ref?: Ref<HTMLDivElement>;
}) {
  const titleId = useId();
  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="rounded-lg border-2 border-error bg-error-soft p-4 focus-visible:outline-offset-4"
    >
      <h2 id={titleId} className="flex items-start gap-2 font-medium text-error">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        {title}
      </h2>
      <ul className="mt-2 flex flex-col ps-7">
        {items.map((item, i) => (
          <li key={i}>
            {item.fieldId ? (
              <a
                href={`#${item.fieldId}`}
                onClick={(e) => {
                  const field = document.getElementById(item.fieldId!);
                  if (!field) return;
                  e.preventDefault();
                  // Un groupe (fieldset) donne le focus à son premier champ.
                  const target = field.matches("input, textarea, select")
                    ? field
                    : field.querySelector<HTMLElement>("input, textarea, select");
                  field.scrollIntoView({ block: "center" });
                  target?.focus({ preventScroll: true });
                }}
                className="inline-flex min-h-11 items-center text-ink underline underline-offset-4"
              >
                {item.message}
              </a>
            ) : (
              <p className="py-2.5 text-ink">{item.message}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
