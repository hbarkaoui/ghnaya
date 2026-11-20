"use client";

import { CircleAlert, CircleCheck, Info, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { isTabBarHidden } from "@/components/shell/TabBar";
import { readMotionDuration } from "@/lib/motion/duration";

export type ToastTone = "success" | "info" | "error";
type ShowToast = (message: string, tone?: ToastTone) => void;

type ToastState = { id: number; message: string; tone: ToastTone; leaving: boolean };

/** Temps d'affichage : un message court se lit en 4 s ; une erreur reste un peu plus. */
const VISIBLE_MS: Record<ToastTone, number> = { success: 4000, info: 4000, error: 6000 };

/**
 * Mouvement (--easing-default, sans rebond) : le toast monte de 8 px en apparaissant (--duration-normal),
 * puis redescend d'autant en s'effaçant, plus vite (--duration-fast). Le texte est annoncé dès son insertion,
 * sans attendre la fin du fondu.
 */
const ENTER = "duration-(--duration-normal) starting:translate-y-2 starting:opacity-0";
const LEAVE = "duration-(--duration-fast) translate-y-2 opacity-0";

const ICONS: Record<ToastTone, LucideIcon> = { success: CircleCheck, info: Info, error: CircleAlert };

const ToastContext = createContext<ShowToast | null>(null);

/** Affiche un toast : `toast("Ajoutée à « Séance du jeudi »")`. Un nouveau toast remplace le précédent. */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast doit être utilisé sous ToastProvider (layout racine).");
  return show;
}

/**
 * Toasts : messages courts au passé (« Ajoutée à Séance du jeudi »), en bas de l'écran, au-dessus de
 * la barre d'onglets et des feuilles (--z-toast), centrés et larges de 640 px au plus. Ils disparaissent seuls et sont annoncés par une
 * région `role="status"` toujours présente. Le ton est porté par une icône et par le texte, jamais par
 * la couleur seule ; le toast reste sur le fond inversé (indigo en clair, jasmin en sombre).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);
  const pathname = usePathname();

  const show = useCallback<ShowToast>((message, tone = "success") => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone, leaving: false });
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (toast.leaving) {
      // Retiré à la fin du fondu de sortie : même token que le CSS (0 si le mouvement est réduit).
      const timer = window.setTimeout(() => setToast(null), readMotionDuration("--duration-fast"));
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(
      () => setToast((current) => (current?.id === toast.id ? { ...current, leaving: true } : current)),
      VISIBLE_MS[toast.tone],
    );
    return () => window.clearTimeout(timer);
  }, [toast]);

  const Icon = toast ? ICONS[toast.tone] : null;
  // Au-dessus de la barre d'onglets du bas ; à partir de 768 px, la barre est en haut et le toast descend.
  const bottom = isTabBarHidden(pathname)
    ? "bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
    : "bottom-[calc(var(--size-tabbar)+env(safe-area-inset-bottom)+0.75rem)] md:bottom-[calc(env(safe-area-inset-bottom)+1rem)]";

  return (
    <ToastContext value={show}>
      {children}
      {/* data-live-region : la région reste active quand une feuille rend le reste de la page inerte. */}
      <div data-live-region className={`pointer-events-none fixed inset-x-0 z-(--z-toast) px-4 ${bottom}`}>
        <div role="status" aria-live="polite" aria-atomic="true" className="mx-auto flex max-w-content justify-center">
          {toast && Icon ? (
            <div
              key={toast.id}
              className={`flex min-h-12 max-w-full items-center gap-3 rounded-lg bg-inverse px-4 py-3 text-ink-inverse shadow-lg transition-[opacity,translate] ease-calm ${
                toast.leaving ? LEAVE : ENTER
              }`}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <p className="font-medium text-pretty">{toast.message}</p>
            </div>
          ) : null}
        </div>
      </div>
    </ToastContext>
  );
}
