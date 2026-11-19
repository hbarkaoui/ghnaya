import { useId, type CSSProperties } from "react";
import { clubCoverStyle, type CoverStyle } from "./cover";

type Size = "sm" | "md" | "lg";

type Props = {
  name: string;
  size?: Size;
  /** Nom accessible. Sans libellé, la couverture est décorative (le nom du club est affiché à côté). */
  label?: string;
  className?: string;
};

const TILE: Record<Exclude<Size, "lg">, { box: string; text: string }> = {
  sm: { box: "size-10 rounded-md", text: "text-md" },
  md: { box: "size-16 rounded-lg", text: "text-2xl" },
};

const colors = (style: CoverStyle): CSSProperties => ({
  backgroundColor: `var(--cover-${style.combo}-bg)`,
  color: `var(--cover-${style.combo}-fg)`,
});

/** Étoile khatam (deux carrés superposés) sur une grille de 100. */
function Khatam({ size, inset, stroke, fill }: { size: number; inset: number; stroke?: number; fill?: boolean }) {
  const side = size - inset * 2;
  const square = (rotate: number) => (
    <rect
      x={inset}
      y={inset}
      width={side}
      height={side}
      transform={rotate ? `rotate(${rotate} ${size / 2} ${size / 2})` : undefined}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? undefined : "currentColor"}
      strokeWidth={stroke}
      strokeLinejoin="round"
    />
  );
  return (
    <>
      {square(0)}
      {square(45)}
    </>
  );
}

/** Médaillon : étoile khatam (selon le motif) et initiale du club au centre. */
function Medallion({ style, className, textClass }: { style: CoverStyle; className: string; textClass: string }) {
  const filled = style.motif === "filled";
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
        <g transform={`rotate(${style.rotation} 50 50)`}>
          {filled ? (
            <Khatam size={100} inset={20} fill />
          ) : (
            <Khatam size={100} inset={style.motif === "double" ? 22 : 16} stroke={5} />
          )}
          {/* Motif double : seconde étoile concentrique À L'EXTÉRIEUR, pour laisser le centre (l'initiale) libre. */}
          {style.motif === "double" ? <Khatam size={100} inset={7} stroke={2.5} /> : null}
        </g>
      </svg>
      <span
        className={`relative font-display leading-none font-semibold ${textClass}`}
        // Motif plein : l'initiale prend la couleur du fond pour rester lisible sur l'étoile (même contraste).
        style={filled ? { color: `var(--cover-${style.combo}-bg)` } : undefined}
      >
        {style.initial}
      </span>
    </span>
  );
}

/**
 * Couverture de club générée à partir de son nom (déterministe).
 *  - sm : 40 px · md : 64 px — tuile avec médaillon.
 *  - lg : en-tête pleine largeur — motif zellige en filigrane et médaillon côté début de lecture.
 * Couleurs de marque fixes (tokens --cover-n), identiques en clair et en sombre.
 */
export function ClubCover({ name, size = "md", label, className = "" }: Props) {
  const style = clubCoverStyle(name);
  // Identifiant sans caractères spéciaux : il est utilisé dans url(#…).
  const patternId = `cover-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };

  if (size === "lg") {
    const shift = style.patternShift * 7;
    return (
      <div {...a11y} className={`relative h-28 w-full overflow-hidden rounded-xl ring-1 ring-(color:--cover-ring) ring-inset ${className}`} style={colors(style)}>
        <svg className="absolute inset-0 size-full opacity-30" aria-hidden="true" focusable="false">
          <defs>
            <pattern
              id={patternId}
              width="56"
              height="56"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${shift} ${shift}) rotate(${style.rotation})`}
            >
              <g transform="translate(8 8) scale(0.4)">
                <Khatam size={100} inset={16} stroke={5} />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
        <div className="absolute inset-y-0 start-5 flex items-center">
          <span className="rounded-full p-1" style={colors(style)}>
            <Medallion style={style} className="size-18" textClass="text-3xl" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <span
      {...a11y}
      className={`inline-flex shrink-0 items-center justify-center ring-1 ring-(color:--cover-ring) ring-inset ${TILE[size].box} ${className}`}
      style={colors(style)}
    >
      <Medallion style={style} className="size-full" textClass={TILE[size].text} />
    </span>
  );
}
