// Plan 5, tâche 1 : vérifier une configuration de production avant de la saisir chez l'hébergeur.
//   pnpm env:check --file .env.prod-check   (fichier ignoré par git, à supprimer ensuite ; pas `.env.production.local`, que next build/start charge tout seul)
//   pnpm env:check                                 (variables du shell)
// Les valeurs ne sont jamais affichées.
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { productionEnvProblems } from "@/lib/system/productionEnv";

function main(argv: string[]): number {
  const at = argv.indexOf("--file");
  const file = at >= 0 ? argv[at + 1] : undefined;
  if (at >= 0 && !file) {
    console.error("Usage : pnpm env:check [--file <chemin>]");
    return 1;
  }
  const source = file ? parse(readFileSync(file)) : process.env;
  const problems = productionEnvProblems({ ...source, NODE_ENV: "production" } as NodeJS.ProcessEnv);
  if (problems.length === 0) {
    console.log("Configuration de production valide.");
    return 0;
  }
  console.error(`Configuration de production invalide :\n- ${problems.join("\n- ")}`);
  return 1;
}

process.exitCode = main(process.argv.slice(2));
