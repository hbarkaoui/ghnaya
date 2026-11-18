/**
 * Logo Ghnaya, piste « Bulle zellige ».
 * Version provisoire de la tâche 1 : le dessin définitif et les icônes d'app viendront à la tâche 2.
 * Les couleurs de marque sont fixes ; seul le contour s'adapte au thème (--logo-outline).
 */
const STAR_POINTS =
  "90,48 78.3,59.7 78.3,76.3 61.7,76.3 50,88 38.3,76.3 11.8,86.2 21.7,59.7 10,48 21.7,36.3 21.7,19.7 38.3,19.7 50,8 61.7,19.7 78.3,19.7 78.3,36.3";

type SymbolProps = { size?: number; title?: string; className?: string };

export function LogoSymbol({ size = 32, title, className }: SymbolProps) {
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
        style={{ fill: "var(--brand-blue)", stroke: "var(--logo-outline)" }}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <rect x="34" y="36" width="34" height="5" rx="2.5" style={{ fill: "var(--brand-jasmine)" }} />
      <rect x="44" y="46" width="24" height="5" rx="2.5" style={{ fill: "var(--brand-jasmine)" }} />
      <rect x="39" y="56" width="29" height="5" rx="2.5" style={{ fill: "var(--brand-saffron)" }} />
    </svg>
  );
}

/** Logo complet : symbole + « غناية » + « Ghnaya ». Décoratif : le lien parent porte le nom accessible. */
export function LogoLockup({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink" aria-hidden="true">
      <LogoSymbol size={size} />
      <span className="flex flex-col">
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
