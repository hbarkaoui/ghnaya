import type { InputHTMLAttributes } from "react";
import { CONTROL_CLASS, Field, type FieldProps } from "./Field";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

/**
 * Champ de texte d'une ligne : libellé, aide, erreur en ligne. Les autres attributs vont au `<input>`
 * (`name`, `value`/`onChange` ou `defaultValue`, `dir="auto"` pour un titre ou un nom, `type`…).
 */
export function TextField({ label, hint, error, id, className, ...input }: FieldProps & InputProps) {
  return (
    <Field label={label} hint={hint} error={error} id={id} className={className}>
      {(aria) => <input type="text" {...input} {...aria} className={`${CONTROL_CLASS} min-h-12`} />}
    </Field>
  );
}
