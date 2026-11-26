import type { Metadata } from "next";
import { InlineLink, LegalPage, List, Section, SupportEmail, ToValidate } from "@/components/legal/LegalParts";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les règles de Ghnaya : comptes, clubs, propositions, modération et statut des paroles publiées.",
};

/**
 * Conditions d'utilisation, tirées de ce que fait le code et de la spec (§4.3 rôles, §8 propositions,
 * §9 retraits, §10 clubs, §11 import). Ce que le code ne dit pas est dans un encadré « À valider ».
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions d'utilisation"
      updated="Version provisoire du 26 novembre 2026, en attente de relecture juridique."
      lead={
        <p>
          Ghnaya aide les clubs de chant à lire des paroles de chansons arabes en séance, chacun sur son
          téléphone. Ces conditions disent qui peut faire quoi sur le site, comment les paroles y arrivent et
          comment elles en sortent.
        </p>
      }
    >
      <Section id="cond-editeur" title="Qui édite Ghnaya">
        <p>
          Contact : <SupportEmail />.
        </p>
        <ToValidate>
          identité de l&rsquo;éditeur du site et du directeur de la publication, adresse, et mentions de
          l&rsquo;hébergeur (Vercel). Le service est-il gratuit, et le restera-t-il ?
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
          Vous êtes responsable de ce qui est fait depuis votre compte : ne partagez pas vos liens de connexion.
          Vous pouvez supprimer votre compte à tout moment depuis{" "}
          <InlineLink href="/moi/compte">Compte</InlineLink>.
        </p>
        <ToValidate>âge minimum pour créer un compte, et accord parental éventuel.</ToValidate>
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
            Vous cochez la case « Ce contenu est dans le domaine public ou j&rsquo;ai le droit de le partager » :
            ne proposez que des paroles pour lesquelles c&rsquo;est vrai.
          </li>
          <li>Les paroles font entre 20 et 20 000 caractères ; la translittération est facultative.</li>
          <li>Vous pouvez envoyer 10 propositions par jour, et une seule en attente par chanson.</li>
          <li>
            Une fois publiée, une chanson peut être corrigée par d&rsquo;autres propositions, ou retirée. Elle ne
            porte pas votre nom.
          </li>
        </List>
        <ToValidate>
          liste des contenus interdits (propos injurieux ou haineux, spam, textes sans rapport avec la chanson…).
          Droits que le membre accorde à Ghnaya sur ce qu&rsquo;il propose (licence, durée, et maintien après la
          suppression du compte, puisque les propositions restent publiées sans nom).
        </ToValidate>
      </Section>

      <Section id="cond-paroles" title="Les paroles publiées">
        <p>
          Ghnaya publie des paroles en texte seul : ni enregistrement, ni partition. Chaque fiche de chanson
          indique la source de ses paroles :
        </p>
        <List>
          <li>
            <strong className="font-medium">LRCLIB</strong> : paroles importées depuis LRCLIB, une base de
            paroles ouverte et collaborative, publiées sans relecture préalable ; leur exactitude n&rsquo;est pas
            garantie et les modérateurs peuvent les corriger ;
          </li>
          <li>
            <strong className="font-medium">Domaine public</strong> : chants traditionnels, ou textes dont
            l&rsquo;auteur est mort depuis plus de 50 ans (règle tunisienne : 50 ans à compter du 1er janvier
            qui suit le décès) ;
          </li>
          <li>
            <strong className="font-medium">Proposition</strong> : paroles envoyées par un membre et relues par
            un modérateur.
          </li>
        </List>
        <p>
          Ghnaya ne détient pas les droits sur les paroles qu&rsquo;il publie. La translittération en lettres
          latines peut être générée automatiquement : elle porte alors la mention « automatique » et peut
          contenir des erreurs.
        </p>
        <ToValidate>
          base juridique de la publication des paroles importées de LRCLIB, et conditions de réutilisation
          de cette base. Validité de la règle des 50 ans pour les pays où le site est lu (70 ans en France et
          dans l&rsquo;Union européenne).
        </ToValidate>
      </Section>

      <Section id="cond-usage" title="Ce que vous pouvez faire des paroles">
        <p>Les paroles sont là pour être lues, seul ou en séance avec votre club.</p>
        <ToValidate>
          usages autorisés et interdits (copie, diffusion, extraction automatisée du catalogue). Le site limite
          déjà la recherche à 60 requêtes par minute et par adresse IP.
        </ToValidate>
      </Section>

      <Section id="cond-moderation" title="Signalements et retraits">
        <p>
          Tout le monde peut signaler une chanson depuis sa fiche : droits d&rsquo;auteur, paroles erronées,
          doublon ou spam, dans la limite de 10 signalements par jour. Un modérateur retire la chanson, la
          corrige ou classe le signalement sans suite. Un retrait est réversible : la chanson est masquée, pas
          effacée. La procédure de retrait pour droits d&rsquo;auteur est décrite sur{" "}
          <InlineLink href="/a-propos/droits">Vos droits et le retrait de contenus</InlineLink>.
        </p>
        <p>Un admin peut aussi retirer d&rsquo;un coup toutes les chansons d&rsquo;une source.</p>
        <ToValidate>
          ce qui arrive au compte d&rsquo;un membre qui enfreint ces règles (le site ne permet aujourd&rsquo;hui
          ni de suspendre ni de fermer le compte d&rsquo;un autre) ; délai de traitement des signalements.
        </ToValidate>
      </Section>

      <Section id="cond-responsabilite" title="Disponibilité et responsabilité">
        <p>
          Si la translittération est indisponible, le lecteur affiche les paroles en arabe seul : la lecture
          n&rsquo;est jamais bloquée.
        </p>
        <ToValidate>
          engagement de disponibilité, limitation de responsabilité, droit applicable et juridiction
          compétente, et procédure de modification de ces conditions (prévenir les membres, date
          d&rsquo;effet). Faut-il demander l&rsquo;accord à ces conditions à la création du compte ?
        </ToValidate>
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
