"use client";

import { useLocale } from "next-intl";
import { useId, useMemo, useState, type Ref } from "react";
import { CONTROL_CLASS } from "@/components/form/Field";
import { suggestArtists, type KnownArtist } from "@/lib/contribution/artists";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { detectScript } from "@/lib/text/detectScript";

/** Les deux noms d'une suggestion, celui de l'écriture de l'interface d'abord. */
function ArtistOptionNames({ artist, arabicFirst }: { artist: KnownArtist; arabicFirst: boolean }) {
  const arabic = artist.nameAr ? (
    <span key="ar" lang="ar" dir="rtl">
      {artist.nameAr}
    </span>
  ) : null;
  const latin = artist.nameLatin ? (
    <span key="latin" dir="ltr">
      {artist.nameLatin}
    </span>
  ) : null;
  const [first, second] = arabicFirst ? [arabic ?? latin, arabic ? latin : null] : [latin ?? arabic, latin ? arabic : null];
  return (
    <>
      {first}
      {second ? <span className="text-sm text-ink-2">{second}</span> : null}
    </>
  );
}

/** Nom à écrire dans le champ quand on choisit un artiste : dans l'écriture que la personne tapait. */
function nameFor(artist: KnownArtist, typed: string): string {
  const arabic = detectScript(typed) !== "latin";
  return (arabic ? (artist.nameAr ?? artist.nameLatin) : (artist.nameLatin ?? artist.nameAr)) ?? "";
}

const sameName = (a: string, b: string) => normalizeLatin(normalizeArabic(a)) === normalizeLatin(normalizeArabic(b));

/**
 * Champ d'artiste avec autocomplétion (motif « combobox » de l'ARIA APG) : les artistes connus
 * s'affichent dès 2 lettres, en arabe comme en arabizi ; ↑ ↓ pour parcourir, Entrée pour choisir,
 * Échap pour fermer. Un nom absent de la liste reste accepté : c'est un nouvel artiste.
 */
export function ArtistInput({
  id,
  name,
  value,
  onChange,
  artists,
  label,
  listLabel,
  describedBy,
  invalid,
  ref,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  artists: readonly KnownArtist[];
  label: string;
  listLabel: string;
  describedBy?: string;
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  const locale = useLocale();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(() => suggestArtists(value, artists), [value, artists]);
  // Rien à proposer quand le champ contient déjà exactement le seul artiste trouvé.
  const settled =
    suggestions.length === 1 && [suggestions[0].nameAr, suggestions[0].nameLatin].some((n) => n && sameName(n, value));
  const expanded = open && suggestions.length > 0 && !settled;

  const choose = (artist: KnownArtist) => {
    onChange(nameFor(artist, value));
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <input
        ref={ref}
        id={id}
        name={name}
        type="text"
        dir="auto"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            if (suggestions.length === 0) return;
            e.preventDefault();
            setOpen(true);
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive((i) => (i + step + suggestions.length) % suggestions.length);
          } else if (e.key === "Enter" && expanded && active >= 0) {
            e.preventDefault();
            choose(suggestions[active]);
          } else if (e.key === "Escape" && expanded) {
            e.preventDefault();
            setOpen(false);
            setActive(-1);
          }
        }}
        className={`${CONTROL_CLASS} min-h-12`}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label={listLabel}
        hidden={!expanded}
        className="absolute inset-x-0 z-20 mt-1 rounded-lg border border-line-subtle bg-card p-1 shadow-(--shadow-lg)"
      >
        {suggestions.map((artist, i) => (
          <li
            key={artist.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // Garde le focus dans le champ : le choix se fait au clic, sans perdre la saisie.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(artist)}
            // Option active au clavier : fond et anneau de focus (le fond seul ne contraste qu'à 1,3:1 avec la liste).
            className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-2 rounded-md px-3 py-1.5 text-ink hover:bg-well aria-selected:bg-selected aria-selected:outline-2 aria-selected:-outline-offset-2 aria-selected:outline-focus"
          >
            <ArtistOptionNames artist={artist} arabicFirst={locale === "ar"} />
          </li>
        ))}
      </ul>
    </div>
  );
}
