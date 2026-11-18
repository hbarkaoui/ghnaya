"use client";

import { useTranslations } from "next-intl";
import type { LyricsMode } from "@/types/catalog";

const MODES: LyricsMode[] = ["ar", "both", "latin"];

/**
 * Choix du mode d'affichage des paroles : Arabe, Arabe + latin, Latin.
 * Boutons radio natifs (navigation au clavier, lecteurs d'écran), présentés comme un sélecteur segmenté.
 */
export function TranslitToggle({
  mode,
  onChange,
}: {
  mode: LyricsMode;
  onChange: (mode: LyricsMode) => void;
}) {
  const t = useTranslations("reader");

  return (
    <fieldset className="mx-auto mb-2 w-full max-w-reader rounded-lg bg-reader-control p-1.5">
      <legend className="sr-only">{t("modeButton")}</legend>
      <div className="grid grid-cols-3 gap-1">
        {MODES.map((value) => {
          const selected = value === mode;
          return (
            <label
              key={value}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md px-2 text-center text-sm font-medium transition-colors duration-(--duration-fast) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-reader-focus ${
                selected ? "bg-reader-control-ink text-reader-bg" : "text-reader-control-ink hover:bg-reader-control-pressed"
              }`}
            >
              <input
                type="radio"
                name="lyrics-mode"
                value={value}
                checked={selected}
                onChange={() => onChange(value)}
                className="sr-only"
              />
              {t(`modes.${value}`)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
