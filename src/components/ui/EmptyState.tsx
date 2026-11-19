import Link from "next/link";
import type { ReactNode } from "react";

/** Motif zellige décoratif : trois étoiles khatam, celle du centre en safran (touche « choisie » du brief). */
export function ZelligeMotif({ className = "" }: { className?: string }) {
  const star = (cx: number, size: number, accent: boolean) => {
    const half = size / 2;
    const props = {
      x: cx - half,
      y: 40 - half,
      width: size,
      height: size,
      fill: "none",
      strokeWidth: 2.5,
      strokeLinejoin: "round" as const,
      className: accent ? "stroke-ornament" : "stroke-line",
    };
    return (
      <g key={cx}>
        <rect {...props} />
        <rect {...props} transform={`rotate(45 ${cx} 40)`} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 160 80" className={className} aria-hidden="true" focusable="false">
      {star(34, 26, false)}
      {star(80, 40, true)}
      {star(126, 26, false)}
    </svg>
  );
}

type Action = { label: string; href: string; icon?: ReactNode };

/**
 * État vide : une invitation (titre qui nomme l'espace, une phrase, une action), jamais une excuse.
 * `titleAs="h1"` quand l'état vide est toute la page (404 d'une chanson).
 */
export function EmptyState({
  title,
  body,
  action,
  secondary,
  titleAs: Title = "h2",
}: {
  title: string;
  body: string;
  action?: Action;
  secondary?: Action;
  titleAs?: "h1" | "h2";
}) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-8 text-center">
      <ZelligeMotif className="h-14 w-28" />
      <Title className="text-lg font-medium text-balance">{title}</Title>
      <p className="max-w-sm text-ink-2 text-pretty">{body}</p>
      {action || secondary ? (
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {action ? (
            <Link
              href={action.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 font-medium text-accent-ink hover:bg-accent-hover"
            >
              {action.icon}
              {action.label}
            </Link>
          ) : null}
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-5 font-medium text-ink hover:bg-well"
            >
              {secondary.icon}
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
