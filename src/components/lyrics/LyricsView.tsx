type Props = { lyrics: string; className?: string };

/**
 * Paroles arabes, toujours de droite à gauche, en texte brut (jamais de HTML).
 * Un paragraphe par couplet ; les couplets sont séparés par une ligne vide dans la source.
 * La taille et l'interligne viennent des tokens du lecteur (text-lyrics → --reader-font-size).
 */
export function LyricsView({ lyrics, className = "" }: Props) {
  const stanzas = lyrics
    .split(/\n\s*\n/)
    .map((stanza) => stanza.trim())
    .filter(Boolean);

  return (
    <div lang="ar" dir="rtl" className={`font-lyrics text-lyrics ${className}`}>
      {stanzas.map((stanza, i) => (
        <p key={i} className="mb-(--reader-stanza-gap) whitespace-pre-line last:mb-0">
          {stanza}
        </p>
      ))}
    </div>
  );
}
