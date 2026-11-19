import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setDemoSession } from "@/app/actions/demo";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { getDemoSession } from "@/lib/session";
import type { DemoSession } from "@/mocks/session";

export const metadata: Metadata = { title: "Session de démonstration", robots: { index: false } };

const CASES: { value: DemoSession; label: string; detail: string }[] = [
  { value: "member", label: "Membre d'un club", detail: "Leïla : Les Jasmins (un membre n'a qu'un club)." },
  { value: "animator", label: "Animateur de 3 clubs", detail: "Sami : Les Jasmins, Malouf Sfax, Chorale du Bardo." },
  { value: "member-no-club", label: "Membre sans club", detail: "Montre l'état vide « Rejoignez votre club », sans « Créer un club »." },
  { value: "visitor", label: "Visiteur", detail: "Pas de compte : accueil avec invitation à se connecter." },
  { value: "moderator", label: "Modérateur", detail: "Nour : membre des Jasmins, voit « Modération » dans Moi (file fictive de 7)." },
];

/** Page d'aperçu (développement uniquement) : choisir le cas de démonstration, en attendant les comptes. */
export default async function DemoSessionPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const current = await getDemoSession();

  return (
    <>
      <PageHeader variant="sub" title="Session de démonstration" backHref="/" />
      <PageMain>
        <p className="text-sm text-ink-2">
          Aperçu de développement. Les comptes arrivent avec le plan 2 : en attendant, choisissez le cas à afficher.
        </p>
        <form action={setDemoSession} className="mt-6 flex flex-col gap-3">
          {CASES.map((c) => (
            <button
              key={c.value}
              type="submit"
              name="session"
              value={c.value}
              aria-pressed={current === c.value}
              className="flex flex-col items-start gap-1 rounded-lg border border-line-subtle bg-card p-4 text-start hover:bg-well aria-pressed:border-focus aria-pressed:ring-1 aria-pressed:ring-focus"
            >
              <span className="font-medium">{c.label}</span>
              <span className="text-sm text-ink-2">{c.detail}</span>
            </button>
          ))}
        </form>
        <p className="mt-6">
          <Link href="/" className="font-medium text-link underline underline-offset-4">
            Voir l’accueil
          </Link>
        </p>
      </PageMain>
    </>
  );
}
