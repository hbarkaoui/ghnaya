import type { TextareaHTMLAttributes } from "react";
import { CONTROL_CLASS, Field, type FieldProps } from "./Field";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className" | "dir" | "lang">;

const SCRIPTS = {
  // Paroles : toujours de droite à gauche, en Noto Naskh, quelle que soit la langue de l'interface.
  arabic: { dir: "rtl", lang: "ar", font: "font-lyrics text-lg leading-relaxed" },
  // Translittération : de gauche à droite, en IBM Plex Sans (la police de la ligne latine du lecteur).
  latin: { dir: "ltr", lang: undefined, font: "font-translit text-base leading-relaxed" },
} as const;

/**
 * Grande zone de saisie de paroles. `script="arabic"` (par défaut) : `dir="rtl"`, `lang="ar"`,
 * police des paroles ; `script="latin"` pour la translittération. Le correcteur et les majuscules
 * automatiques sont coupés : ils abîment le dialecte et l'arabizi.
 */
export function LyricsTextarea({
  label,
  hint,
  error,
  id,
  className,
  script = "arabic",
  rows = 12,
  ...textarea
}: FieldProps & TextareaProps & { script?: keyof typeof SCRIPTS }) {
  const { dir, lang, font } = SCRIPTS[script];
  return (
    <Field label={label} hint={hint} error={error} id={id} className={className}>
      {(aria) => (
        <textarea
          rows={rows}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          {...textarea}
          {...aria}
          dir={dir}
          lang={lang}
          className={`${CONTROL_CLASS} resize-y py-3 ${font}`}
        />
      )}
    </Field>
  );
}
