import { InlineLink, LegalPage, List, Section, SupportEmail, ToValidate } from "@/components/legal/LegalParts";

/** Titre et description de la page, en français (la version qui fait foi). */
export const TERMS_META_FR = {
  title: "Conditions d'utilisation",
  description: "Les règles de Ghnaya : comptes, clubs, propositions, modération et statut des paroles publiées.",
};

/**
 * Conditions d'utilisation et mentions légales, tirées de ce que fait le code et de la spec (§4.3 rôles,
 * §8 propositions, §9 retraits, §10 clubs, §11 import), puis relues par une juriste le 27/11/2026.
 * Restent « À valider » les faits que seul l'éditeur peut donner, et la décision sur les paroles LRCLIB.
 */
export function TermsFr() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      updated="Version provisoire du 27 novembre 2026."
      lead={
        <p>
          Ghnaya aide les clubs de chant à lire des paroles de chansons arabes en séance, chacun sur son
          téléphone. Ces conditions disent qui peut faire quoi sur le site, comment les paroles y arrivent et
          comment elles en sortent. Créer un compte, c&rsquo;est les accepter.
        </p>
      }
    >
      <Section id="cond-editeur" title="Mentions légales">
        <List>
          <li>
            <strong className="font-medium">Éditeur et directeur de la publication</strong> : voir ci-dessous.
            Contact : <SupportEmail />.
          </li>
          <li>
            <strong className="font-medium">Hébergeur</strong> : Vercel Inc., 440 N Barranca Ave #4133, Covina,
            CA 91723, États-Unis.
          </li>
        </List>
        <p>Le service est gratuit.</p>
        <ToValidate>
          éditeur : nom (personne ou association), adresse, et nom du directeur de la publication. Un particulier
          qui édite le site à titre non professionnel peut ne donner que les coordonnées de l&rsquo;hébergeur, à
          qui il a communiqué son identité. Confirmer l&rsquo;adresse de Vercel et ajouter son numéro de
          téléphone, d&rsquo;après ses propres mentions légales.
        </ToValidate>
      </Section>

      <Section id="cond-acces" title="Accès et compte">
        <p>
          Sans compte, vous pouvez chercher une chanson, la lire et la signaler. Avec un compte, vous pouvez
          aussi créer des playlists personnelles, rejoindre un club, proposer des chansons et des corrections, et
          demander la translittération d&rsquo;une chanson qui n&rsquo;en a pas.
        </p>
        <p>
          Le compte est créé à la première connexion, par un lien envoyé à votre adresse e-mail ou avec Google.
          Il faut avoir 15 ans ; en dessous, l&rsquo;accord d&rsquo;un parent est nécessaire. Vous êtes
          responsable de ce qui est fait depuis votre compte : ne partagez pas vos liens de connexion. Vous
          pouvez supprimer votre compte à tout moment depuis <InlineLink href="/moi/compte">Compte</InlineLink>.
        </p>
      </Section>

      <Section id="cond-roles" title="Les rôles">
        <List>
          <li>
            <strong className="font-medium">Membre</strong> : toute personne qui a un compte. Un membre fait
            partie d&rsquo;un seul club à la fois.
          </li>
          <li>
            <strong className="font-medium">Animateur</strong> : rôle attribué par un admin. Il crée et anime un
            ou plusieurs clubs, gère leurs playlists et leurs membres.
          </li>
          <li>
            <strong className="font-medium">Modérateur</strong> : rôle attribué par un admin. Il relit les
            propositions, traite les signalements, retire et rétablit les chansons. Il ne peut pas approuver sa
            propre proposition.
          </li>
          <li>
            <strong className="font-medium">Admin</strong> : il attribue les rôles et importe les catalogues.
          </li>
        </List>
      </Section>

      <Section id="cond-clubs" title="Clubs et playlists">
        <p>
          Un club est privé : seuls ses membres voient ses playlists et la liste de ses membres. On le rejoint par
          un lien d&rsquo;invitation, que l&rsquo;animateur peut régénérer pour rendre l&rsquo;ancien invalide.
          Rejoindre un autre club fait quitter le premier, après confirmation.
        </p>
        <p>
          Les membres lisent les playlists du club et peuvent les copier dans leurs playlists personnelles, qui
          restent privées. Un animateur qui supprime son club supprime ses playlists de club ; les copies des
          membres restent.
        </p>
      </Section>

      <Section id="cond-propositions" title="Proposer des paroles">
        <p>
          Tout membre peut proposer une chanson ou une correction. Chaque proposition est relue par un modérateur
          avant d&rsquo;être publiée : il l&rsquo;approuve, ou la rejette avec une note que vous retrouvez dans
          Mes contributions.
        </p>
        <List>
          <li>
            Vous cochez la case « Ces paroles sont dans le domaine public, ou j&rsquo;ai le droit de les partager » :
            ne proposez que des paroles pour lesquelles c&rsquo;est vrai.
          </li>
          <li>Les paroles font entre 20 et 20 000 caractères ; la translittération est facultative.</li>
          <li>Vous pouvez envoyer 10 propositions par jour, et une seule en attente par chanson.</li>
          <li>
            Une fois publiée, une chanson peut être corrigée par d&rsquo;autres propositions, ou retirée. Elle ne
            porte pas votre nom.
          </li>
        </List>
        <p>
          <strong className="font-medium">Ce que vous accordez à Ghnaya.</strong> En envoyant une proposition,
          vous autorisez Ghnaya, gratuitement, sans exclusivité, pour le monde entier et pour toute la durée des
          droits, à la reproduire, la publier sur le site, la corriger et l&rsquo;accompagner d&rsquo;une
          translittération. Cette autorisation porte sur les droits que vous détenez vous-même, par exemple sur
          votre translittération ; elle demeure après la suppression de votre compte, puisque les paroles
          publiées restent en ligne sans votre nom.
        </p>
        <p>
          <strong className="font-medium">Ce que vous garantissez.</strong> Vous garantissez que la proposition
          est dans le domaine public ou que vous avez le droit de la partager, et qu&rsquo;elle ne porte atteinte
          aux droits de personne. Si un tiers met en cause Ghnaya à cause d&rsquo;une proposition qui ne
          respectait pas cette garantie, vous en répondez.
        </p>
        <p>Sont interdits, dans les propositions comme dans les signalements :</p>
        <List>
          <li>les contenus illicites, et notamment ceux qui reproduisent une œuvre sans l&rsquo;accord de ses ayants droit ;</li>
          <li>les propos injurieux, diffamatoires, haineux ou violents ;</li>
          <li>les données personnelles d&rsquo;autrui ;</li>
          <li>le spam, la publicité et les textes sans rapport avec la chanson ;</li>
          <li>les signalements abusifs ou faits de mauvaise foi.</li>
        </List>
      </Section>

      <Section id="cond-paroles" title="Les paroles publiées">
        <p>
          Ghnaya publie des paroles en texte seul : ni enregistrement, ni partition. Les droits sur les paroles
          appartiennent à leurs auteurs et à leurs ayants droit. Chaque fiche de chanson indique la source de ses
          paroles :
        </p>
        <List>
          <li>
            <strong className="font-medium">LRCLIB</strong> : paroles importées depuis LRCLIB, une base de
            paroles ouverte et collaborative ; leur exactitude n&rsquo;est pas garantie et les modérateurs peuvent
            les corriger ;
          </li>
          <li>
            <strong className="font-medium">Domaine public</strong> : chants traditionnels, ou textes dont
            l&rsquo;auteur est mort depuis plus de 70 ans, comptés à partir du 1er janvier qui suit le décès ;
          </li>
          <li>
            <strong className="font-medium">Proposition</strong> : paroles envoyées par un membre et relues par
            un modérateur.
          </li>
        </List>
        <p>
          Un ayant droit qui ne souhaite pas qu&rsquo;un texte figure sur Ghnaya peut en demander le retrait,
          selon la procédure décrite sur{" "}
          <InlineLink href="/a-propos/droits">Droits d&rsquo;auteur et retrait de contenus</InlineLink>.
        </p>
        <p>
          La translittération en lettres latines peut être générée automatiquement : elle porte alors la mention
          « automatique » et peut contenir des erreurs.
        </p>
        <ToValidate>
          décision à prendre avant la mise en ligne de cette page. Les paroles importées de LRCLIB sont mises en
          ligne par Ghnaya lui-même, sans relecture : Ghnaya en est l&rsquo;éditeur, non l&rsquo;hébergeur, et
          LRCLIB n&rsquo;accorde aucun droit sur les textes. Leur publication intégrale sans autorisation des
          ayants droit est une contrefaçon. Options : obtenir des licences (éditeurs ou agrégateur de paroles),
          retirer ces paroles du catalogue public, ou documenter le risque accepté. Pour les chants
          traditionnels, vérifier aussi l&rsquo;encadrement du folklore par la loi tunisienne n° 94-36 et le
          statut des versions écrites ou arrangées.
        </ToValidate>
      </Section>

      <Section id="cond-usage" title="Ce que vous pouvez faire des paroles">
        <p>
          Les paroles sont là pour être lues, seul ou en séance avec votre club. Il est interdit d&rsquo;extraire
          le catalogue de façon automatisée ou systématique, et de rediffuser les paroles ailleurs, sauf si elles
          sont dans le domaine public. Le site limite la recherche à 60 requêtes par minute et par adresse IP.
        </p>
      </Section>

      <Section id="cond-moderation" title="Signalements, retraits et recours">
        <p>
          Tout le monde peut signaler une chanson depuis sa fiche : droits d&rsquo;auteur, paroles erronées,
          doublon ou spam, dans la limite de 10 signalements par jour. Un modérateur retire la chanson, la
          corrige ou classe le signalement sans suite. Un retrait est réversible : la chanson est masquée, pas
          effacée. La procédure de retrait pour droits d&rsquo;auteur est décrite sur{" "}
          <InlineLink href="/a-propos/droits">Droits d&rsquo;auteur et retrait de contenus</InlineLink>.
        </p>
        <p>Un admin peut aussi retirer d&rsquo;un coup toutes les chansons d&rsquo;une source.</p>
        <p>
          Si une proposition que vous avez envoyée est rejetée, la note du modérateur vous en dit la raison,
          dans Mes contributions. Vous pouvez contester une décision de modération, la vôtre comme celle prise
          sur votre signalement, en écrivant à <SupportEmail /> : une autre personne que l&rsquo;auteur de la
          décision la réexamine.
        </p>
        <p>
          En cas de manquement à ces conditions, Ghnaya peut retirer le contenu en cause et, si le manquement est
          grave ou répété, suspendre ou fermer le compte, après vous en avoir dit la raison.
        </p>
        <ToValidate>
          délai de traitement des signalements à annoncer (par exemple 7 jours, plus court pour les droits
          d&rsquo;auteur). Le site ne permet pas encore de suspendre ni de fermer le compte d&rsquo;un autre, ni
          d&rsquo;écrire au contributeur dont une chanson publiée est retirée : à programmer.
        </ToValidate>
      </Section>

      <Section id="cond-responsabilite" title="Disponibilité et responsabilité">
        <p>
          Ghnaya est fourni gratuitement, tel quel. Nous faisons de notre mieux pour qu&rsquo;il reste disponible
          et exact, sans pouvoir le garantir : le site peut être interrompu pour maintenance ou à la suite
          d&rsquo;une panne. Si la translittération est indisponible, le lecteur affiche les paroles en arabe
          seul : la lecture n&rsquo;est jamais bloquée.
        </p>
        <p>
          Ghnaya répond des dommages directs qu&rsquo;il cause par sa faute. Il ne répond pas de l&rsquo;usage que
          vous faites des paroles, ni des contenus envoyés par les membres avant qu&rsquo;un signalement les lui
          fasse connaître.
        </p>
      </Section>

      <Section id="cond-modifications" title="Modifications, droit applicable">
        <p>
          Ces conditions peuvent évoluer. Si elles changent de façon importante, les membres en sont prévenus dans
          le site avant la date d&rsquo;effet, indiquée en haut de cette page ; continuer à utiliser son compte
          après cette date vaut accord. Vous pouvez aussi supprimer votre compte.
        </p>
        <p>
          Ces conditions sont soumises au droit français. En cas de litige, écrivez-nous d&rsquo;abord à{" "}
          <SupportEmail /> pour chercher une solution amiable. À défaut, le litige est porté devant les
          tribunaux compétents selon les règles de droit commun.
        </p>
        <ToValidate>droit français à confirmer selon l&rsquo;établissement de l&rsquo;éditeur.</ToValidate>
      </Section>

      <Section id="cond-donnees" title="Vos données">
        <p>
          Ce que Ghnaya enregistre et vos droits sont décrits dans la{" "}
          <InlineLink href="/a-propos/confidentialite">politique de confidentialité</InlineLink>.
        </p>
      </Section>
    </LegalPage>
  );
}
