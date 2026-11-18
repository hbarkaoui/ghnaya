import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("me");
  return { title: t("title") };
}

export default async function MePage() {
  const t = await getTranslations("me");

  return (
    <>
      <PageHeader variant="root" />
      <PageMain>
        <h1 className="text-2xl font-medium">{t("title")}</h1>
        <p className="mt-2 text-ink-2">{t("intro")}</p>
        <ul className="mt-6 overflow-hidden rounded-lg border border-line-subtle bg-card">
          <li>
            <Link
              href="/moi/compte"
              className="flex min-h-14 items-center justify-between gap-3 px-4 text-md hover:bg-well"
            >
              {t("account")}
              <ChevronRight aria-hidden="true" className="size-5 text-ink-3 rtl:-scale-x-100" />
            </Link>
          </li>
        </ul>
      </PageMain>
    </>
  );
}
