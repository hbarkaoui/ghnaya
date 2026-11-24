import { ImageResponse } from "next/og";
import { brandIconSvg, svgDataUri } from "@/components/brand/logo-geometry";

/** Côté de l'icône d'écran d'accueil iOS, en pixels. */
export const APPLE_TOUCH_ICON_SIZE = 180;

/** Icône d'écran d'accueil iOS : carré plein (iOS arrondit lui-même les coins). */
export function appleTouchIcon(init?: ResponseInit): ImageResponse {
  const size = APPLE_TOUCH_ICON_SIZE;
  const src = svgDataUri(brandIconSvg({ size, scale: 0.64, radius: 0, simplified: false }));
  return new ImageResponse(
    // Rendu par Satori (ImageResponse), pas par le navigateur : next/image n'a pas de sens ici.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={size} height={size} alt="" />,
    { width: size, height: size, ...init },
  );
}
