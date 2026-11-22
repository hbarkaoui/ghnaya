// Plan 2, tâche 5 : attribue un rôle à un compte existant (la personne s'est connectée une première fois).
import "dotenv/config";
import { clubsOfEmail, noAnimatorWarning, parseRoleArgs, setUserRoles } from "@/lib/account/roles";
import { db, pool } from "@/lib/db/client";

async function main(): Promise<void> {
  const args = parseRoleArgs(process.argv.slice(2));
  if (!args.ok) throw new Error(args.error);
  const user = await setUserRoles(db, args.email, args.change);
  if (!user) throw new Error(`Aucun compte pour ${args.email} : la personne doit d'abord se connecter une fois.`);
  console.log(`${user.email} : rôle ${user.globalRole}, animateur ${user.isAnimator ? "oui" : "non"}.`);
  if (args.change.isAnimator === false) {
    const warning = noAnimatorWarning(user.email, await clubsOfEmail(db, user.email));
    if (warning) console.warn(warning);
  }
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
