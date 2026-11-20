"use client";

import { Check, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useMemo, useRef, type FormEvent } from "react";
import { reviewProposal, type ModerationFormState } from "@/app/actions/moderation";
import { BUTTON_DANGER_OUTLINE, BUTTON_PRIMARY } from "@/components/ui/styles";
import { NoteField } from "./NoteField";

const INITIAL: ModerationFormState = { error: null, attempt: 0 };

/**
 * Envoi à la main avec le bouton cliqué (`submitter`) : avec `action` seul, React 19 réinitialise le
 * formulaire et la note saisie serait perdue après un refus. `action` reste pour l'envoi sans JavaScript.
 */
export function submitWithButton(formAction: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(data));
  };
}

/**
 * Décision sur une proposition (brief, « Modérer ») : une note pour l'auteur, puis **Approuver** ou
 * **Rejeter** ; le rejet exige la note (vérifié par l'action serveur, l'erreur s'affiche sur le champ,
 * qui reprend le focus). Un modérateur ne voit pas « Approuver » sur sa propre proposition.
 */
export function ReviewForm({ proposalId, canApprove }: { proposalId: string; canApprove: boolean }) {
  const t = useTranslations("moderation.review");
  const action = useMemo(() => reviewProposal.bind(null, proposalId), [proposalId]);
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.attempt > 0) noteRef.current?.focus();
  }, [state]);

  return (
    <section aria-labelledby="decision" className="rounded-lg border border-line-subtle bg-card p-4">
      <h2 id="decision" className="text-lg font-medium">
        {t("title")}
      </h2>
      {canApprove ? null : (
        <p className="mt-3 flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-warning">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{t("ownNotice")}</span>
        </p>
      )}
      <form action={formAction} onSubmit={submitWithButton(formAction)} noValidate className="mt-4 flex flex-col gap-4">
        <NoteField
          ref={noteRef}
          id="note"
          name="note"
          label={t("noteLabel")}
          hint={t("noteHint")}
          error={state.error ?? undefined}
          maxLength={1000}
        />
        <div className="flex flex-wrap gap-3">
          {canApprove ? (
            <button type="submit" name="decision" value="approve" disabled={pending} className={BUTTON_PRIMARY}>
              <Check aria-hidden="true" className="size-4" />
              {t("approve")}
            </button>
          ) : null}
          <button type="submit" name="decision" value="reject" disabled={pending} className={BUTTON_DANGER_OUTLINE}>
            <X aria-hidden="true" className="size-4" />
            {t("reject")}
          </button>
        </div>
      </form>
    </section>
  );
}
