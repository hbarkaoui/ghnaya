"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { continueWithGoogle } from "@/app/actions/signIn";
import { GoogleLogo } from "./GoogleLogo";

/**
 * « Continuer avec Google », selon les règles de la marque Google : logo « G » en couleurs à gauche
 * du libellé (à droite en arabe), fond clair et contour neutre. Le fond et le texte restent ceux des
 * tokens (`bg-card`, `text-ink`) : blanc en clair, indigo en sombre.
 */
export function GoogleSignInButton({ retour }: { retour: string }) {
  return (
    <form action={continueWithGoogle}>
      <input type="hidden" name="retour" value={retour} />
      <GoogleSubmit />
    </form>
  );
}

const brand = (chunks: ReactNode) => (
  <span lang="en" dir="ltr">
    {chunks}
  </span>
);

function GoogleSubmit() {
  const t = useTranslations("signIn");
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-line bg-card px-4 font-medium text-ink hover:bg-well disabled:cursor-wait"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-5 text-ink-2 motion-safe:animate-spin" />
        ) : (
          <GoogleLogo className="size-5" />
        )}
        {/* Une seule boîte de texte dans le bouton flex ; « Google » en dir="ltr" dans l'interface arabe. */}
        <span>{pending ? t.rich("googlePending", { brand }) : t.rich("google", { brand })}</span>
      </button>
      <p role="status" className="sr-only">
        {pending ? t.rich("googlePending", { brand }) : ""}
      </p>
    </>
  );
}
