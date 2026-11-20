import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { TabBar } from "@/components/shell/TabBar";
import { ToastProvider } from "@/components/ui/Toast";
import { isRtl } from "@/i18n/locale";
import { getCurrentUser } from "@/lib/session";
import { throwIfRootErrorPreview } from "@/mocks/demoPreviewsServer";
import { fontVariables } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F1" },
    { media: "(prefers-color-scheme: dark)", color: "#111733" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await throwIfRootErrorPreview(); // MAQUETTE : aperçu de global-error (/apercu/etats), inactif en production.
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-ink antialiased">
        <NextIntlClientProvider>
          <ToastProvider>
            {children}
            <TabBar role={!user ? "visitor" : user.isAnimator ? "animator" : "member"} />
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
