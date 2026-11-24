"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD } from "@/components/ui/styles";

type CopyState = "idle" | "copied" | "failed" | "copiedNoShare";

/**
 * Copie par `document.execCommand`, pour les pages hors contexte sécurisé (http, par exemple un téléphone
 * qui ouvre http://192.168.x.y:3000) où `navigator.clipboard` n'existe pas. Un textarea temporaire, et non le
 * champ en lecture seule : iOS ne sélectionne pas le texte d'un champ `readOnly`.
 */
function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.opacity = "0";
  area.style.fontSize = "16px"; // Évite le zoom automatique d'iOS sur un champ au texte trop petit.
  document.body.appendChild(area);
  area.focus();
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Refusé (permission, page sans focus) : on tente l'ancienne méthode.
    }
  }
  return legacyCopy(text);
}

/**
 * Lien d'invitation d'un club, pour son animateur : affiché en entier, à copier, à partager par la feuille
 * de partage du téléphone (iOS, Android : WhatsApp compris), ou à faire scanner en QR code.
 * La feuille de partage n'existe que sur une page en https : ailleurs (page en http, certains navigateurs
 * d'ordinateur), « Partager » copie le lien et invite à le coller dans un message.
 */
export function InviteLink({ url, qrSvg, clubName }: { url: string; qrSvg: string; clubName: string }) {
  const t = useTranslations("clubs.members");
  const [copy, setCopy] = useState<CopyState>("idle");
  const input = useRef<HTMLInputElement>(null);
  const text = t("shareText", { name: clubName });

  async function copyLink() {
    if (await copyText(url)) {
      setCopy("copied");
      return;
    }
    setCopy("failed");
    input.current?.focus();
    input.current?.setSelectionRange(0, url.length);
  }

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: clubName, text, url });
      } catch {
        // Partage annulé par l'utilisateur : rien à signaler.
      }
      return;
    }
    setCopy((await copyText(url)) ? "copiedNoShare" : "failed");
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="invite-url" className="sr-only">
        {t("linkLabel")}
      </label>
      <input
        ref={input}
        id="invite-url"
        type="text"
        readOnly
        value={url}
        dir="ltr"
        onFocus={(e) => e.currentTarget.setSelectionRange(0, e.currentTarget.value.length)}
        className={`${FIELD} bg-well font-mono text-sm text-ink-2`}
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copyLink} className={`${BUTTON_SECONDARY} flex-1`}>
          {copy === "copied" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copy === "copied" ? t("copied") : t("copy")}
        </button>
        <button type="button" onClick={share} className={`${BUTTON_PRIMARY} flex-1`}>
          <Share2 aria-hidden="true" className="size-4" />
          {t("share")}
        </button>
      </div>
      <p
        aria-live="polite"
        className={copy === "failed" ? "text-sm text-error" : copy === "copiedNoShare" ? "text-sm text-ink-2" : "sr-only"}
      >
        {copy === "copied" ? t("copied") : copy === "copiedNoShare" ? t("shareUnavailable") : copy === "failed" ? t("copyFailed") : ""}
      </p>

      <div className="mt-2 flex items-center gap-4 border-t border-line-subtle pt-4">
        <div
          role="img"
          aria-label={t("qrLabel")}
          className="size-32 shrink-0 rounded-md bg-white p-2 [&>svg]:size-full"
          // SVG produit côté serveur par la bibliothèque qrcode à partir du lien : aucun contenu saisi.
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="flex flex-col gap-1">
          <p className="font-medium">{t("qrTitle")}</p>
          <p className="text-sm text-ink-2">{t("qrHint")}</p>
        </div>
      </div>
    </div>
  );
}
