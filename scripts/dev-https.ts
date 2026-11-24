// Serveur de développement en https, pour tester sur un téléphone du même Wi-Fi ce qui n'existe qu'en https :
// la feuille de partage du téléphone (`navigator.share`), le presse-papiers moderne.
// Le certificat (mkcert, fourni par Next) vaut pour localhost et pour l'adresse de cet ordinateur sur le Wi-Fi.
import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createSelfSignedCertificate } = require("next/dist/lib/mkcert") as {
  createSelfSignedCertificate: (host?: string, certDir?: string) => Promise<{ key: string; cert: string; rootCA?: string } | undefined>;
};

const lanAddress = Object.values(networkInterfaces())
  .flat()
  .find((net) => net !== undefined && net.family === "IPv4" && !net.internal)?.address;

async function main(): Promise<void> {
  const port = process.env.PORT ?? "3000";
  const certs = await createSelfSignedCertificate(lanAddress, "certificates");
  if (!certs) throw new Error("Le certificat n'a pas pu être créé (mkcert).");

  console.log(`\nhttps://localhost:${port}`);
  if (lanAddress) {
    console.log(`https://${lanAddress}:${port}  ← sur le téléphone`);
    console.log(`Dans .env : BETTER_AUTH_URL=https://${lanAddress}:${port} (sinon les liens de connexion restent en http).`);
  }
  if (certs.rootCA) {
    console.log(`\nCertificat racine à installer une fois sur le téléphone : ${path.join(certs.rootCA)}`);
    console.log("iPhone : AirDrop du fichier → Réglages > Profil téléchargé > Installer,");
    console.log("puis Réglages > Général > Informations > Réglages des certificats : activer la confiance totale.\n");
  }

  const next = spawn(
    "next",
    ["dev", "--port", port, "--experimental-https", "--experimental-https-key", certs.key, "--experimental-https-cert", certs.cert],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  next.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
