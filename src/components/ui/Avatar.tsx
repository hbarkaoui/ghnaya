import { initials } from "./initials";

const ARABIC = /\p{Script=Arabic}/u;

/**
 * Avatar à initiales (brief, inventaire des composants). Décoratif : le nom est toujours affiché à côté.
 * `marked` entoure l'avatar d'un filet safran (animateur), toujours doublé d'un libellé de rôle.
 */
export function Avatar({ name, size = "md", marked = false }: { name: string; size?: "sm" | "md"; marked?: boolean }) {
  const letters = initials(name);
  const arabic = ARABIC.test(letters);
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-selected font-medium text-ink ${
        size === "sm" ? "size-8 text-xs" : "size-11 text-sm"
      } ${marked ? "ring-2 ring-ornament ring-offset-2 ring-offset-card" : ""}`}
    >
      <span lang={arabic ? "ar" : undefined} dir={arabic ? "rtl" : "ltr"} className={arabic ? "text-base" : undefined}>
        {letters}
      </span>
    </span>
  );
}
