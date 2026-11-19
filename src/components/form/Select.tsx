import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { CONTROL_CLASS, Field, type FieldProps } from "./Field";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className" | "children">;

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Liste déroulante native (le sélecteur du téléphone sur mobile). `placeholder` ajoute une première
 * option vide (« Choisissez… ») : le champ reste alors à remplir, sans valeur choisie d'avance.
 */
export function Select({
  label,
  hint,
  error,
  id,
  className,
  options,
  placeholder,
  ...select
}: FieldProps & SelectProps & { options: readonly SelectOption[]; placeholder?: string }) {
  return (
    <Field label={label} hint={hint} error={error} id={id} className={className}>
      {(aria) => (
        <div className="relative">
          <select {...select} {...aria} className={`${CONTROL_CLASS} min-h-12 cursor-pointer appearance-none pe-10`}>
            {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-ink-2"
          />
        </div>
      )}
    </Field>
  );
}
