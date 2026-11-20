/**
 * Contraste des couleurs selon WCAG 2.2 (luminance relative sRGB, ratio (L1 + 0,05) / (L2 + 0,05)).
 * Outil de test : il vérifie les paires de tokens de src/app/design-tokens.css.
 */

export type Rgba = { r: number; g: number; b: number; a: number };

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i;

/** Lit `#RGB`, `#RRGGBB`, `rgb()` ou `rgba()` ; lève une erreur sur tout le reste (var() non résolue…). */
export function parseColor(value: string): Rgba {
  const text = value.trim();
  const hex = text.match(HEX);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join("") : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgb = text.match(RGB);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  throw new Error(`Couleur illisible : ${value}`);
}

const toColor = (color: string | Rgba): Rgba => (typeof color === "string" ? parseColor(color) : color);

/** Couleur obtenue en posant `top` (éventuellement translucide) sur un fond opaque. */
export function compositeOver(top: string | Rgba, bottom: string | Rgba): Rgba {
  const t = toColor(top);
  const b = toColor(bottom);
  const mix = (front: number, back: number) => front * t.a + back * (1 - t.a);
  return { r: mix(t.r, b.r), g: mix(t.g, b.g), b: mix(t.b, b.b), a: 1 };
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }: Rgba): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Ratio de contraste entre deux couleurs opaques (de 1 à 21), dans n'importe quel ordre. */
export function contrastRatio(a: string | Rgba, b: string | Rgba): number {
  const [light, dark] = [luminance(toColor(a)), luminance(toColor(b))].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
