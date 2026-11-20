import type { ReactNode } from "react";
import { scriptAttrs, textOf } from "@/lib/text/scriptAttrs";

/**
 * Fragment saisi par quelqu'un (nom de personne, de club, de playlist) dans une phrase de l'interface :
 * isolé (`<bdi>`, la ponctuation autour ne bouge pas) et balisé selon son écriture — `lang="ar" dir="rtl"`
 * pour un nom arabe dans l'interface française, `dir="ltr"` pour un nom latin dans l'interface arabe.
 * S'emploie tel quel ou comme balise de t.rich : `{ club: (chunks) => <Bidi>{chunks}</Bidi> }`.
 */
export function Bidi({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <bdi {...scriptAttrs(textOf(children))} className={className}>
      {children}
    </bdi>
  );
}
