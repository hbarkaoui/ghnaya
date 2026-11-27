import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { PRIVACY_META_AR, PrivacyAr } from "./ar";
import { PRIVACY_META_FR, PrivacyFr } from "./fr";

/** Le texte est choisi selon la langue de l'interface ; la version française fait foi (`fr.tsx`). */
export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === "ar" ? PRIVACY_META_AR : PRIVACY_META_FR;
}

export default async function PrivacyPage() {
  return (await getLocale()) === "ar" ? <PrivacyAr /> : <PrivacyFr />;
}
