import type { Ref, TextareaHTMLAttributes } from "react";
import { CONTROL_CLASS, Field, type FieldProps } from "@/components/form/Field";

/**
 * Note du modérateur (rejet d'une proposition, traitement d'un signalement) : une zone de texte libre
 * dans la langue de l'interface, `dir="auto"` pour qu'une note en arabe ou en français s'aligne
 * d'elle-même. Libellé, aide et erreur viennent du socle des formulaires (tâche 13).
 */
export function NoteField({
  label,
  hint,
  error,
  id,
  ref,
  ...textarea
}: FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & {
  ref?: Ref<HTMLTextAreaElement>;
}) {
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      {(aria) => (
        <textarea ref={ref} rows={4} dir="auto" {...textarea} {...aria} className={`${CONTROL_CLASS} resize-y py-3 leading-relaxed`} />
      )}
    </Field>
  );
}
