import type { LyricsMode } from "@/types/catalog";

type Props = {
  lyrics: string;
  /** Translittération alignée ligne à ligne sur les paroles ; absente tant qu'elle n'est pas prête. */
  translit?: string | null;
  mode?: LyricsMode;
  className?: string;
};

const toStanzas = (text: string): string[][] =>
  text
    .split(/\n\s*\n/)
    .map((stanza) => stanza.trim())
    .filter(Boolean)
    .map((stanza) => stanza.split("\n").map((line) => line.trim()));

/**
 * Paroles en texte brut (jamais de HTML), un bloc par couplet.
 *  - « ar » : arabe seul, de droite à gauche.
 *  - « both » : sous chaque ligne arabe, sa ligne latine (72 % de la taille, couleur atténuée).
 *  - « latin » : translittération seule, de gauche à droite.
 * Sans translittération disponible, l'arabe s'affiche quel que soit le mode demandé.
 * Taille et interligne : tokens du lecteur (text-lyrics → --reader-font-size).
 */
export function LyricsView({ lyrics, translit = null, mode = "ar", className = "" }: Props) {
  const arabic = toStanzas(lyrics);

  if (mode === "latin" && translit) {
    return (
      <div lang="ar-Latn" dir="ltr" className={`font-translit text-lyrics ${className}`}>
        {toStanzas(translit).map((lines, i) => (
          <p key={i} className="mb-(--reader-stanza-gap) text-[0.9em] whitespace-pre-line last:mb-0">
            {lines.join("\n")}
          </p>
        ))}
      </div>
    );
  }

  if (mode === "both" && translit) {
    const latin = toStanzas(translit);
    return (
      <div data-testid="lyrics" lang="ar" dir="rtl" className={`font-lyrics text-lyrics ${className}`}>
        {arabic.map((lines, s) => (
          <div key={s} className="mb-(--reader-stanza-gap) last:mb-0">
            {lines.map((line, l) => (
              <div key={l} className="mb-2 last:mb-0">
                <span className="block">{line}</span>
                <span
                  lang="ar-Latn"
                  dir="ltr"
                  className="block text-right font-translit text-[calc(1em*var(--reader-translit-ratio))] leading-snug text-reader-translit"
                >
                  {latin[s]?.[l] ?? ""}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="lyrics" lang="ar" dir="rtl" className={`font-lyrics text-lyrics ${className}`}>
      {arabic.map((lines, i) => (
        <p key={i} className="mb-(--reader-stanza-gap) whitespace-pre-line last:mb-0">
          {lines.join("\n")}
        </p>
      ))}
    </div>
  );
}
