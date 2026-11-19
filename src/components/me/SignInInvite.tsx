import { LogIn } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ZelligeMotif } from "@/components/ui/EmptyState";

/**
 * Invitation à se connecter, à la place d'une page réservée aux membres (Moi, Mes playlists, Compte).
 * `retour` : chemin interne où revenir après la connexion (`/connexion?retour=`, tâche 16).
 */
export async function SignInInvite({ title, body, retour }: { title: string; body: string; retour: `/${string}` }) {
  const t = await getTranslations("home");

  return (
    <section className="flex flex-col items-start gap-2 rounded-lg border border-line-subtle bg-card p-5">
      <ZelligeMotif className="h-10 w-20" />
      <h2 className="text-lg font-medium text-balance">{title}</h2>
      <p className="text-ink-2 text-pretty">{body}</p>
      <Link
        href={`/connexion?retour=${retour}`}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink hover:bg-accent-hover"
      >
        <LogIn aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        {t("signIn")}
      </Link>
    </section>
  );
}
