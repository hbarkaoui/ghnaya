import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Adresses IPv4 de cet ordinateur sur le réseau local, relues à chaque démarrage du serveur.
 * Pour tester sur un téléphone du même Wi-Fi (http://192.168.x.y:3000) : sans elles, Next refuse les
 * ressources de développement (scripts, rechargement à chaud) à toute origine autre que localhost, et la page
 * s'affiche sans jamais devenir interactive. Sans effet en production.
 */
function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net !== undefined && net.family === "IPv4" && !net.internal)
    .map((net) => net!.address);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanAddresses(),
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
