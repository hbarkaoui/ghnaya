"use client";

import { Archive, EyeOff, PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useRef } from "react";
import { handleReport, type ModerationFormState } from "@/app/actions/moderation";
import { BUTTON_DANGER_OUTLINE, BUTTON_SECONDARY } from "@/components/ui/styles";
import { NoteField } from "./NoteField";
import { submitWithButton } from "./ReviewForm";

const INITIAL: ModerationFormState = { error: null, attempt: 0 };

/**
 * Traitement d'un signalement (spec §9) : une note obligatoire, puis retirer la chanson (retrait doux),
 * la corriger (le formulaire de correction s'ouvre) ou classer sans suite. Chaque action dit ce
 * qu'elle fait sous son bouton. Une chanson déjà retirée ne propose plus que le classement.
 */
export function ReportForm({ reportId, songPublished }: { reportId: string; songPublished: boolean }) {
  const t = useTranslations("moderation.report.form");
  const action = useMemo(() => handleReport.bind(null, reportId), [reportId]);
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.attempt > 0) noteRef.current?.focus();
  }, [state]);

  const actions = [
    ...(songPublished
      ? [
          { value: "remove", label: t("remove"), hint: t("removeHint"), Icon: EyeOff, style: BUTTON_DANGER_OUTLINE },
          { value: "correct", label: t("correct"), hint: t("correctHint"), Icon: PencilLine, style: BUTTON_SECONDARY },
        ]
      : []),
    { value: "dismiss", label: t("dismiss"), hint: t("dismissHint"), Icon: Archive, style: BUTTON_SECONDARY },
  ];

  return (
    <section aria-labelledby="traitement" className="rounded-lg border border-line-subtle bg-card p-4">
      <h2 id="traitement" className="text-lg font-medium">
        {t("title")}
      </h2>
      <form action={formAction} onSubmit={submitWithButton(formAction)} noValidate className="mt-4 flex flex-col gap-5">
        <NoteField
          ref={noteRef}
          id="note"
          name="note"
          label={t("noteLabel")}
          hint={t("noteHint")}
          error={state.error ?? undefined}
          maxLength={1000}
        />
        <ul className="flex flex-col gap-4">
          {actions.map(({ value, label, hint, Icon, style }) => (
            <li key={value} className="flex flex-col gap-1.5">
              <button
                type="submit"
                name="action"
                value={value}
                disabled={pending}
                aria-describedby={`action-${value}`}
                className={`${style} w-full sm:w-auto sm:self-start`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </button>
              <p id={`action-${value}`} className="text-sm text-ink-2">
                {hint}
              </p>
            </li>
          ))}
        </ul>
      </form>
    </section>
  );
}
