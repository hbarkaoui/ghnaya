import { createTranslator } from "next-intl";
import ar from "../../../messages/ar.json";
import fr from "../../../messages/fr.json";

const MESSAGES = { fr, ar } as const;

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** Date de suppression, en toutes lettres : « 15 juillet 2030 », « 15 جويلية 2030 » (chiffres latins, comme l'app). */
const formatDate = (date: Date, locale: "fr" | "ar") =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(date);

/**
 * Avertissement envoyé un mois avant la suppression d'un compte inactif (politique de confidentialité,
 * « Combien de temps »), dans la langue du compte. Le lien mène à la page de connexion.
 */
export function inactivityEmail({ url, deleteOn, locale }: { url: string; deleteOn: Date; locale: "fr" | "ar" }) {
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "mail.inactivity" });
  const date = formatDate(deleteOn, locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const href = escapeHtml(url);

  const text = [t("greeting"), "", t("body", { date }), "", t("keep"), "", url, "", t("ignore")].join("\n");
  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1b1f3a;">
  <p>${escapeHtml(t("greeting"))}</p>
  <p>${escapeHtml(t("body", { date }))}</p>
  <p>${escapeHtml(t("keep"))}</p>
  <p><a href="${href}" style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: #1b1f3a; color: #ffffff; text-decoration: none;">${escapeHtml(t("button"))}</a></p>
  <p>${escapeHtml(t("fallback"))}<br><span dir="ltr" style="word-break: break-all;">${href}</span></p>
  <p style="color: #5b5f7a;">${escapeHtml(t("ignore"))}</p>
</body>
</html>`;
  return { subject: t("subject", { date }), text, html };
}
