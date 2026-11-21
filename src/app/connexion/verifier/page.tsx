import { MailCheck, MailOpen } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignInLayout } from "@/components/auth/SignInLayout";
import { checkEmail } from "@/lib/auth/email";
import { safeReturnPath, signInHref } from "@/lib/auth/returnPath";
import { MAGIC_LINK_SENT_COOKIE } from "@/lib/auth/signInCookie";
import { readOutbox, mailTransport } from "@/lib/mail/transport";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signIn.verify");
  return { title: t("metaTitle"), robots: { index: false } };
}

/**
 * « Vérifiez vos e-mails » (IA) : l'adresse à laquelle le lien est parti, quand on la connaît encore,
 * et la marche à suivre si rien n'arrive. Retour et « Modifier l'adresse » ramènent au formulaire.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/connexion/verifier">) {
  const retour = safeReturnPath((await searchParams).retour);
  const sent = checkEmail((await cookies()).get(MAGIC_LINK_SENT_COOKIE)?.value);
  const t = await getTranslations("signIn.verify");
  const formHref = signInHref(retour);

  return (
    <SignInLayout backHref={formHref}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-well">
          <MailCheck aria-hidden="true" className="size-8 text-ink" />
        </span>
        <h1 className="font-display text-3xl font-semibold text-balance">{t("title")}</h1>
        <p className="text-pretty">
          {sent.ok
            ? t.rich("sentTo", {
                email: sent.email,
                // L'adresse est isolée (dir="ltr") pour rester lisible dans une phrase arabe.
                strong: (chunks) => (
                  <strong dir="ltr" className="font-medium wrap-break-word">
                    {chunks}
                  </strong>
                ),
              })
            : t("sent")}
        </p>
        <p className="text-ink-2 text-pretty">{t("openLink")}</p>
      </div>

      <section aria-labelledby="verify-help" className="mt-8 rounded-lg border border-line-subtle bg-card p-5">
        <h2 id="verify-help" className="font-medium">
          {t("notReceivedTitle")}
        </h2>
        <p className="mt-1 text-ink-2 text-pretty">{t("notReceivedBody")}</p>
        <Link
          href={formHref}
          className="mt-4 inline-flex min-h-11 items-center rounded-md border border-line px-5 font-medium text-ink hover:bg-well"
        >
          {t("changeEmail")}
        </Link>
      </section>

      {sent.ok && mailTransport() === "outbox" ? <OutboxLink email={sent.email} /> : null}
    </SignInLayout>
  );
}

/** Boîte locale (développement, tests de bout en bout) : aucun e-mail ne part, on ouvre donc le lien ici. */
async function OutboxLink({ email }: { email: string }) {
  const [entry, t] = await Promise.all([readOutbox(email), getTranslations("signIn.verify")]);
  if (!entry?.link) return null;
  return (
    <aside lang="fr" dir="ltr" className="mt-6 rounded-lg border border-dashed border-line p-5 text-start">
      <p className="text-sm font-medium">{t("devTitle")}</p>
      <p className="mt-1 text-sm text-ink-2">{t("devBody")}</p>
      <a
        href={entry.link}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-medium text-ink hover:bg-well"
      >
        <MailOpen aria-hidden="true" className="size-4" />
        {t("devOpen")}
      </a>
    </aside>
  );
}
