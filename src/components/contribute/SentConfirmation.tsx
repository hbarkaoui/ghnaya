"use client";

import { Heart } from "lucide-react";
import { useEffect, useRef } from "react";
import { contributionsHref } from "@/lib/contribution/routes";

/**
 * Confirmation chaleureuse après l'envoi d'une proposition : « يعيشك — votre proposition sera relue ».
 * Elle reçoit le focus à l'arrivée (le lecteur d'écran la lit), puis l'adresse perd ?envoyee= : un
 * rechargement de la page ne la réaffiche pas.
 */
export function SentConfirmation({ thanks, title, body }: { thanks: string; title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    window.history.replaceState(null, "", contributionsHref());
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="mb-6 flex items-start gap-3 rounded-lg bg-success-soft p-4 focus-visible:outline-offset-4"
    >
      <Heart aria-hidden="true" className="mt-1 size-5 shrink-0 text-success" />
      <div>
        <p className="text-lg font-medium text-ink">
          <span lang="ar" dir="rtl" className="font-display text-xl font-semibold text-success">
            {thanks}
          </span>
          {" — "}
          {title}
        </p>
        <p className="mt-1 text-ink-2">{body}</p>
      </div>
    </div>
  );
}
