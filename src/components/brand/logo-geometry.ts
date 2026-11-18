/**
 * Géométrie du logo Ghnaya « Bulle zellige », source unique pour le composant React et les icônes
 * générées (favicon, icônes d'app, icône Apple).
 *
 * Grille de 100 unités :
 *  - une étoile à 8 branches (khatam), centrée en (50, 48), de rayon 40 ; la pointe en bas à gauche
 *    est allongée (rayon 54) et forme la queue de la bulle ;
 *  - trois lignes alignées à droite (comme des paroles en arabe), la dernière en safran ;
 *  - pour les toutes petites tailles (favicon), deux lignes plus épaisses.
 * Les coins de l'étoile sont adoucis par un contour arrondi (stroke-linejoin: round).
 */

export const BRAND = {
  indigo: "#1B2550",
  blue: "#1F6FB2",
  saffron: "#D9A441",
  jasmine: "#FBF8F1",
} as const;

type BrandColor = keyof typeof BRAND;

/** Centre optique du symbole sur la grille de 100. */
export const SYMBOL_CENTER = { x: 50, y: 48 } as const;

export const STAR_POINTS =
  "90,48 78.3,59.7 78.3,76.3 61.7,76.3 50,88 38.3,76.3 11.8,86.2 21.7,59.7 10,48 21.7,36.3 21.7,19.7 38.3,19.7 50,8 61.7,19.7 78.3,19.7 78.3,36.3";

export type LyricLine = { x: number; y: number; w: number; h: number; color: BrandColor };

/** Trois lignes de paroles, bord droit commun en x = 68. */
export const LYRIC_LINES: readonly LyricLine[] = [
  { x: 34, y: 36, w: 34, h: 5, color: "jasmine" },
  { x: 44, y: 46, w: 24, h: 5, color: "jasmine" },
  { x: 39, y: 56, w: 29, h: 5, color: "saffron" },
];

/** Version simplifiée pour 16 à 32 px : deux lignes épaisses. */
export const SMALL_LYRIC_LINES: readonly LyricLine[] = [
  { x: 32, y: 38, w: 36, h: 9, color: "jasmine" },
  { x: 40, y: 53, w: 28, h: 9, color: "saffron" },
];

/** En dessous de cette taille d'affichage, on utilise la version simplifiée. */
export const SMALL_SIZE_THRESHOLD = 28;

type IconOptions = {
  /** Côté de l'image en pixels. */
  size: number;
  /** Part du côté occupée par le symbole (0 à 1). */
  scale: number;
  /** Rayon des coins du fond indigo, en pixels (0 = carré plein, pour les icônes masquées par l'OS). */
  radius: number;
  simplified: boolean;
};

/**
 * SVG autonome aux couleurs figées : fond indigo, étoile bleue cerclée de jasmin.
 * Utilisé par les routes d'icônes (ImageResponse), qui ne connaissent pas les variables CSS.
 */
export function brandIconSvg({ size, scale, radius, simplified }: IconOptions): string {
  const k = (size * scale) / 100;
  const tx = size / 2 - SYMBOL_CENTER.x * k;
  const ty = size / 2 - SYMBOL_CENTER.y * k;
  const lines = (simplified ? SMALL_LYRIC_LINES : LYRIC_LINES)
    .map(
      (l) =>
        `<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${l.h / 2}" fill="${BRAND[l.color]}"/>`,
    )
    .join("");
  const ring = simplified ? 7 : 4;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND.indigo}"/>`,
    `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})">`,
    `<polygon points="${STAR_POINTS}" fill="${BRAND.blue}" stroke="${BRAND.jasmine}" stroke-width="${ring}" stroke-linejoin="round"/>`,
    lines,
    `</g></svg>`,
  ].join("");
}

export const svgDataUri = (svg: string): string =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
