import { getTranslations } from "next-intl/server";
import { LogoSymbol } from "@/components/brand/Logo";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

export default async function HomePage() {
  const t = await getTranslations();

  return (
    <>
      <PageHeader variant="root" withLocaleSwitcher />
      <PageMain>
        <section className="flex flex-col items-center gap-5 pt-10 text-center">
          <LogoSymbol size={88} />
          <h1 className="font-display text-3xl font-semibold text-balance">{t("app.tagline")}</h1>
          <p className="text-ink-2">{t("home.meaning")}</p>
        </section>
      </PageMain>
    </>
  );
}
