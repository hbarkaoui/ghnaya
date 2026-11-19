import type { InputHTMLAttributes, ReactNode } from "react";
import { useFieldIds } from "./Field";
import { FormError } from "./FormError";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type">;

/**
 * Case à cocher : toute la ligne (case et libellé) est cliquable, sur 44 px de haut au moins.
 * L'erreur s'affiche au-dessus, comme pour les autres champs.
 */
export function Checkbox({
  label,
  hint,
  error,
  id,
  className = "",
  ...input
}: { label: ReactNode; hint?: ReactNode; error?: string; id?: string; className?: string } & CheckboxProps) {
  const { hintId, errorId, aria } = useFieldIds(id, hint, error);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {error ? <FormError id={errorId}>{error}</FormError> : null}
      <label
        htmlFor={aria.id}
        className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md py-2 ${error ? "border-s-2 border-error ps-3" : ""}`}
      >
        <input type="checkbox" {...input} {...aria} className="mt-0.5 size-6 shrink-0 cursor-pointer accent-accent" />
        <span className="flex flex-col gap-1">
          <span className="text-ink">{label}</span>
          {hint ? (
            <span id={hintId} className="text-sm text-ink-2">
              {hint}
            </span>
          ) : null}
        </span>
      </label>
    </div>
  );
}
