import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { setDemoLatency, triggerRootError } from "@/app/actions/demo";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageMain } from "@/components/shell/PageMain";
import { NetworkCutToggle } from "@/components/system/NetworkCutToggle";
import { DEMO_LATENCIES_MS, DEMO_LATENCY_COOKIE, ROOT_ERROR_SECONDS, parseDemoLatency } from "@/mocks/demoPreviews";

export const metadata: Metadata = { title: "États système", robots: { index: false } };

const LINK = "font-medium text-link underline underline-offset-4";
const BUTTON =
  "inline-flex min-h-11 items-center rounded-md border border-line px-5 font-medium hover:bg-well aria-pressed:border-focus aria-pressed:ring-1 aria-pressed:ring-focus";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8 flex flex-col gap-3">
      <h2 id={id} className="text-lg font-medium">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Page d'aperçu (développement uniquement, tâche 17) : provoquer chaque état système pour le vérifier
 * ou le montrer en revue de design : squelettes de chargement, page d'erreur, erreur de la mise en
 * page racine, pages introuvables et échec réseau d'une action.
 */
export default async function SystemStatesPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const latency = parseDemoLatency((await cookies()).get(DEMO_LATENCY_COOKIE)?.value, false);

  return (
    <>
      <PageHeader variant="sub" title="États système" backHref="/apercu/session" />
      <PageMain>
        <p lang="fr" dir="ltr" className="text-sm text-ink-2">
          Aperçu de développement. Rien de ceci n&rsquo;existe en production.
        </p>

        <Section id="etats-chargement" title="Chargement">
          <p className="text-sm text-ink-2">
            Ralentit les listes (playlists, clubs) pour garder leur squelette à l&rsquo;écran. Actif pour toutes les
            pages jusqu&rsquo;à « Aucun délai ».
          </p>
          <form action={setDemoLatency} className="flex flex-wrap gap-2">
            {DEMO_LATENCIES_MS.map((ms) => (
              <button key={ms} type="submit" name="latence" value={ms} aria-pressed={latency === ms} className={BUTTON}>
                {ms === 0 ? "Aucun délai" : `${(ms / 1000).toLocaleString("fr-FR")} s`}
              </button>
            ))}
          </form>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href="/playlists" className={LINK}>Mes playlists</Link>
            </li>
            <li>
              <Link href="/playlists/seance-du-jeudi" className={LINK}>Playlist « Séance du jeudi »</Link>
            </li>
            <li>
              <Link href="/clubs" className={LINK}>Clubs</Link> (session animateur) ou Mon club (session membre)
            </li>
            <li>
              <Link href="/clubs/les-jasmins" className={LINK}>Club « Les Jasmins »</Link>
            </li>
            <li>
              <Link href="/recherche?q=sidi" className={LINK}>Recherche « sidi »</Link> (délai simulé de la recherche,
              toujours actif)
            </li>
          </ul>
        </Section>

        <Section id="etats-erreur" title="Erreur">
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href="/apercu/etats/erreur" className={LINK}>Erreur pendant le rendu d&rsquo;une page</Link>{" "}
              (page d&rsquo;erreur avec sa référence)
            </li>
          </ul>
          <form action={triggerRootError} className="flex flex-col items-start gap-2">
            <button type="submit" className={BUTTON}>
              Faire échouer la mise en page racine
            </button>
            <p className="text-sm text-ink-2">
              Ouvre l&rsquo;accueil, qui échoue tant que le cookie d&rsquo;aperçu vit ({ROOT_ERROR_SECONDS} s) :
              c&rsquo;est la page global-error. « Réessayer » réussit ensuite.
            </p>
          </form>
        </Section>

        <Section id="etats-introuvable" title="Introuvable">
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href="/une-adresse-inconnue" className={LINK}>Adresse inconnue</Link> (404 générale)
            </li>
            <li>
              <Link href="/artiste/a-saliha" className={LINK}>Artiste inconnu</Link> (404 de la page artiste)
            </li>
            <li>
              <Link href="/chanson/inconnue" className={LINK}>Chanson inconnue ou retirée</Link>
            </li>
            <li>
              <Link href="/playlists/inconnue" className={LINK}>Playlist introuvable</Link>
            </li>
            <li>
              <Link href="/clubs/inconnu" className={LINK}>Club introuvable</Link> (session connectée)
            </li>
          </ul>
        </Section>

        <Section id="etats-reseau" title="Échec réseau">
          <p className="text-sm text-ink-2">
            Fait échouer les actions serveur comme un réseau coupé, jusqu&rsquo;au rechargement de la page. Ensuite :
            ajouter une chanson depuis la recherche, modifier une playlist, créer une playlist de club… Un toast
            d&rsquo;erreur doit apparaître, et la saisie rester en place. On peut aussi couper le réseau dans les
            outils du navigateur, ou arrêter le serveur.
          </p>
          <div>
            <NetworkCutToggle />
          </div>
        </Section>
      </PageMain>
    </>
  );
}
