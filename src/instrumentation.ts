// Plan 5, tâche 1 : au démarrage d'un serveur Next (une instance de fonction sur Vercel), vérifier la
// configuration de production. Une erreur ici empêche le serveur de répondre : c'est voulu, une configuration
// incomplète ne doit pas servir de pages (liens de connexion jamais envoyés, texte factice enregistré…).
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Par prudence : pendant `next build`, l'environnement de production n'est pas forcément complet.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { assertProductionEnv } = await import("@/lib/system/productionEnv");
  assertProductionEnv(process.env);
}
