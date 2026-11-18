import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Cache Components désactivé, pour deux raisons :
  //  - la langue choisie (cookie) fixe <html lang dir> dans la mise en page racine, ce que Cache
  //    Components interdit hors d'une zone <Suspense> ;
  //  - le plan 1 utilise `export const dynamic = 'force-dynamic'`, incompatible avec Cache Components.
  cacheComponents: false,
  // L'indicateur de développement masquait l'onglet Accueil de la barre du bas.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
