import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { ArtistRef } from "@/types/catalog";
import { artistDisplayName } from "./artistName";

/** Liste de noms dans la langue de l'interface (« A, B et C » / « A وB وC »), chaque nom balisé selon son écriture. */
function NameList({ artists, locale }: { artists: ArtistRef[]; locale: string }) {
  const names = artists.map((a) => artistDisplayName(a, locale));
  const parts = new Intl.ListFormat(locale, { type: "conjunction" }).formatToParts(names.map((n) => n.name));
  let index = 0;
  return parts.map((part, i): ReactNode => {
    if (part.type === "literal") return part.value;
    const { name, arabic } = names[index++];
    return (
      <span key={i} lang={arabic ? "ar" : undefined} dir={arabic ? "rtl" : "ltr"}>
        {name}
      </span>
    );
  });
}

/**
 * Artistes d'une chanson : les principaux, puis « avec … » pour les invités. Chaque nom est dans
 * l'écriture de l'interface quand il existe, avec `lang` et `dir` sur chaque fragment (brief).
 */
export async function ArtistNames({ artists, className }: { artists: ArtistRef[]; className?: string }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("song")]);
  const main = artists.filter((a) => a.role === "main");
  const feat = artists.filter((a) => a.role === "feat");
  if (main.length === 0 && feat.length === 0) return null;

  return (
    <span className={className}>
      <NameList artists={main} locale={locale} />
      {feat.length > 0 ? (
        <>
          {main.length > 0 ? " " : null}
          {t("with")} <NameList artists={feat} locale={locale} />
        </>
      ) : null}
    </span>
  );
}
