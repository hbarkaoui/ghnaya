"use client";

import { CircleAlert, LoaderCircle, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";
import { requestMagicLink } from "@/app/actions/signIn";
import type { MagicLinkState } from "@/lib/auth/email";

const INITIAL: MagicLinkState = { email: "", error: null };
const HINT_ID = "signin-email-hint";
const ERROR_ID = "signin-email-error";

/**
 * Lien magique par e-mail. États : adresse refusée (erreur en ligne, le focus revient au champ),
 * envoi en cours (bouton occupé, annoncé), envoyé (redirection vers « Vérifiez vos e-mails »).
 * La validation est celle du serveur (`noValidate`) : le message reste le nôtre, dans la langue de
 * l'interface, au lieu de la bulle du navigateur. Sans JavaScript, le formulaire fonctionne aussi.
 */
export function MagicLinkForm({ retour }: { retour: string }) {
  const t = useTranslations("signIn");
  const [state, formAction, pending] = useActionState(requestMagicLink, INITIAL);
  const inputRef = useRef<HTMLInputElement>(null);
  // Pendant un nouvel envoi, l'erreur précédente ne vaut plus : on la retire.
  const error = pending ? null : state.error;

  useEffect(() => {
    if (state.error) inputRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} noValidate aria-busy={pending} className="flex flex-col gap-4">
      <input type="hidden" name="retour" value={retour} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="signin-email" className="font-medium">
          {t("emailLabel")}
        </label>
        <input
          ref={inputRef}
          id="signin-email"
          type="email"
          name="email"
          dir="ltr"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="send"
          required
          // Après un refus, l'adresse saisie revient dans le champ (React vide le formulaire après l'action).
          defaultValue={state.email}
          readOnly={pending}
          placeholder={t("emailPlaceholder")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${ERROR_ID} ${HINT_ID}` : HINT_ID}
          className="h-12 w-full rounded-md border border-line bg-card px-3 text-base text-ink placeholder:text-ink-3 read-only:text-ink-2 aria-invalid:border-error"
        />
        <div aria-live="polite">
          {error ? (
            <p id={ERROR_ID} className="flex items-start gap-1.5 text-sm text-error">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {/* L'adresse d'exemple reste un fragment de gauche à droite dans la phrase arabe. */}
              <span>{t.rich(`errors.${error}`, { ltr: (chunks) => <span dir="ltr">{chunks}</span> })}</span>
            </p>
          ) : null}
        </div>
        <p id={HINT_ID} className="text-sm text-ink-2">
          {t("emailHint")}
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink hover:bg-accent-hover active:bg-accent-active disabled:cursor-wait"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" />
        ) : (
          <Mail aria-hidden="true" className="size-5" />
        )}
        {pending ? t("sending") : t("submit")}
      </button>
      <p role="status" className="sr-only">
        {pending ? t("sending") : ""}
      </p>
    </form>
  );
}
