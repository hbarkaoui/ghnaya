"use client";

import { ChevronRight, CircleCheck, Scale, Send } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { submitReport, type ReportState } from "@/app/actions/report";
import { CONTROL_CLASS, Field, FieldGroup } from "@/components/form/Field";
import { FormErrorSummary, type ErrorSummaryItem } from "@/components/form/FormErrorSummary";
import { TextField } from "@/components/form/TextField";
import { Bidi } from "@/components/ui/Bidi";
import { signInHref } from "@/lib/auth/returnPath";
import type { ReportField } from "@/lib/report/validate";
import { REPORT_REASONS, type ReportReason } from "@/types/report";

/** Identifiants des champs, cibles des liens du récapitulatif des erreurs. */
const FIELD_IDS: Record<ReportField, string | undefined> = {
  form: undefined,
  reason: "champ-motif",
  details: "champ-details",
  email: "champ-email",
};
const FIELD_ORDER = Object.keys(FIELD_IDS) as ReportField[];
const INITIAL_STATE: ReportState = { status: "editing", errors: {}, attempt: 0 };
const RIGHTS_HREF = "/a-propos/droits";

/** Lien dans une phrase traduite (`t.rich`, balise `<link>`). */
function link(href: string) {
  return function InlineLink(chunks: ReactNode) {
    return (
      <Link href={href} className="font-medium text-link underline underline-offset-4">
        {chunks}
      </Link>
    );
  };
}

/**
 * Formulaire de /signaler/[songId] (IA, parcours 7) : motif, détails, et l'adresse e-mail d'un
 * visiteur (un membre connecté n'en donne pas, son compte suffit). Erreurs en ligne avec un
 * récapitulatif qui reçoit le focus ; une fois envoyé, la confirmation remplace le formulaire et
 * renvoie vers « Droits d'auteur et retrait de contenus ».
 */
export function ReportForm({ songId, memberName }: { songId: string; memberName: string | null }) {
  const t = useTranslations("reportForm");
  const action = useMemo(() => submitReport.bind(null, songId), [songId]);
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const errors = state.status === "editing" ? state.errors : {};
  const attempt = state.status === "editing" ? state.attempt : 0;

  // Après chaque envoi refusé, le focus va au récapitulatif (lu par le lecteur d'écran).
  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus();
  }, [attempt, state]);

  if (state.status === "sent") return <ReportSent songId={songId} sentTo={state.sentTo} />;

  const summaryItems: ErrorSummaryItem[] = FIELD_ORDER.flatMap((field) => {
    const message = errors[field];
    return message ? [{ fieldId: FIELD_IDS[field], message }] : [];
  });

  return (
    <>
      <p className="mt-6 mb-6 text-ink-2">{t.rich("intro", { link: link(RIGHTS_HREF) })}</p>
      <form
        action={formAction}
        // Envoi à la main : avec `action` seul, React 19 réinitialise le formulaire après un envoi
        // refusé, et le motif choisi disparaîtrait alors que l'état le garde (note de la tâche 13).
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => formAction(data));
        }}
        noValidate
        className="flex flex-col gap-7"
      >
        {summaryItems.length > 0 ? (
          <FormErrorSummary
            ref={summaryRef}
            title={t("errorSummary", { count: summaryItems.length, n: String(summaryItems.length) })}
            items={summaryItems}
          />
        ) : null}

        <FieldGroup legend={t("reasonLegend")} error={errors.reason} id={FIELD_IDS.reason}>
          <div className="flex flex-col gap-2">
            {REPORT_REASONS.map((value) => (
              <label
                key={value}
                className="flex min-h-12 cursor-pointer items-start gap-3 rounded-md border border-line-subtle bg-card px-3 py-2.5 transition-colors duration-(--duration-fast) hover:bg-well has-checked:border-2 has-checked:border-link"
              >
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  aria-describedby={`motif-${value}-aide`}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-accent"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-ink">{t(`reasons.${value}.label`)}</span>
                  <span id={`motif-${value}-aide`} className="text-sm text-ink-2">
                    {t(`reasons.${value}.hint`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {reason === "wrong_lyrics" ? (
            <p className="text-sm text-ink-2">{t.rich("correctionTip", { link: link(`/contribuer/${songId}`) })}</p>
          ) : null}
        </FieldGroup>

        <Field
          label={t("detailsLabel")}
          hint={t(`detailsHints.${reason || "none"}`)}
          error={errors.details}
          id={FIELD_IDS.details}
        >
          {(aria) => (
            <textarea
              {...aria}
              name="details"
              rows={6}
              dir="auto"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className={`${CONTROL_CLASS} resize-y py-3 leading-relaxed`}
            />
          )}
        </Field>

        {memberName ? (
          <p className="text-sm text-ink-2">
            {t.rich("signedInAs", { name: memberName, b: (chunks) => <Bidi className="font-medium text-ink">{chunks}</Bidi> })}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <TextField
              id={FIELD_IDS.email}
              name="email"
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              label={t("emailLabel")}
              hint={t("emailHint")}
              placeholder={t("emailPlaceholder")}
              error={errors.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-sm text-ink-2">
              {t.rich("signInPrompt", { link: link(signInHref(`/signaler/${songId}`)) })}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink transition-colors duration-(--duration-fast) hover:bg-accent-hover disabled:cursor-wait disabled:opacity-70"
        >
          <Send aria-hidden="true" className="size-5 rtl:-scale-x-100" />
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </>
  );
}

/** Confirmation : elle reçoit le focus (lue par le lecteur d'écran) et mène à la page « Droits d’auteur et retrait de contenus ». */
function ReportSent({ songId, sentTo }: { songId: string; sentTo: string | null }) {
  const t = useTranslations("reportForm.sent");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="status"
        className="flex items-start gap-3 rounded-lg bg-success-soft p-4 focus-visible:outline-offset-4"
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
        <div>
          <p className="text-lg font-medium text-ink">{t("title")}</p>
          <p className="mt-1 text-ink">{t("body")}</p>
          {sentTo ? (
            <p className="mt-1 text-ink-2">
              {t.rich("contact", {
                email: sentTo,
                // L'adresse est isolée (dir="ltr") pour rester lisible dans une phrase arabe.
                b: (chunks) => (
                  <strong dir="ltr" className="font-medium wrap-break-word">
                    {chunks}
                  </strong>
                ),
              })}
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href={RIGHTS_HREF}
        className="flex min-h-14 items-center gap-3 rounded-lg border border-line-subtle bg-card px-4 py-2 transition-colors duration-(--duration-fast) hover:bg-well"
      >
        <Scale aria-hidden="true" className="size-5 shrink-0 text-ink-2" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium text-link">{t("rightsTitle")}</span>
          <span className="text-sm text-ink-2">{t("rightsHint")}</span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-3 rtl:-scale-x-100" />
      </Link>
      <Link
        href={`/chanson/${songId}`}
        className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-5 font-medium text-ink transition-colors duration-(--duration-fast) hover:bg-well"
      >
        {t("backToSong")}
      </Link>
    </div>
  );
}
