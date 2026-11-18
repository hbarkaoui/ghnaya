import { ImageResponse } from "next/og";
import { brandIconSvg, svgDataUri } from "@/components/brand/logo-geometry";

/**
 * Favicon et icônes d'app générés à partir de la géométrie du logo (URL : /icon/<id>).
 *  - 32  : favicon, version simplifiée à deux lignes, coins arrondis.
 *  - 192 et 512 : icônes du manifeste (usage « any »), coins arrondis à 22 %.
 */
const ICONS = {
  "32": { size: 32, scale: 0.94, radius: 7, simplified: true },
  "192": { size: 192, scale: 0.66, radius: 42, simplified: false },
  "512": { size: 512, scale: 0.66, radius: 112, simplified: false },
} as const;

type IconId = keyof typeof ICONS;

export function generateImageMetadata() {
  return (Object.keys(ICONS) as IconId[]).map((id) => ({
    id,
    contentType: "image/png",
    size: { width: ICONS[id].size, height: ICONS[id].size },
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const key = String(await id);
  const config = key in ICONS ? ICONS[key as IconId] : ICONS["32"];
  const src = svgDataUri(brandIconSvg(config));

  return new ImageResponse(
    // Rendu par Satori (ImageResponse), pas par le navigateur.
    <img src={src} width={config.size} height={config.size} alt="" />,
    { width: config.size, height: config.size },
  );
}
