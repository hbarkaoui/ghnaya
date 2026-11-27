import { describe, expect, it } from "vitest";
import { inactivityEmail } from "@/lib/mail/inactivityEmail";

const deleteOn = new Date("2030-07-15T10:00:00Z");
const url = "https://ghnaya.example/connexion";

describe("inactivityEmail", () => {
  it("annonce la date de suppression et mène à la connexion, en français", () => {
    const mail = inactivityEmail({ url, deleteOn, locale: "fr" });
    expect(mail.subject).toBe("Votre compte Ghnaya sera supprimé le 15 juillet 2030");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain('dir="ltr"');
    expect(mail.html).toContain(`href="${url}"`);
  });

  it("s'écrit de droite à gauche en arabe, avec des chiffres latins", () => {
    const mail = inactivityEmail({ url, deleteOn, locale: "ar" });
    expect(mail.html).toContain('<html lang="ar" dir="rtl">');
    expect(mail.subject).toContain("2030");
    expect(mail.subject).toContain("15");
  });
});
