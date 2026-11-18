import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ghnaya · غناية",
    short_name: "Ghnaya",
    description: "Les paroles de vos chansons, pour chanter ensemble",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF8F1",
    theme_color: "#1B2550",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
