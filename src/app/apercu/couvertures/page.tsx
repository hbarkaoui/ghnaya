import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClubCover } from "@/components/club/ClubCover";
import { clubCoverStyle } from "@/components/club/cover";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { MOCK_CLUB_NAMES } from "@/mocks/clubs";

export const metadata: Metadata = { title: "Aperçu des couvertures", robots: { index: false } };

/**
 * Page d'aperçu (développement uniquement) : les couvertures générées pour 10 noms de club,
 * dans les trois tailles. Introuvable en production.
 */
export default function CoversPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <PageHeader variant="sub" title="Couvertures de club" backHref="/" />
      <PageMain>
        <p className="text-sm text-ink-2">
          Aperçu de développement. Chaque couverture est calculée à partir du nom du club : le même nom donne
          toujours la même couverture.
        </p>
        <ul className="mt-6 flex flex-col gap-6">
          {MOCK_CLUB_NAMES.map((name) => {
            const style = clubCoverStyle(name);
            return (
              <li key={name} className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-card p-4">
                <div className="flex items-center gap-3">
                  <ClubCover name={name} size="sm" />
                  <ClubCover name={name} size="md" />
                  <div className="min-w-0">
                    <p dir="auto" className="truncate font-medium">
                      {name}
                    </p>
                    <p className="text-xs text-ink-3" dir="ltr">
                      combo {style.combo} · {style.motif} · {style.rotation}°
                    </p>
                  </div>
                </div>
                <ClubCover name={name} size="lg" />
              </li>
            );
          })}
        </ul>
      </PageMain>
    </>
  );
}
