"use client";

import { useTranslations } from "next-intl";
import type { LyricsMode } from "@/types/catalog";
import type { LyricsTone } from "./TranslitStatus";

const MODES: LyricsMode[] = ["ar", "both", "latin"];

const TONES: Record<LyricsTone, { box: string; option: string; selected: string; idle: string }> = {
  reader: {
    box: "bg-reader-control p-1.5",
    option: "min-h-12 has-[input:focus-visible]:outline-reader-focus",
    selected: "bg-reader-control-ink text-reader-bg",
    idle: "text-reader-control-ink hover:bg-reader-control-pressed",
  },
  page: {
    box: "bg-well p-1",
    option: "min-h-11 has-[input:focus-visible]:outline-focus",
    selected: "bg-inverse text-ink-inverse",
    idle: "text-ink hover:bg-selected",
  },
};

/**
 * Choix du mode d'affichage des paroles : Arabe, Arabe + latin, Latin.
 * Boutons radio natifs (navigation au clavier, lecteurs d'écran), présentés comme un sélecteur segmenté.
 * L'option choisie est inversée (fond foncé en clair, clair en sombre), pas seulement teintée.
 */
export function TranslitToggle({
  mode,
  onChange,
  tone = "reader",
  className = "",
}: {
  mode: LyricsMode;
  onChange: (mode: LyricsMode) => void;
  tone?: LyricsTone;
  className?: string;
}) {
  const t = useTranslations("lyrics");
  const styles = TONES[tone];

  return (
    <fieldset className={`w-full rounded-lg ${styles.box} ${className}`}>
      <legend className="sr-only">{t("modeLabel")}</legend>
      <div className="grid grid-cols-3 gap-1">
        {MODES.map((value) => {
          const selected = value === mode;
          return (
            <label
              key={value}
              className={`flex cursor-pointer items-center justify-center rounded-md px-2 text-center text-sm font-medium transition-colors duration-(--duration-fast) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 ${styles.option} ${
                selected ? styles.selected : styles.idle
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
