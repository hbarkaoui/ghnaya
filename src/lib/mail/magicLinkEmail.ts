import { createTranslator } from "next-intl";
import ar from "../../../messages/ar.json";
import fr from "../../../messages/fr.json";

const MESSAGES = { fr, ar } as const;

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** E-mail du lien magique, dans la langue de l'interface au moment de la demande. */
export function magicLinkEmail({ url, locale }: { url: string; locale: "fr" | "ar" }) {
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "mail.magicLink" });
  const dir = locale === "ar" ? "rtl" : "ltr";
  const href = escapeHtml(url);

  const text = [t("greeting"), "", t("body"), "", url, "", t("ignore")].join("\n");
  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1b1f3a;">
  <p>${escapeHtml(t("greeting"))}</p>
  <p>${escapeHtml(t("body"))}</p>
  <p><a href="${href}" style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: #1b1f3a; color: #ffffff; text-decoration: none;">${escapeHtml(t("button"))}</a></p>
  <p>${escapeHtml(t("fallback"))}<br><span dir="ltr" style="word-break: break-all;">${href}</span></p>
  <p style="color: #5b5f7a;">${escapeHtml(t("ignore"))}</p>
</body>
</html>`;
  return { subject: t("subject"), text, html };
}
