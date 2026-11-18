import { ImageResponse } from "next/og";
import { brandIconSvg, svgDataUri } from "@/components/brand/logo-geometry";

/** Icône d'écran d'accueil iOS : carré plein (iOS arrondit lui-même les coins). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const src = svgDataUri(brandIconSvg({ size: 180, scale: 0.64, radius: 0, simplified: false }));

  return new ImageResponse(
    // Rendu par Satori (ImageResponse), pas par le navigateur.
    <img src={src} width={180} height={180} alt="" />,
    size,
  );
}
