// Plan 5, tâche 6 : pnpm smoke <url> [--query "<requête>"] — vérifie un déploiement de l'extérieur.
import { runSmoke } from "@/lib/system/smoke";

async function main(argv: string[]): Promise<number> {
  const at = argv.indexOf("--query");
  const query = at >= 0 ? argv[at + 1] : undefined;
  const url = argv.find((arg, i) => !arg.startsWith("--") && (at < 0 || i !== at + 1));
  if (!url || !/^https?:\/\//.test(url) || (at >= 0 && !query)) {
    console.error('Usage : pnpm smoke <url> [--query "<requête>"]');
    return 1;
  }
  const checks = await runSmoke(url, { fetch, query });
  for (const check of checks) console.log(`${check.ok ? "✓" : "✗"} ${check.name} — ${check.detail}`);
  const failures = checks.filter((c) => !c.ok).length;
  console.log(failures === 0 ? "Déploiement vérifié." : `${failures} vérification(s) en échec.`);
  return failures === 0 ? 0 : 1;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  },
);
