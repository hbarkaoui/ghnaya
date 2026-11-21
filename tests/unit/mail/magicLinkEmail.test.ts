import { describe, expect, it } from "vitest";
import { magicLinkEmail } from "@/lib/mail/magicLinkEmail";

const url = "https://ghnaya.example/api/auth/magic-link/verify?token=abc&callbackURL=%2F";

describe("magicLinkEmail", () => {
  it("donne le lien en texte et en HTML, en français", () => {
    const mail = magicLinkEmail({ url, locale: "fr" });
    expect(mail.subject).toContain("Ghnaya");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain('lang="fr"');
    expect(mail.html).toContain(url.replaceAll("&", "&amp;"));
  });

  it("écrit l'e-mail arabe de droite à gauche", () => {
    const mail = magicLinkEmail({ url, locale: "ar" });
    expect(mail.html).toContain('dir="rtl"');
    expect(mail.html).toContain('lang="ar"');
    expect(mail.text).toContain(url);
  });

  it("échappe le HTML de l'adresse", () => {
    const mail = magicLinkEmail({ url: 'https://x/"><script>', locale: "fr" });
    expect(mail.html).not.toContain("<script>");
  });
});
