import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { TERMS_META_AR, TermsAr } from "./ar";
import { TERMS_META_FR, TermsFr } from "./fr";

/** Le texte est choisi selon la langue de l'interface ; la version française fait foi (`fr.tsx`). */
export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === "ar" ? TERMS_META_AR : TERMS_META_FR;
}

export default async function TermsPage() {
  return (await getLocale()) === "ar" ? <TermsAr /> : <TermsFr />;
}
