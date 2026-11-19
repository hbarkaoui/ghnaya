import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

export const metadata: Metadata = { title: "Page réservée", robots: { index: false } };

/**
 * Page d'aperçu (développement uniquement) : une page réservée aux membres, enveloppée dans `AuthGate`.
 * En session « visiteur », elle renvoie vers /connexion?retour=/apercu/reservee, puis on y revient connecté.
 */
export default function ReservedPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <AuthGate retour="/apercu/reservee">
      <PageHeader variant="sub" title="Page réservée" backHref="/apercu/session" />
      <PageMain>
        <p lang="fr" dir="ltr" className="text-ink-2">
          Aperçu de développement. Cette page est enveloppée dans <code className="font-mono">AuthGate</code>&nbsp;:
          vous la voyez parce que la session de démonstration est connectée. En visiteur, elle renvoie vers la
          connexion, qui ramène ici.
        </p>
        <p className="mt-6">
          <Link href="/apercu/session" className="font-medium text-link underline underline-offset-4">
            Changer de session
          </Link>
        </p>
      </PageMain>
    </AuthGate>
  );
}
