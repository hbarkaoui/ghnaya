import { InlineLink, LegalPage, List, Section, SupportEmail, ToValidate } from "@/components/legal/LegalParts";

/** Titre et description de la page, en français (la version qui fait foi). */
export const PRIVACY_META_FR = {
  title: "Politique de confidentialité",
  description: "Les données que Ghnaya enregistre, pourquoi, chez qui, combien de temps, et vos droits.",
};

/**
 * Politique de confidentialité, tirée de ce que fait le code (schéma `lib/db/schema`, Better Auth,
 * limites de requêtes, suppression de compte) et du guide de mise en production, puis relue par une
 * juriste le 27/11/2026. Restent « À valider » les faits que seul l'éditeur peut donner (identité,
 * régions des prestataires) et les durées que le code n'applique pas encore.
 */
export function PrivacyFr() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updated="Version provisoire du 27 novembre 2026."
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
          Le responsable du traitement est la personne qui édite Ghnaya, un particulier agissant à titre non
          professionnel (voir les{" "}
          <InlineLink href="/a-propos/conditions#cond-editeur">mentions légales</InlineLink>). Pour toute
          question sur vos données, écrivez à <SupportEmail />. Ghnaya n&rsquo;a pas désigné de délégué à la
          protection des données : il n&rsquo;y est pas tenu.
        </p>
        {/*
          Écart assumé (décision de l'éditeur, 27/11/2026) : le RGPD (art. 13, 1, a) demande le nom du
          responsable du traitement ; l'éditeur, particulier, garde l'anonymat que permet la LCEN (art. 6, III, 2).
        */}
        <ToValidate>
          l&rsquo;adresse de contact est un groupe Google : vérifier que ses archives ne sont lisibles que par
          ses gestionnaires (les demandes contiendront des données personnelles), ou la remplacer par une boîte
          privée.
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
            de votre compte Google, votre nom, votre adresse e-mail et l&rsquo;adresse de votre photo de profil.
            Les jetons que Google remet à la connexion ne sont pas conservés ;
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
            saisi. L&rsquo;hébergeur journalise aussi chaque requête (adresse IP, page demandée).
          </li>
        </List>
        <p>
          Enfin, votre navigateur garde vos préférences du lecteur (taille du texte, mode sombre, affichage) dans
          son stockage local : elles ne sont pas envoyées à Ghnaya.
        </p>
      </Section>

      <Section id="conf-finalites" title="Pourquoi, et sur quelle base">
        <List>
          <li>
            <strong className="font-medium">fournir le service que vous demandez</strong> (exécution des
            conditions d&rsquo;utilisation) : vous connecter et garder votre session ouverte, afficher votre nom
            à votre club, tenir vos playlists et vos propositions, vous envoyer le lien de connexion ;
          </li>
          <li>
            <strong className="font-medium">modérer le catalogue</strong> (intérêt légitime de Ghnaya à
            publier des paroles exactes et licites) : relire les propositions et traiter les signalements ;
          </li>
          <li>
            <strong className="font-medium">traiter les signalements de contenus illicites</strong>, y compris
            pour droits d&rsquo;auteur, et répondre à la personne qui signale (obligation légale de
            l&rsquo;hébergeur) ;
          </li>
          <li>
            <strong className="font-medium">protéger le site</strong> (intérêt légitime) : limiter les abus
            (envois répétés, recherche automatisée) et corriger les erreurs.
          </li>
        </List>
        <p>Ghnaya n&rsquo;envoie pas de lettre d&rsquo;information : le seul e-mail est le lien de connexion.</p>
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
        <p>
          Ghnaya s&rsquo;appuie sur des prestataires techniques, qui traitent des données pour son compte et
          selon ses instructions :
        </p>
        <List>
          <li>
            <strong className="font-medium">Vercel</strong> héberge le site ; ses fonctions s&rsquo;exécutent à
            Francfort ;
          </li>
          <li>
            <strong className="font-medium">Neon</strong> héberge la base de données et en garde des
            sauvegardes ;
          </li>
          <li>
            un <strong className="font-medium">fournisseur d&rsquo;e-mails</strong> envoie les liens de
            connexion : il reçoit votre adresse e-mail et le lien ;
          </li>
          <li>
            <strong className="font-medium">Anthropic</strong> génère la translittération automatique : il
            reçoit les paroles de la chanson et son dialecte, sans aucune donnée de votre compte ;
          </li>
          <li>
            <strong className="font-medium">Google</strong> reçoit les messages écrits à l&rsquo;adresse de
            contact, et, si vous choisissez de vous connecter avec Google, les données de cette connexion ;
          </li>
          <li>
            <strong className="font-medium">GitHub</strong> lance chaque nuit une copie de sauvegarde de la
            base, déposée chez un stockage objet.
          </li>
        </List>
        <p>
          Plusieurs de ces sociétés sont établies aux États-Unis. Quand des données y sont transférées, le
          transfert est encadré par le cadre de protection des données UE–États-Unis (Data Privacy Framework)
          auquel la société adhère, ou à défaut par les clauses contractuelles types de la Commission
          européenne.
        </p>
        <ToValidate>
          nom et région du fournisseur d&rsquo;e-mails (Resend, Brevo, Mailjet ou Postmark) ; région du projet
          Neon ; prestataire et pays du stockage des sauvegardes nocturnes. Pour chaque société américaine,
          vérifier son adhésion au Data Privacy Framework (dataprivacyframework.gov) ou les clauses types de son
          accord de traitement, avant de garder le paragraphe ci-dessus.
        </ToValidate>
      </Section>

      <Section id="conf-duree" title="Combien de temps">
        <List>
          <li>
            votre compte et ce qui s&rsquo;y rattache : jusqu&rsquo;à ce que vous le supprimiez, ou après 3 ans
            sans connexion. Dans ce cas, un e-mail vous prévient un mois avant : il suffit de vous connecter
            pour garder votre compte. Le compte du seul animateur d&rsquo;un club n&rsquo;est pas supprimé
            automatiquement ;
          </li>
          <li>
            une session : 7 jours, prolongés tant que vous utilisez le site ; une session expirée est effacée
            dans la nuit ;
          </li>
          <li>un lien de connexion : 15 minutes, puis effacé dans la nuit ;</li>
          <li>les compteurs des limites de requêtes : effacés après un jour environ ;</li>
          <li>l&rsquo;adresse de contact d&rsquo;un signalement : effacée un an après sa clôture ;</li>
          <li>
            vos propositions et vos signalements : conservés après la suppression de votre compte, mais sans
            lien avec vous ;
          </li>
          <li>les copies de sauvegarde de la base : 30 jours ;</li>
          <li>les journaux de l&rsquo;hébergeur (adresse IP, page demandée) : 1 heure.</li>
        </List>
        {/* 1 heure : offre Hobby de Vercel (relevé du 28/11/2026). À revoir en cas de passage à une offre payante. */}
        <ToValidate>
          ajouter la durée de l&rsquo;historique de Neon (restauration à un instant donné), telle que
          l&rsquo;offre du projet l&rsquo;indique.
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
          format lisible, et vous opposer à un traitement fondé sur l&rsquo;intérêt légitime ou demander sa
          limitation. Vous pouvez aussi définir des directives sur le sort de vos données après votre décès.
        </p>
        <p>
          Votre nom se corrige et votre compte se supprime directement dans Compte. Pour le reste, y compris
          changer d&rsquo;adresse e-mail, écrivez à <SupportEmail /> depuis l&rsquo;adresse de votre compte :
          c&rsquo;est ainsi que nous vérifions que la demande vient de vous. Nous répondons dans un délai
          d&rsquo;un mois, prolongeable de deux mois si la demande est complexe ; nous vous le dirions alors.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la
          Commission nationale de l&rsquo;informatique et des libertés (CNIL, cnil.fr).
        </p>
      </Section>

      <Section id="conf-cookies" title="Cookies">
        <p>
          Ghnaya ne pose que des cookies nécessaires au fonctionnement du site ou à un choix que vous avez fait,
          sans traceur ni mesure d&rsquo;audience. Ils ne demandent donc pas votre consentement :
        </p>
        <List>
          <li>
            <strong className="font-medium">la session</strong> (nom commençant par « better-auth »), qui
            vous garde connecté, 7 jours prolongés à l&rsquo;usage ;
          </li>
          <li>pendant une connexion avec Google, un cookie de vérification, 5 minutes ;</li>
          <li>
            après une demande de lien, l&rsquo;adresse à laquelle il est parti, pour l&rsquo;afficher sur
            « Vérifiez vos e-mails », 15 minutes, limité aux pages de connexion ;
          </li>
          <li>
            <strong className="font-medium">la langue</strong> choisie (« locale »), 1 an.
          </li>
        </List>
      </Section>

      <Section id="conf-modifications" title="Modifications">
        <p>
          Si cette politique change de façon importante, les membres en sont prévenus dans le site avant la date
          d&rsquo;effet, indiquée en haut de cette page.
        </p>
        <p>
          Les conditions d&rsquo;utilisation sont sur{" "}
          <InlineLink href="/a-propos/conditions">une page à part</InlineLink>, la procédure de retrait sur{" "}
          <InlineLink href="/a-propos/droits">Droits d&rsquo;auteur et retrait de contenus</InlineLink>.
        </p>
      </Section>
    </LegalPage>
  );
}
