import { ImageResponse } from "next/og";
import { brandIconSvg, svgDataUri } from "@/components/brand/logo-geometry";

/**
 * Icône « maskable » du manifeste (Android) : carré plein, symbole réduit à 52 % pour rester
 * dans la zone de sécurité (cercle de 80 %) quel que soit le masque appliqué par le système.
 */
export function GET() {
  const src = svgDataUri(brandIconSvg({ size: 512, scale: 0.52, radius: 0, simplified: false }));

  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element -- rendu par Satori (ImageResponse), pas par le navigateur
    <img src={src} width={512} height={512} alt="" />,
    { width: 512, height: 512 },
  );
}
