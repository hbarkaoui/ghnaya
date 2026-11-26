import type { Metadata } from "next";
import { InlineLink, LegalPage, List, Section, SupportEmail, ToValidate } from "@/components/legal/LegalParts";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Les données que Ghnaya enregistre, pourquoi, chez qui, combien de temps, et vos droits.",
};

/**
 * Politique de confidentialité, tirée de ce que fait le code (schéma `lib/db/schema`, Better Auth,
 * limites de requêtes, suppression de compte) et du guide de mise en production. Ce que le code ne dit pas
 * est dans un encadré « À valider », pour la relecture juridique.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updated="Version provisoire du 26 novembre 2026, en attente de relecture juridique."
      lead={
        <p>
          Ghnaya aide les clubs de chant à lire des paroles en séance. Cette page dit quelles données le site
          enregistre, pourquoi, chez quels prestataires, combien de temps, et comment exercer vos droits.
          Ghnaya n&rsquo;affiche pas de publicité, ne mesure pas l&rsquo;audience et ne vend aucune donnée.
        </p>
      }
    >
      <Section id="conf-responsable" title="Qui est responsable de vos données">
        <p>
          Pour toute question sur vos données, écrivez à <SupportEmail />.
        </p>
        <ToValidate>
          identité du responsable du traitement (personne ou association), adresse postale, et désignation
          éventuelle d&rsquo;un délégué à la protection des données. L&rsquo;adresse de contact est un groupe
          Google : préciser qui le reçoit.
        </ToValidate>
      </Section>

      <Section id="conf-donnees" title="Les données enregistrées">
        <p>Sans compte, vous pouvez chercher et lire les chansons publiées. Avec un compte, Ghnaya enregistre :</p>
        <List>
          <li>
            <strong className="font-medium">votre compte</strong> : votre adresse e-mail, votre nom affiché
            (tiré de votre adresse si vous n&rsquo;en donnez pas, modifiable dans Compte), la langue de
            l&rsquo;interface, votre rôle (membre, animateur, modérateur ou admin) et les dates de création
            et de modification ;
          </li>
          <li>
            <strong className="font-medium">si vous vous connectez avec Google</strong> : l&rsquo;identifiant
            de votre compte Google, votre nom, votre adresse e-mail et l&rsquo;adresse de votre photo de profil,
            ainsi que les jetons que Google remet à la connexion (accès, actualisation, identité), enregistrés
            par la bibliothèque de connexion ;
          </li>
          <li>
            <strong className="font-medium">vos sessions</strong> : pour chaque appareil connecté, un jeton de
            session, sa date d&rsquo;expiration, l&rsquo;adresse IP et le navigateur utilisés ;
          </li>
          <li>
            <strong className="font-medium">la connexion par lien e-mail</strong> : le temps de sa validité,
            le lien envoyé, sous forme hachée, et l&rsquo;adresse à laquelle il est parti ;
          </li>
          <li>
            <strong className="font-medium">vos propositions</strong> : les titres, artistes, dialecte, paroles
            et translittération proposés, votre déclaration de droits, leur statut et la note du modérateur ;
          </li>
          <li>
            <strong className="font-medium">votre club et vos playlists</strong> : le club dont vous êtes
            membre et votre rôle dans ce club, vos playlists personnelles, et, pour un animateur, les clubs,
            les playlists de club et les notes qu&rsquo;il crée.
          </li>
        </List>
        <p>Pour tout le monde, avec ou sans compte :</p>
        <List>
          <li>
            <strong className="font-medium">les signalements</strong> : le motif, les détails écrits, et
            l&rsquo;adresse e-mail de contact (obligatoire sans compte), ou votre compte si vous êtes connecté ;
          </li>
          <li>
            <strong className="font-medium">les limites de requêtes</strong>, qui protègent le site des abus :
            des compteurs liés à votre adresse IP (recherche, demande de lien de connexion, signalement), à
            votre adresse e-mail (demande de lien) ou à votre compte (propositions, suggestions
            d&rsquo;artistes) ;
          </li>
          <li>
            <strong className="font-medium">les journaux techniques</strong> : en cas d&rsquo;erreur, le serveur
            note la page en cause, sans les paramètres de l&rsquo;adresse, sans adresse e-mail ni message
            saisi.
          </li>
        </List>
        <p>
          Enfin, votre navigateur garde vos préférences du lecteur (taille du texte, mode sombre, affichage) dans
          son stockage local : elles ne sont pas envoyées à Ghnaya.
        </p>
        <ToValidate>
          les jetons Google ne servent plus après la connexion : décider s&rsquo;il faut cesser de les conserver.
          Préciser aussi ce que l&rsquo;hébergeur (Vercel) journalise de lui-même pour chaque requête
          (adresse IP, page demandée) et pendant combien de temps.
        </ToValidate>
      </Section>

      <Section id="conf-finalites" title="Pourquoi">
        <List>
          <li>vous connecter et garder votre session ouverte ;</li>
          <li>afficher votre nom à votre club, et vos playlists et propositions dans votre espace ;</li>
          <li>relire les propositions et traiter les signalements, et répondre à la personne qui signale ;</li>
          <li>limiter les abus (envois répétés, recherche automatisée) et corriger les erreurs du site.</li>
        </List>
        <p>Ghnaya n&rsquo;envoie pas de lettre d&rsquo;information : le seul e-mail est le lien de connexion.</p>
        <ToValidate>
          base légale de chaque traitement (exécution du service demandé, intérêt légitime pour la sécurité et
          la modération…).
        </ToValidate>
      </Section>

      <Section id="conf-visibilite" title="Qui voit quoi">
        <List>
          <li>Les membres de votre club voient votre nom et votre rôle dans le club. Les clubs sont privés.</li>
          <li>Vos playlists personnelles ne sont visibles que de vous.</li>
          <li>
            Les modérateurs voient le nom de l&rsquo;auteur d&rsquo;une proposition, et l&rsquo;auteur ou
            l&rsquo;adresse de contact d&rsquo;un signalement. Les paroles publiées ne portent pas votre nom.
          </li>
          <li>Votre adresse e-mail n&rsquo;est affichée qu&rsquo;à vous, dans Compte.</li>
        </List>
      </Section>

      <Section id="conf-prestataires" title="Les prestataires">
        <p>Ghnaya s&rsquo;appuie sur des prestataires techniques, qui traitent des données pour son compte :</p>
        <List>
          <li>
            <strong className="font-medium">Vercel</strong> héberge le site ; ses fonctions s&rsquo;exécutent à
            Francfort (région fra1) ;
          </li>
          <li>
            <strong className="font-medium">Neon</strong> héberge la base de données, à Francfort, et en
            garde des sauvegardes ;
          </li>
          <li>
            <strong className="font-medium">Resend</strong> envoie les e-mails de connexion, depuis
            l&rsquo;Irlande : il reçoit votre adresse e-mail et le lien ;
          </li>
          <li>
            <strong className="font-medium">Anthropic</strong> génère la translittération automatique : il
            reçoit les paroles de la chanson et son dialecte, jamais de donnée sur vous ;
          </li>
          <li>
            <strong className="font-medium">Google</strong>, seulement si vous choisissez de vous connecter
            avec Google ;
          </li>
          <li>
            <strong className="font-medium">GitHub</strong> lance chaque nuit une copie de sauvegarde de la
            base, déposée chez un stockage objet.
          </li>
        </List>
        <ToValidate>
          prestataire et pays du stockage des sauvegardes nocturnes (pas encore choisi). Vercel, Neon, Resend,
          Anthropic, Google et GitHub sont des sociétés américaines : vérifier les accords de traitement
          (DPA) et l&rsquo;encadrement des transferts hors de l&rsquo;Union européenne pour chacun.
        </ToValidate>
      </Section>

      <Section id="conf-duree" title="Combien de temps">
        <List>
          <li>votre compte et ce qui s&rsquo;y rattache : jusqu&rsquo;à ce que vous le supprimiez ;</li>
          <li>une session : 7 jours, prolongés tant que vous utilisez le site ;</li>
          <li>un lien de connexion : 15 minutes ;</li>
          <li>les compteurs des limites de requêtes : effacés après un jour environ ;</li>
          <li>
            vos propositions et vos signalements : conservés après la suppression de votre compte, mais sans
            lien avec vous.
          </li>
        </List>
        <ToValidate>
          durée de conservation de l&rsquo;adresse de contact d&rsquo;un signalement (aucune purge
          aujourd&rsquo;hui) ; des sessions et liens expirés restés en base ; des sauvegardes (Neon, et le
          stockage objet, 30 jours proposés) ; des journaux de Vercel ; sort des comptes inactifs (aucune
          suppression automatique aujourd&rsquo;hui).
        </ToValidate>
      </Section>

      <Section id="conf-suppression" title="Supprimer votre compte">
        <p>
          Depuis <InlineLink href="/moi/compte">Compte</InlineLink>, vous pouvez supprimer votre compte. Partent
          avec lui : votre adresse, votre nom, vos sessions, votre liaison avec Google, vos playlists
          personnelles et votre place dans votre club. Restent, sans votre nom : vos propositions, vos
          signalements, et les clubs et playlists de club que vous avez créés en tant qu&rsquo;animateur.
        </p>
        <p>
          Si vous êtes le seul animateur d&rsquo;un club, désignez d&rsquo;abord un autre animateur ou supprimez
          le club.
        </p>
      </Section>

      <Section id="conf-droits" title="Vos droits">
        <p>
          Vous pouvez demander à accéder à vos données, à les corriger, à les effacer ou à les recevoir dans un
          format lisible, et vous opposer à un traitement ou demander sa limitation. Votre nom se corrige et
          votre compte se supprime directement dans Compte. Pour le reste, y compris changer d&rsquo;adresse
          e-mail, écrivez à <SupportEmail />.
        </p>
        <ToValidate>
          délai de réponse annoncé, vérification de l&rsquo;identité du demandeur, et autorité de contrôle
          auprès de laquelle porter réclamation (la CNIL en France, ou une autre selon l&rsquo;établissement
          du responsable).
        </ToValidate>
      </Section>

      <Section id="conf-cookies" title="Cookies">
        <p>Ghnaya ne pose que des cookies nécessaires au site, sans traceur ni mesure d&rsquo;audience :</p>
        <List>
          <li>
            <strong className="font-medium">la session</strong> (nom commençant par « better-auth »), qui
            vous garde connecté, 7 jours prolongés à l&rsquo;usage ;
          </li>
          <li>
            pendant une connexion avec Google, un cookie de vérification, 5 minutes ;
          </li>
          <li>
            après une demande de lien, l&rsquo;adresse à laquelle il est parti, pour l&rsquo;afficher sur
            « Vérifiez vos e-mails », 15 minutes, limité aux pages de connexion ;
          </li>
          <li>
            <strong className="font-medium">la langue</strong> choisie (« locale »), 1 an.
          </li>
        </List>
        <ToValidate>
          confirmer que ces cookies sont exemptés de consentement, et donc qu&rsquo;aucun bandeau n&rsquo;est
          requis.
        </ToValidate>
      </Section>

      <Section id="conf-modifications" title="Modifications">
        <p>
          Les conditions d&rsquo;utilisation sont sur{" "}
          <InlineLink href="/a-propos/conditions">une page à part</InlineLink>, la procédure de retrait sur{" "}
          <InlineLink href="/a-propos/droits">Vos droits et le retrait de contenus</InlineLink>.
        </p>
        <ToValidate>comment les membres sont prévenus d&rsquo;un changement de cette politique.</ToValidate>
      </Section>
    </LegalPage>
  );
}
