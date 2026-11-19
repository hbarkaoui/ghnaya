import { useId, type ReactNode } from "react";
import { FormError } from "./FormError";

/**
 * Socle commun des champs de formulaire : libellé, aide, erreur, puis le contrôle.
 * L'erreur se place au-dessus du contrôle, pour rester visible au-dessus du clavier et d'une
 * longue zone de saisie (paroles).
 */

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  /** Message d'erreur déjà traduit ; le champ passe alors en `aria-invalid`. */
  error?: string;
  /** Identifiant du contrôle ; généré sinon. Sert de cible au récapitulatif des erreurs (`#id`). */
  id?: string;
  className?: string;
}

/** Attributs à poser sur le contrôle pour le relier à son aide et à son erreur. */
export interface ControlAria {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

/** Classes du contrôle (champ, zone de saisie, liste) : 16 px minimum, pour que iOS ne zoome pas. */
export const CONTROL_CLASS =
  "w-full rounded-md border border-line bg-well px-3 text-base text-ink placeholder:text-ink-3 transition-colors duration-(--duration-fast) aria-invalid:border-2 aria-invalid:border-error";

export function useFieldIds(id: string | undefined, hint: unknown, error: unknown) {
  const generated = useId();
  const controlId = id ?? generated;
  const hintId = hint ? `${controlId}-aide` : undefined;
  const errorId = error ? `${controlId}-erreur` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const aria: ControlAria = {
    id: controlId,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
    ...(error ? { "aria-invalid": true as const } : {}),
  };
  return { hintId, errorId, aria };
}

export function Field({
  label,
  hint,
  error,
  id,
  className = "",
  children,
}: FieldProps & { children: (aria: ControlAria) => ReactNode }) {
  const { hintId, errorId, aria } = useFieldIds(id, hint, error);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={aria.id} className="font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-2">
          {hint}
        </p>
      ) : null}
      {error ? <FormError id={errorId}>{error}</FormError> : null}
      {children(aria)}
    </div>
  );
}

/**
 * Groupe de champs (`fieldset`) : une légende, une aide et une erreur communes, par exemple
 * « Titre » (arabe et/ou latin, l'un des deux au moins) ou « Artistes ».
 */
export function FieldGroup({
  legend,
  hint,
  error,
  id,
  className = "",
  children,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const { hintId, errorId, aria } = useFieldIds(id, hint, error);
  return (
    <fieldset id={aria.id} aria-describedby={aria["aria-describedby"]} className={`min-w-0 ${className}`}>
      <legend className="mb-1.5 text-md font-medium text-ink">{legend}</legend>
      <div className="flex flex-col gap-3">
        {hint || error ? (
          <div className="flex flex-col gap-1.5">
            {hint ? (
              <p id={hintId} className="text-sm text-ink-2">
                {hint}
              </p>
            ) : null}
            {error ? <FormError id={errorId}>{error}</FormError> : null}
          </div>
        ) : null}
        {children}
      </div>
    </fieldset>
  );
}
