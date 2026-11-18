import {
  BRAND,
  LYRIC_LINES,
  SMALL_LYRIC_LINES,
  SMALL_SIZE_THRESHOLD,
  STAR_POINTS,
} from "./logo-geometry";

/**
 * Logo Ghnaya, piste « Bulle zellige ».
 * Les couleurs de marque sont fixes. Seul le contour de l'étoile suit le thème (--logo-outline) :
 * bleu sur fond clair (il ne fait qu'arrondir les coins), jasmin sur fond sombre (il détache l'étoile
 * de l'indigo). En dessous de 28 px, la version simplifiée à deux lignes s'affiche automatiquement.
 */
type SymbolProps = { size?: number; title?: string; className?: string };

export function LogoSymbol({ size = 32, title, className }: SymbolProps) {
  const small = size < SMALL_SIZE_THRESHOLD;
  const lines = small ? SMALL_LYRIC_LINES : LYRIC_LINES;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <polygon
        points={STAR_POINTS}
        style={{ fill: BRAND.blue, stroke: "var(--logo-outline)" }}
        strokeWidth={small ? 7 : 3.5}
        strokeLinejoin="round"
      />
      {lines.map((line) => (
        <rect
          key={`${line.x}-${line.y}`}
          x={line.x}
          y={line.y}
          width={line.w}
          height={line.h}
          rx={line.h / 2}
          style={{ fill: BRAND[line.color] }}
        />
      ))}
    </svg>
  );
}

/**
 * Logo complet : symbole + « غناية » + « Ghnaya ».
 * L'ordre suit le sens de lecture : symbole à gauche en français, à droite en arabe.
 * Décoratif : le lien parent porte le nom accessible.
 */
export function LogoLockup({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink" aria-hidden="true">
      <LogoSymbol size={size} />
      <span className="flex flex-col items-start">
        <span lang="ar" dir="rtl" className="font-display text-xl leading-none font-semibold">
          غناية
        </span>
        <span lang="fr" dir="ltr" className="font-display text-[0.6875rem] leading-tight tracking-[0.12em] text-ink-2">
          Ghnaya
        </span>
      </span>
    </span>
  );
}
