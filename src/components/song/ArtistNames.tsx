import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { ArtistRef } from "@/types/catalog";
import { artistDisplayName } from "./artistName";

/**
 * Liste de noms dans la langue de l'interface (« A, B et C » / « A وB وC »), chaque nom balisé selon
 * son écriture. `linked` : chaque nom mène à la page de l'artiste, avec une cible tactile de 44 px.
 */
function NameList({ artists, locale, linked }: { artists: ArtistRef[]; locale: string; linked: boolean }) {
  const names = artists.map((a) => ({ id: a.id, ...artistDisplayName(a, locale) }));
  const parts = new Intl.ListFormat(locale, { type: "conjunction" }).formatToParts(names.map((n) => n.name));
  let index = 0;
  return parts.map((part, i): ReactNode => {
    if (part.type === "literal") return part.value;
    const { id, name, arabic } = names[index++];
    const lang = arabic ? "ar" : undefined;
    const dir = arabic ? "rtl" : "ltr";
    return linked ? (
      <Link
        key={i}
        href={`/artiste/${id}`}
        lang={lang}
        dir={dir}
        className="inline-flex min-h-11 items-center rounded-sm font-medium text-link underline-offset-4 hover:underline"
      >
        {name}
      </Link>
    ) : (
      <span key={i} lang={lang} dir={dir}>
        {name}
      </span>
    );
  });
}

/**
 * Artistes d'une chanson : les principaux, puis « avec … » pour les invités. Chaque nom est dans
 * l'écriture de l'interface quand il existe, avec `lang` et `dir` sur chaque fragment (brief).
 * `linked` : les noms sont des liens vers `/artiste/[id]` (fiche chanson).
 */
export async function ArtistNames({
  artists,
  className,
  linked = false,
}: {
  artists: ArtistRef[];
  className?: string;
  linked?: boolean;
}) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("song")]);
  const main = artists.filter((a) => a.role === "main");
  const feat = artists.filter((a) => a.role === "feat");
  if (main.length === 0 && feat.length === 0) return null;

  return (
    <span className={className}>
      <NameList artists={main} locale={locale} linked={linked} />
      {feat.length > 0 ? (
        <>
          {main.length > 0 ? " " : null}
          {t("with")} <NameList artists={feat} locale={locale} linked={linked} />
        </>
      ) : null}
    </span>
  );
}
