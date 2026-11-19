"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useSyncExternalStore } from "react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD } from "@/components/ui/styles";

type CopyState = "idle" | "copied" | "failed";

const noop = () => () => {};
const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * Lien d'invitation d'un club, pour son animateur : affiché en entier, à copier ou à partager
 * (feuille de partage du téléphone, WhatsApp compris). « Partager » n'apparaît que si le navigateur sait partager.
 */
export function InviteLink({ url, clubName }: { url: string; clubName: string }) {
  const t = useTranslations("clubs.members");
  const [copy, setCopy] = useState<CopyState>("idle");
  const input = useRef<HTMLInputElement>(null);
  const shareable = useSyncExternalStore(noop, canShare, () => false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
    } catch {
      setCopy("failed");
      input.current?.select();
    }
  }

  async function share() {
    try {
      await navigator.share({ title: clubName, text: t("shareText", { name: clubName }), url });
    } catch {
      // Partage annulé par l'utilisateur : rien à signaler.
    }
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
        onFocus={(e) => e.currentTarget.select()}
        className={`${FIELD} bg-well font-mono text-sm text-ink-2`}
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copyLink} className={`${shareable ? BUTTON_SECONDARY : BUTTON_PRIMARY} flex-1`}>
          {copy === "copied" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copy === "copied" ? t("copied") : t("copy")}
        </button>
        {shareable ? (
          <button type="button" onClick={share} className={`${BUTTON_PRIMARY} flex-1`}>
            <Share2 aria-hidden="true" className="size-4" />
            {t("share")}
          </button>
        ) : null}
      </div>
      <p aria-live="polite" className={copy === "failed" ? "text-sm text-error" : "sr-only"}>
        {copy === "copied" ? t("copied") : copy === "failed" ? t("copyFailed") : ""}
      </p>
    </div>
  );
}
