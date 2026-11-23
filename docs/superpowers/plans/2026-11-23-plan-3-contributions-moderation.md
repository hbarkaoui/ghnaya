# Plan 3 — Contributions, modération et signalements — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objectif** : les propositions d'ajout et de correction, la file de modération, les signalements, les retraits et leur rétablissement passent en base. À la fin du plan, aucun écran ne lit plus de données fictives, et la passerelle `lib/catalog/read.ts` ne lit plus que la base.

**Architecture** :
- Deux tables : `song_revisions` (une proposition = la version complète proposée, en `jsonb`) et `reports`.
- `src/lib/moderation` reçoit les lectures (`queries.ts`) et les écritures en transaction (`revisionWrite.ts`, `reportWrite.ts`). Les règles pures déjà écrites pour la maquette (`apply.ts`, `review.ts`, `queue.ts`, `diff.ts`, `lib/contribution/validate.ts`, `lib/report/validate.ts`) restent la référence, et les écritures les appliquent.
- L'approbation d'une proposition écrit la chanson, ses artistes et ses colonnes de recherche dans la même transaction que le changement de statut de la proposition.
- `src/lib/auth/permissions.ts` reste **le seul endroit** où l'on décide qui peut faire quoi : il reçoit `canContribute` et `canApproveRevision`.
- L'autocomplétion des artistes interroge la table `artists` par une route `GET /api/artistes?q=`, au lieu de recevoir tous les artistes du catalogue.

**Stack** : celle des plans 1 et 2. Aucune dépendance nouvelle.

**Spec** : `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md` (§4.3 rôles, §4.4 pages, §5 modèle, §8 contributions et modération, §9 signalements et retraits, §12 limites et suppression de compte, §13 tests).

**Plans précédents** : `docs/superpowers/plans/2026-11-18-plan-1-catalogue-recherche.md` (terminé le 21/11/2026) et `docs/superpowers/plans/2026-11-21-plan-2-comptes-clubs-playlists.md` (terminé le 22/11/2026). Leurs conventions s'appliquent : tests, commits, base locale sur le port 5433, `pnpm exec vitest run --project integration <fichier>` pour lancer un seul fichier d'intégration.

**Plan suivant**, hors de ce plan : plan 4, translittération (§7).

## État des tâches

Toutes les tâches ont été exécutées le 23/11/2026, sur la branche `feat/contributions-moderation`, une revue après chacune. À la fin de la tâche 10 : 629 tests unitaires, 207 tests d'intégration et 14 parcours de bout en bout passaient.

| Tâche | État | Ce qui a été vérifié, et les écarts constatés |
|---|---|---|
| 1. Schéma | Faite le 23/11/2026 (`4cf0999`) | Tables `song_revisions` et `reports`, avec les auteurs nuls (`ON DELETE SET NULL`, écart 1). Tests d'intégration du schéma. Lacunes de test relevées en revue, non traitées : `rights_declared = false`, `reviewer_id` et `resolved_by` à `SET NULL`, signalement ouvert avec une note. |
| 2. Propositions en base | Faite le 23/11/2026 (`fc977b3`) | Lectures, envoi, rejet, droits et limites quotidiennes. La fenêtre de limite est le jour UTC (`hitRateLimit` aligne l'époque sur 86 400 s). L'index unique `(author_id, song_id)` ne restreint pas les ajouts, dont le `song_id` est nul : voulu, comme le dit le commentaire du schéma. |
| 3. Approuver une proposition | Faite le 23/11/2026 (`d0ff9e2`) | Approbation en une transaction, `import_locked` posé sur une correction (écart 6). Relevé en revue, non traité : deux approbations qui créent les mêmes nouveaux artistes dans l'ordre inverse pourraient se bloquer mutuellement. |
| 4. Artistes connus et « existe peut-être déjà » | Faite le 23/11/2026 (`48e714a`) | Vérifiée dans le navigateur (compte de Leïla) : « hedi » propose Hedi Jouini, ↓ puis Entrée le choisit ; « sidi mansour » avec Saber Rebai montre Sidi Mansour, sans extrait de paroles ; « fayrouz » trouve Fairuz. Une ligne de `actions/contribute.ts` change hors du texte de la tâche (`artistCandidates` à la place de `knownArtists(SONGS)`), jugée nécessaire en revue. |
| 5. Envoi, Mes contributions, pastille de « Moi » | Faite le 23/11/2026 (`b4f1da2`) | Vérifiée dans le navigateur (compte de Leïla) : un ajout mène à `/mes-contributions` avec « En attente » ; `/moi` indique « 1 en attente » ; une seconde correction de la même chanson répond « Votre correction attend déjà sa relecture ». Les deux propositions d'essai ont ensuite été supprimées de la base de développement. Un compte Google à l'adresse non vérifiée ne peut pas proposer (`canContribute` lit `emailVerified`). |
| 6. File de modération et décisions | Faite le 23/11/2026 (`9e94ecd`) | Vérifiée dans le navigateur (compte de Rania) : cinq propositions de la plus ancienne à la plus récente, celle de Leïla en dernier ; approuver « Lamma Bada » affiche « Proposition approuvée », et la chanson sort dans la recherche avec la source « Proposition » ; rejeter sans note affiche « Écrivez une note… ». **Non vérifié dans le navigateur** : la page de la proposition refusée de Leïla avec la note de Rania, contrôlée en base seulement. Écart : `await moderationQueueSize()` dans `moi/page.tsx`, que l'extrait du plan omettait. Pas de test pour `noteTooLong` ni pour un identifiant non UUID dans `moderationActions.test.ts`. |
| 7. Signalements, retraits, rétablissement | Faite le 23/11/2026 (`3c52342`) | Vérifiée dans le navigateur (après un redémarrage du serveur de développement, un cache périmé ayant gardé une erreur pendant l'édition d'un fichier de messages) : signalement d'un visiteur sur « El Atlal » ; retrait avec note (la page de la chanson répond « introuvable ou retirée », la playlist « Séance du jeudi » affiche « Chanson retirée ») ; rétablissement (la chanson, la playlist et la recherche reviennent). **L'absence de la chanson retirée dans la recherche n'a pas été vue dans le navigateur** : elle est couverte par `reports.test.ts`. Écart : la file place les signalements de droits d'auteur en tête, puis par ancienneté. L'attente de l'étape 9 (« au-dessus de celui de la veille ») supposait des dates différentes ; avec les dates de la démonstration, le signalement de droits d'auteur du 17/11 reste au-dessus du nouveau, ce que la règle de la spec donne. |
| 8. Retrait en masse | Faite le 23/11/2026 (`ac9d195`) | `pnpm songs:remove`. À blanc : 11 chansons comptées, aucune retirée. L'exécution a lancé `seed:fixtures`, qui a remis à zéro les données de démonstration de la base de développement : `pnpm seed:demo` est à relancer avant les tests de bout en bout ou le navigateur. |
| 9. La passerelle ne lit plus que la base | Faite le 23/11/2026 (`2053574`) | Plus aucune lecture de données fictives par les écrans. Recherche des restes (propositions, signalements, modération, `songStore`, chansons proches, compte) : rien. |
| 10. Tests de bout en bout | Faite le 23/11/2026 (`95bee4a`) | 14 parcours verts. Le rejet avec note n'y figure pas : il est couvert par `moderationActions.test.ts` et par la vérification de la tâche 6. |
| 11. Documentation, spec, état du plan | Faite le 23/11/2026 | README (« Modération », données de démonstration), spec §4.3, §4.4, §5, §8.2, §8.5, §9 et §12 datées et renvoyant à ce plan, et cette section. Aucun test lancé : changements de documentation seulement. |

### Non couvert par les vérifications

- Le rendu en arabe des nouveaux écrans (rétablissement, messages de limite, file de modération) : les vérifications dans le navigateur ont été faites en français.
- Le comportement d'un antivirus de messagerie qui ouvre le lien magique avant la personne : resté ouvert depuis le plan 2.
- La proposition d'un contenu de plus de 20 000 caractères.
- La page de la proposition refusée de Leïla (base seule) et l'absence d'une chanson retirée dans la recherche (test d'intégration seul), voir les tâches 6 et 7.

### Limites connues, laissées en l'état

- `--restore` retrouve un retrait en masse par son seul motif : un retrait fait depuis un signalement avec une note identique serait rétabli avec lui. Une marque « bulk: » ou une colonne d'origine le distinguerait.
- L'adresse IP de la limite des signalements est le premier élément de `X-Forwarded-For` (comme depuis le plan 1) : fiable seulement derrière un serveur frontal qui réécrit cet en-tête, comme celui de Vercel.
- Un rétablissement garde `import_locked` à vrai.
- `restoreSongAction` ignore le résultat « notRemoved » et affiche toujours « rétablie » ; la section « Rétablir » s'affiche sur tout signalement dont la chanson est retirée.
- Le quota de propositions est consommé avant l'écriture : le perdant d'une course en perd une.
- Petites remarques de revue, non traitées : `.last()` sur « Lamma Bada » dans les parcours de bout en bout (dépend de l'ordre de la file et de la démonstration), libellés « Chanson retirée » et « rétablie » cherchés sans précision, un commentaire de `mocks/catalog.ts` qui parle de `STORED_TRANSLIT` hors de propos, et aucun message de confirmation avant un retrait en masse hors `--dry-run`.

## Contraintes globales

- TypeScript `strict: true`. Aucun `any` explicite.
- Tous les identifiants sont des UUID générés par PostgreSQL. Toutes les tables ont `created_at` et `updated_at`, et chaque écriture renseigne `updated_at`.
- Les pages n'écrivent jamais de SQL. Elles passent par `lib/moderation`, `lib/catalog`, `lib/contribution` ou les autres modules de requêtes.
- Toutes les Server Actions revérifient la session, les droits et les entrées : afficher un bouton n'est pas un contrôle d'accès (spec §12).
- Les paroles, les notes, les détails d'un signalement et les noms sont rendus en texte brut. Pas de `dangerouslySetInnerHTML`.
- Les modules lus par un script (`pnpm seed:demo`, `pnpm songs:remove`) n'importent pas `server-only` : ce paquet lève une erreur hors du rendu de Next.
- **Propositions** (spec §8) :
  - formulaire : titre arabe et/ou latin (l'un des deux au moins), artistes, dialecte, paroles en arabe de 20 à 20 000 caractères, translittération facultative (une ligne latine par ligne arabe), case des droits obligatoire. La validation existe déjà (`validateProposal`) ;
  - « existe peut-être déjà » : les trois meilleurs résultats de `searchSongs` sur le titre, avant l'envoi ;
  - une ligne `song_revisions` en `pending` par envoi ; une correction porte le `song_id`, un ajout a un `song_id` nul ;
  - **une seule révision `pending` par auteur et par chanson** ;
  - e-mail vérifié obligatoire, et **10 révisions par jour au maximum par utilisateur**.
- **Modération** (spec §4.3, §8.4, §8.5) :
  - la file est traitée de la plus ancienne à la plus récente ; une correction se lit par un diff ligne par ligne des paroles, plus les champs modifiés ;
  - le modérateur **approuve**, ou **rejette avec une note obligatoire** (1 000 caractères au plus, `NOTE_MAX`) ;
  - **un modérateur ne peut pas approuver sa propre révision** ; un admin approuve aussi les siennes, pour amorcer la plateforme ;
  - l'approbation se fait **en une seule transaction** : un ajout crée la chanson (`source = contribution`), une correction met la chanson à jour ; les colonnes de recherche sont recalculées par `songSearchColumns` ; si les paroles changent sans nouvelle translittération, `lyrics_translit` est vidée et `translit_status` repasse à `none` (règle déjà codée dans `songFromProposal`).
- **Signalements** (spec §9) :
  - le formulaire est ouvert à tous ; sans compte, l'e-mail de contact est obligatoire ; **10 signalements par jour et par IP** ;
  - la file place les signalements `copyright` en tête, puis les autres par ancienneté ;
  - le modérateur retire la chanson (`status = removed`, la note en est le motif), la corrige, ou classe le signalement sans suite, toujours avec une note ;
  - un retrait est **doux** et **annulable** par un modérateur ;
  - un admin peut retirer d'un coup toutes les chansons d'une `source`, au besoin filtrées par artiste.
- **Suppression de compte** (spec §12) : les révisions du compte sont conservées, anonymisées.
- Les commits suivent Conventional Commits (`feat:`, `test:`, `chore:`…).

## Écarts assumés par rapport à la spec, à confirmer en revue

1. **Anonymisation par un auteur nul.** `song_revisions.author_id` est nullable, avec `ON DELETE SET NULL`, au lieu de pointer vers un utilisateur système « compte supprimé ». Pas de compte spécial où l'on pourrait se connecter, ni à protéger de `pnpm user:role`. L'index « une seule révision en attente par auteur et par chanson » reste valable, puisque deux auteurs nuls ne se gênent pas. Et la base anonymise dans la transaction même de la suppression du compte. L'interface affiche déjà « un compte supprimé » (`moderation.unknownAuthor`). Même règle pour `reviewer_id`, `reports.reporter_id` et `reports.resolved_by`.
2. **Retrait en masse en ligne de commande** : `pnpm songs:remove --source <source> [--artist <uuid>] --reason "<motif>" [--dry-run] [--restore]`, comme `pnpm user:role` au plan 2 (pas de page d'administration). `--dry-run` compte sans rien changer. `--restore` annule un retrait en masse fait avec le même motif.
3. **Rétablir une chanson** se fait depuis la page du signalement qui a mené au retrait : c'est le seul écran qui mène à une chanson retirée. Les retraits en masse se rétablissent par `--restore`.
4. **Autocomplétion des artistes** par `GET /api/artistes?q=`, réservée aux personnes connectées. La maquette envoyait au navigateur tous les artistes du catalogue, ce que les milliers d'artistes de la base réelle interdisent.
5. **« Existe peut-être déjà »** : `searchSongs` sur chaque titre saisi, sans chercher dans les paroles (nouvelle option `inLyrics: false`), puis les chansons d'un artiste saisi en premier. La spec dit « sur le titre et l'artiste ». L'artiste sert ici au classement et non à la requête : une requête « titre + artiste » ne trouverait plus une chanson dont l'artiste est mal orthographié. Sans l'option, « الليل » ressort huit chansons de la base de développement, toutes par leurs paroles.
6. **Correction d'une chanson importée** : l'approbation pose `import_locked = true`, pour qu'un nouvel import LRCLIB ne l'écrase pas (plan 1). `source`, `source_ref` et `dedupe_key` ne changent pas.
7. **Ajout approuvé** : la révision garde un `song_id` nul (spec §5). Mes contributions n'a donc pas de lien vers la chanson créée ; on la retrouve par la recherche.
8. **Limites par jour** : fenêtre fixe du jour UTC (`hitRateLimit` avec 86 400 s), comme les autres limites du projet, et non 24 heures glissantes. La limite des signalements vaut pour tous, membres compris, par adresse IP.
9. **E-mail vérifié** : un compte créé par lien magique a une adresse vérifiée, et Better Auth vérifie l'adresse d'un compte existant à chaque connexion par lien. Un compte Google à l'adresse non vérifiée reçoit un message qui l'invite à se reconnecter par lien e-mail.
10. **Chanson retirée** : toujours une page 404 « introuvable ou retirée », et non 410 (écart 3 du plan 1, inchangé).

## Ce qui existe déjà (maquette fusionnée dans `main`)

Les écrans sont construits sur des données en mémoire. Ce plan ne les redessine pas : il les branche. Il n'ajoute qu'un bouton, « Rétablir la chanson ».

| Écran ou module | Fichiers | Données fictives remplacées |
|---|---|---|
| Proposer, corriger | `src/app/contribuer/**`, `src/components/contribute/**`, `src/app/actions/contribute.ts` | `proposalStore`, `knownArtists(SONGS)`, `findSimilarSongs` de `src/mocks/similar.ts` |
| Mes contributions | `src/app/mes-contributions/page.tsx`, `ProposalCard.tsx` | `proposalStore.listFor` |
| File des propositions, une proposition | `src/app/moderation/page.tsx`, `src/app/moderation/[revisionId]/page.tsx`, `src/components/moderation/**`, `reviewProposal` | `src/mocks/moderation.ts`, `moderationSeed.ts`, `songStore.publish` |
| Signaler | `src/app/signaler/[songId]/page.tsx`, `src/components/report/ReportForm.tsx`, `src/app/actions/report.ts` | `addReport` de `src/mocks/reports.ts` |
| File des signalements, un signalement | `src/app/moderation/signalements/**`, `handleReport` | `src/mocks/reports.ts`, `songStore.remove` |
| Moi | `src/app/moi/page.tsx` | `pendingContributionsOf` (`src/mocks/account.ts`), `moderationQueueSize` |
| Passerelle du catalogue | `src/lib/catalog/read.ts` | branche fictive (`getSong`, `getArtistPage`, `songExists` d'un identifiant non UUID) |

Règles pures déjà écrites et testées, gardées telles quelles sauf mention : `validateProposal`, `normalizeMultiline` (`lib/contribution/validate.ts`), `formValuesFromSong`, `isSameAsSong` (`correction.ts`), `suggestArtists`, `resolveArtists` (`artists.ts`), `changedFields`, `songFromProposal` (`lib/moderation/apply.ts`), `diffLines` et la suite (`diff.ts`), `checkReview`, `checkReportAction`, `statusAfter` (`review.ts`), `nextInQueue` (`queue.ts`), `validateReport` (`lib/report/validate.ts`).

`src/mocks/catalog.ts` garde `SONGS` : c'est le jeu de test que `pnpm seed:fixtures` écrit en base (plan 1). `src/mocks/search.ts` et `searchPreview.ts` restent aussi : ils servent les aperçus de développement de `/recherche`.

## Structure des fichiers

```text
src/types/report.ts                         REPORT_REASONS, REPORT_STATUSES, Report (signalement lu en base)
src/types/proposal.ts                       + Revision, RevisionSummary (proposition lue en base)
src/lib/db/schema.ts                        + song_revisions, reports et leurs enums
drizzle/0003_revisions_reports.sql          migration générée
src/lib/db/client.ts                        + Tx, Executor (la base ou une transaction)
src/lib/db/uuid.ts                          isUuid, déplacé de lib/catalog/queries (sans dépendance)
src/lib/auth/types.ts                       + CurrentUser.emailVerified
src/lib/auth/permissions.ts                 + canContribute, canApproveRevision
src/lib/moderation/limits.ts                allowRevision, allowReport (10 par jour)
src/lib/moderation/queries.ts               lectures : propositions, signalements, taille des files
src/lib/moderation/revisionWrite.ts         createRevision, approveRevision, rejectRevision
src/lib/moderation/reportWrite.ts           createReport, resolveReport, restoreSong
src/lib/moderation/bulk.ts                  parseBulkArgs, removeSongsInBulk, restoreSongsInBulk (sans server-only)
scripts/remove-songs.ts                     pnpm songs:remove
scripts/demo/demoRevisions.ts               propositions de démonstration (seed:demo)
scripts/demo/demoReports.ts                 signalements de démonstration (seed:demo)
src/lib/catalog/artistSuggestions.ts        artistCandidates, suggestArtistsFromDb
src/app/api/artistes/route.ts               GET /api/artistes?q= (autocomplétion)
src/lib/contribution/similarSongs.ts        findSimilarSongs (« existe peut-être déjà »)
src/components/contribute/useArtistSuggestions.ts
src/components/moderation/RestoreSongForm.tsx
tests/integration/factories.ts              + PAYLOAD, insertRevision, insertReport
```

Les fichiers de test sont donnés dans chaque tâche.

---

### Tâche 1 : schéma des propositions et des signalements

**Fichiers :**
- Créer : `src/types/report.ts`, `drizzle/0003_revisions_reports.sql` (généré)
- Modifier : `src/types/proposal.ts`, `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `src/mocks/reports.ts`, `tests/integration/helpers.ts`, `tests/integration/factories.ts`, `scripts/seed-fixtures.ts`
- Test : `tests/integration/revisionsSchema.test.ts`

**Interfaces :**
- Produit (types) : `REPORT_REASONS`, `ReportReason`, `REPORT_STATUSES`, `ReportStatus`, `Report` (`src/types/report.ts`) ; `Revision`, `RevisionSummary` (`src/types/proposal.ts`).
- Produit (schéma Drizzle) : `songRevisions`, `reports`, et les enums `revisionStatusEnum`, `reportReasonEnum`, `reportStatusEnum`.
- Produit : `type Tx` (une transaction ouverte par `db.transaction`) et `type Executor = Db | Tx` dans `src/lib/db/client.ts`.
- Produit (tests) : `PAYLOAD: ProposalPayload`, `insertRevision(input: { authorId: string | null; songId?: string | null; payload?: ProposalPayload; createdAt?: Date }): Promise<string>`, `insertReport(input: { songId: string; reason?: ReportReason; reporterId?: string | null; contactEmail?: string | null; details?: string; createdAt?: Date }): Promise<string>`.

- [ ] **Étape 1 : écrire les types.**

`src/types/report.ts` :

```ts
import type { Song } from "./catalog";

/**
 * Signalements (spec §5, table `reports`). Les listes de valeurs sont partagées avec les enums du schéma
 * (`src/lib/db/schema.ts`), pour qu'il n'y en ait qu'une.
 */
export const REPORT_REASONS = ["copyright", "wrong_lyrics", "duplicate", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** Signalement lu en base, avec la chanson visée (publiée ou retirée) et le nom des personnes. */
export interface Report {
  id: string;
  /** Auteur connecté ; `null` pour un visiteur, qui a laissé `contactEmail`, ou pour un compte supprimé depuis. */
  reporterId: string | null;
  reporterName: string | null;
  contactEmail: string | null;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedByName: string | null;
  /** ISO 8601. */
  createdAt: string;
  song: Pick<Song, "id" | "titleAr" | "titleLatin" | "artists"> & { published: boolean };
}
```

Dans `src/types/proposal.ts`, ajouter à la fin :

```ts
/**
 * Proposition lue en base (plan 3). L'auteur peut avoir supprimé son compte depuis : `authorId` et
 * `authorName` sont alors nuls (écart 1), et l'interface affiche « un compte supprimé ».
 */
export interface Revision extends Omit<Proposal, "authorId"> {
  authorId: string | null;
  authorName: string | null;
}

/**
 * Proposition dans une liste (Mes contributions, file de modération) : sans les paroles ni la
 * translittération, qui comptent jusqu'à 20 000 caractères chacune. `songPublished` : la chanson corrigée
 * est encore publiée (lien « Voir la chanson »).
 */
export interface RevisionSummary extends Omit<Revision, "payload"> {
  payload: Pick<ProposalPayload, "titleAr" | "titleLatin" | "artists">;
  songPublished: boolean;
}
```

`Proposal` reste : la maquette s'en sert jusqu'à la tâche 9, et `Revision` en dérive.

Dans `src/mocks/reports.ts`, remplacer la déclaration de `REPORT_REASONS`, `ReportReason` et `ReportStatus` par leur reprise depuis les types, pour qu'il n'y ait qu'une liste :

```ts
import { REPORT_REASONS, type ReportReason, type ReportStatus } from "@/types/report";

export { REPORT_REASONS };
export type { ReportReason, ReportStatus };
```

L'interface `Report` de la maquette, `NewReport` et le reste du fichier ne changent pas jusqu'à la tâche 9.

- [ ] **Étape 2 : écrire les tests du schéma, qui doivent échouer.**

Dans `tests/integration/factories.ts`, compléter les imports, puis ajouter à la fin :

```ts
import { reports, songRevisions } from "@/lib/db/schema";
import type { ProposalPayload } from "@/types/proposal";
import type { ReportReason } from "@/types/report";

/** Proposition d'ajout minimale : un artiste connu des données de test (Hedi Jouini), deux vers. */
export const PAYLOAD: ProposalPayload = {
  titleAr: "لاموني اللي غاروا مني",
  titleLatin: "Lamouni Elli Gharou Menni",
  artists: [{ id: null, nameAr: null, nameLatin: "Hedi Jouini" }],
  lyrics: "قالوا عليّ كلام كثير\nوأنا نغنّي ونسامح",
  lyricsTranslit: null,
  dialect: "tn",
};

/** Proposition en attente : un ajout, ou une correction si `songId` est donné. */
export async function insertRevision(input: {
  authorId: string | null;
  songId?: string | null;
  payload?: ProposalPayload;
  createdAt?: Date;
}): Promise<string> {
  const [row] = await db
    .insert(songRevisions)
    .values({
      authorId: input.authorId,
      songId: input.songId ?? null,
      payload: input.payload ?? PAYLOAD,
      rightsDeclared: true,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    })
    .returning({ id: songRevisions.id });
  return row.id;
}

/** Signalement ouvert ; sans auteur, celui d'un visiteur qui a laissé son adresse. */
export async function insertReport(input: {
  songId: string;
  reason?: ReportReason;
  reporterId?: string | null;
  contactEmail?: string | null;
  details?: string;
  createdAt?: Date;
}): Promise<string> {
  const [row] = await db
    .insert(reports)
    .values({
      songId: input.songId,
      reason: input.reason ?? "wrong_lyrics",
      reporterId: input.reporterId ?? null,
      contactEmail: input.contactEmail ?? (input.reporterId ? null : "visiteur@example.com"),
      details: input.details ?? "Deux vers sont inversés.",
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    })
    .returning({ id: reports.id });
  return row.id;
}
```

`tests/integration/revisionsSchema.test.ts` :

```ts
// Plan 3, tâche 1 : contraintes des tables song_revisions et reports (spec §5, §8.3, écart 1).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { reports, songRevisions, users } from "@/lib/db/schema";
import { insertReport, insertRevision, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

/** Code PostgreSQL de l'erreur levée (Drizzle le range dans `cause`), ou `null` si tout passe. */
async function pgError(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (error) {
    const code = (value: unknown) => (value as { code?: string } | undefined)?.code;
    return code((error as { cause?: unknown }).cause) ?? code(error) ?? "inconnue";
  }
}

const UNIQUE = "23505";
const CHECK = "23514";

describe("schéma des propositions et des signalements", () => {
  beforeEach(resetDb);

  it("une seule correction en attente par auteur et par chanson ; les ajouts ne sont pas limités", async () => {
    const leila = await insertUser();
    const sami = await insertUser();
    const song = await insertSong("Ya Lella");
    const first = await insertRevision({ authorId: leila.id, songId: song });
    expect(await pgError(() => insertRevision({ authorId: leila.id, songId: song }))).toBe(UNIQUE);
    expect(await pgError(() => insertRevision({ authorId: sami.id, songId: song }))).toBeNull();
    expect(await pgError(() => insertRevision({ authorId: leila.id }))).toBeNull();
    expect(await pgError(() => insertRevision({ authorId: leila.id }))).toBeNull();

    await db.update(songRevisions).set({ status: "approved", reviewedAt: new Date() }).where(eq(songRevisions.id, first));
    expect(await pgError(() => insertRevision({ authorId: leila.id, songId: song }))).toBeNull();
  });

  it("une proposition relue porte sa date, un rejet porte sa note", async () => {
    const leila = await insertUser();
    const id = await insertRevision({ authorId: leila.id });
    const set = (values: Partial<typeof songRevisions.$inferInsert>) =>
      pgError(() => db.update(songRevisions).set(values).where(eq(songRevisions.id, id)));
    expect(await set({ status: "approved" })).toBe(CHECK);
    expect(await set({ reviewedAt: new Date() })).toBe(CHECK);
    expect(await set({ status: "rejected", reviewedAt: new Date() })).toBe(CHECK);
    expect(await set({ status: "rejected", reviewedAt: new Date(), reviewNote: "Déjà dans Ghnaya." })).toBeNull();
  });

  it("un signalement traité porte sa note", async () => {
    const id = await insertReport({ songId: await insertSong("Ya Lili") });
    const set = (values: Partial<typeof reports.$inferInsert>) =>
      pgError(() => db.update(reports).set(values).where(eq(reports.id, id)));
    expect(await set({ status: "dismissed" })).toBe(CHECK);
    expect(await set({ status: "dismissed", resolutionNote: "Sans rapport avec la chanson." })).toBeNull();
  });

  it("supprimer un compte garde ses propositions et ses signalements, sans auteur (écart 1)", async () => {
    const leila = await insertUser();
    const song = await insertSong("Sidi Mansour");
    const revision = await insertRevision({ authorId: leila.id, songId: song });
    const report = await insertReport({ songId: song, reporterId: leila.id });
    await db.delete(users).where(eq(users.id, leila.id));
    const [r] = await db.select().from(songRevisions).where(eq(songRevisions.id, revision));
    const [s] = await db.select().from(reports).where(eq(reports.id, report));
    expect(r.authorId).toBeNull();
    expect(s.reporterId).toBeNull();
  });
});
```

- [ ] **Étape 3 : lancer les tests et constater l'échec.** Lancer `pnpm exec vitest run --project integration tests/integration/revisionsSchema.test.ts`. Attendu : FAIL, `songRevisions` et `reports` introuvables dans le schéma.

- [ ] **Étape 4 : écrire le schéma.** Dans `src/lib/db/schema.ts`, ajouter `jsonb` à l'import de `drizzle-orm/pg-core`, puis les imports des listes (chemins relatifs, comme pour `../../types/catalog` : drizzle-kit ne résout pas l'alias `@/`) :

```ts
import { PROPOSAL_STATUSES, type ProposalPayload } from "../../types/proposal";
import { REPORT_REASONS, REPORT_STATUSES } from "../../types/report";
```

Ajouter à la fin du fichier :

```ts
// Plan 3, tâche 1 : propositions (révisions) et signalements (spec §5, §8, §9).
export const revisionStatusEnum = pgEnum("revision_status", PROPOSAL_STATUSES);
export const reportReasonEnum = pgEnum("report_reason", REPORT_REASONS);
export const reportStatusEnum = pgEnum("report_status", REPORT_STATUSES);

export const songRevisions = pgTable(
  "song_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nul pour un ajout. Pas de cascade : une chanson n'est jamais supprimée, seulement retirée.
    songId: uuid("song_id").references(() => songs.id),
    // Nul une fois le compte supprimé : la proposition reste, anonymisée (écart 1).
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    // Version complète proposée (titres, artistes, paroles, translittération, dialecte).
    payload: jsonb("payload").$type<ProposalPayload>().notNull(),
    rightsDeclared: boolean("rights_declared").notNull(),
    status: revisionStatusEnum("status").notNull().default("pending"),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    // Une seule révision en attente par auteur et par chanson (spec §8.3). Un ajout (`song_id` nul) et un
    // auteur supprimé (`author_id` nul) n'y sont pas soumis : deux valeurs nulles ne sont jamais égales.
    uniqueIndex("song_revisions_pending_uq").on(t.authorId, t.songId).where(sql`status = 'pending'`),
    index("song_revisions_queue_idx").on(t.status, t.createdAt),
    index("song_revisions_author_idx").on(t.authorId),
    check("song_revisions_rights_ck", sql`${t.rightsDeclared} = true`),
    check("song_revisions_reviewed_ck", sql`(${t.status} = 'pending') = (${t.reviewedAt} IS NULL)`),
    check("song_revisions_reject_note_ck", sql`${t.status} <> 'rejected' OR ${t.reviewNote} IS NOT NULL`),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id),
    // Nul pour un visiteur (qui laisse `contact_email`), ou une fois le compte supprimé (écart 1).
    reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
    contactEmail: text("contact_email"),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details").notNull(),
    status: reportStatusEnum("status").notNull().default("open"),
    resolutionNote: text("resolution_note"),
    resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    index("reports_queue_idx").on(t.status, t.createdAt),
    index("reports_song_idx").on(t.songId),
    // Un signalement traité ou classé porte toujours sa note (spec §9) ; un signalement ouvert n'en a pas.
    check("reports_resolution_ck", sql`(${t.status} = 'open') = (${t.resolutionNote} IS NULL)`),
  ],
);
```

Dans `src/lib/db/client.ts`, ajouter à la fin :

```ts
/** Transaction ouverte par `db.transaction`. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
/** La base, ou une transaction en cours : pour les écritures qui servent seules ou dans une transaction. */
export type Executor = Db | Tx;
```

- [ ] **Étape 5 : générer la migration et mettre à jour la remise à zéro.** Lancer `pnpm db:generate --name revisions_reports`. Relire `drizzle/0003_revisions_reports.sql` : on y attend les trois enums, les deux tables, l'index unique partiel `song_revisions_pending_uq` avec sa clause `WHERE`, les quatre contraintes `CHECK`, et les clés étrangères vers `users` en `ON DELETE set null`. Ne pas éditer le fichier à la main.

Dans `tests/integration/helpers.ts` et `scripts/seed-fixtures.ts`, ajouter `reports, song_revisions` en tête de la liste du `TRUNCATE` :

```ts
await db.execute(sql`TRUNCATE reports, song_revisions, playlist_items, playlists, club_members, clubs, verifications,
  accounts, sessions, users, song_artists, songs, artists, rate_limits CASCADE`);
```

- [ ] **Étape 6 : appliquer la migration et relancer les tests.** Lancer `pnpm db:migrate` (base de développement ; les tests d'intégration migrent leur propre base), puis `pnpm test:integration` et `pnpm typecheck`. Attendu : PASS, y compris les tests des plans 1 et 2.

- [ ] **Étape 7 : commit.**

```bash
git add src/types src/lib/db src/mocks/reports.ts drizzle tests/integration scripts/seed-fixtures.ts
git commit -m "feat(db): song revisions and reports schema"
```

---

### Tâche 2 : propositions en base (lectures, envoi, rejet, droits)

**Fichiers :**
- Créer : `src/lib/moderation/limits.ts`, `src/lib/moderation/queries.ts`, `src/lib/moderation/revisionWrite.ts`
- Modifier : `src/lib/auth/types.ts`, `src/lib/auth/permissions.ts`, `src/lib/moderation/review.ts`, `src/lib/moderation/queue.ts`, `src/app/actions/moderation.ts` (une ligne), `src/lib/account/write.ts` (commentaire)
- Test : `tests/integration/revisions.test.ts` ; modifier `tests/unit/auth/support.ts`, `tests/unit/auth/currentUser.test.ts`, `tests/unit/auth/permissions.test.ts`, `tests/unit/moderation/review.test.ts`, `tests/unit/moderation/queue.test.ts`

**Interfaces :**
- Consomme : `songRevisions`, `reports`, `Revision`, `RevisionSummary` (tâche 1) ; `hitRateLimit` (plan 1) ; `isUniqueViolation` (plan 2).
- Produit : `CurrentUser.emailVerified: boolean` ; `canContribute(user: CurrentUser | null): boolean` ; `canApproveRevision(user: CurrentUser | null, revision: { authorId: string | null }): boolean`.
- Produit : `REVISION_LIMIT`, `REPORT_LIMIT` (`{ limit: 10, windowSeconds: 86400 }`), `allowRevision(userId: string): Promise<boolean>`, `allowReport(ip: string): Promise<boolean>`.
- Produit (`queries.ts`) : `revisionsOf(authorId): Promise<RevisionSummary[]>`, `pendingRevisions(): Promise<RevisionSummary[]>`, `getRevision(id): Promise<Revision | null>`, `hasPendingRevision(authorId, songId): Promise<boolean>`, `pendingRevisionCountOf(authorId): Promise<number>`, `moderationCounts(): Promise<{ proposals: number; reports: number }>`.
- Produit (`revisionWrite.ts`) : `createRevision(db, { authorId, songId, payload }): Promise<CreateRevisionResult>` avec `type CreateRevisionResult = { ok: true; id: string } | { ok: false; error: "pendingExists" }` ; `type DecisionError = "notFound" | "notPending" | "songGone"` ; `rejectRevision(db, { revisionId, reviewerId, note }): Promise<{ ok: true } | { ok: false; error: "notFound" | "notPending" }>`.
- Produit : `checkReview({ proposal: { status }, mayApprove, decision, note })` remplace le paramètre `reviewerId` par `mayApprove: boolean` ; `countByStatus` passe dans `lib/moderation/queue.ts` ; `compareProposals`, `compareReports`, `proposalQueue`, `reportQueue` acceptent tout objet qui a les champs utiles.

- [ ] **Étape 1 : écrire les tests unitaires, qui doivent échouer.**

`tests/unit/auth/support.ts` : l'utilisateur de test a une adresse vérifiée par défaut.

```ts
import { toCurrentUser, type ClubMembershipRef, type GlobalRole } from "@/lib/auth/types";

/** Utilisateur courant de test : membre sans club, à l'adresse vérifiée, par défaut. */
export const userWith = (
  over: { globalRole?: GlobalRole; isAnimator?: boolean; emailVerified?: boolean; clubs?: ClubMembershipRef[] } = {},
) =>
  toCurrentUser(
    {
      id: "u1",
      name: "Test",
      email: "t@example.com",
      emailVerified: over.emailVerified ?? true,
      globalRole: over.globalRole,
      isAnimator: over.isAnimator,
    },
    over.clubs ?? [],
  );
```

`tests/unit/auth/currentUser.test.ts` : dans le premier test, ajouter `emailVerified: false,` à l'objet attendu (après `locale`). Ajouter :

```ts
  it("reprend l'adresse vérifiée, et seulement la valeur vraie", () => {
    expect(toCurrentUser({ ...base, emailVerified: true }, []).emailVerified).toBe(true);
    expect(toCurrentUser({ ...base, emailVerified: "oui" }, []).emailVerified).toBe(false);
  });
```

`tests/unit/auth/permissions.test.ts` : ajouter `canApproveRevision` et `canContribute` à l'import de `@/lib/auth/permissions`, puis :

```ts
describe("propositions et modération", () => {
  it("proposer exige une adresse vérifiée (spec §8.7)", () => {
    expect(canContribute(null)).toBe(false);
    expect(canContribute(userWith())).toBe(true);
    expect(canContribute(userWith({ emailVerified: false }))).toBe(false);
  });

  it("un modérateur n'approuve pas sa propre proposition ; un admin si (spec §4.3)", () => {
    const own = { authorId: "u1" };
    const other = { authorId: "u2" };
    const deleted = { authorId: null };
    expect(canApproveRevision(null, other)).toBe(false);
    expect(canApproveRevision(userWith(), other)).toBe(false);
    expect(canApproveRevision(userWith({ globalRole: "moderator" }), other)).toBe(true);
    expect(canApproveRevision(userWith({ globalRole: "moderator" }), own)).toBe(false);
    expect(canApproveRevision(userWith({ globalRole: "moderator" }), deleted)).toBe(true);
    expect(canApproveRevision(userWith({ globalRole: "admin" }), own)).toBe(true);
  });
});
```

`tests/unit/moderation/review.test.ts` : la règle « sa propre proposition » vient désormais de `canApproveRevision`. Dans chaque appel de `checkReview`, remplacer `reviewerId: "u-rania"` par `mayApprove: true`. Dans le test « refuse qu'un modérateur approuve sa propre proposition », l'appel devient :

```ts
    expect(checkReview({ proposal: pending, mayApprove: false, decision: "approve", note: "" })).toEqual({
      ok: false,
      error: "ownProposal",
    });
```

Et ajouter, dans le même `describe` :

```ts
  it("refuser reste permis à qui ne peut pas approuver", () => {
    expect(checkReview({ proposal: pending, mayApprove: false, decision: "reject", note: "Doublon." })).toEqual({
      ok: true,
      note: "Doublon.",
    });
  });
```

`tests/unit/moderation/queue.test.ts` : les fonctions n'exigent plus un `Proposal` ni un `Report` complets. Remplacer les imports de types et les deux fabriques par :

```ts
import { compareProposals, compareReports, countByStatus, nextInQueue, proposalQueue, reportQueue } from "@/lib/moderation/queue";
import type { ProposalStatus } from "@/types/proposal";
import type { ReportReason, ReportStatus } from "@/types/report";

const proposal = (id: string, createdAt: string, status: ProposalStatus = "pending") => ({ id, createdAt, status });

const report = (id: string, reason: ReportReason, createdAt: string, status: ReportStatus = "open") => ({
  id,
  reason,
  createdAt,
  status,
});
```

Puis ajouter le test repris de `tests/unit/contribution/store.test.ts` (que la tâche 9 supprime) :

```ts
describe("countByStatus", () => {
  it("compte les propositions de chaque statut, et toutes", () => {
    const list = [proposal("a", "2026-11-01"), proposal("b", "2026-11-02", "approved"), proposal("c", "2026-11-03", "rejected")];
    expect(countByStatus(list)).toEqual({ all: 3, pending: 1, approved: 1, rejected: 1 });
  });
});
```

- [ ] **Étape 2 : écrire les tests d'intégration, qui doivent échouer.**

`tests/integration/revisions.test.ts` :

```ts
// Plan 3, tâche 2 : propositions en base (spec §8.3, §8.4, §8.6, §8.7, §12).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteUserAccount } from "@/lib/account/write";
import { db } from "@/lib/db/client";
import { songRevisions } from "@/lib/db/schema";
import { allowRevision, REVISION_LIMIT } from "@/lib/moderation/limits";
import {
  getRevision,
  hasPendingRevision,
  moderationCounts,
  pendingRevisionCountOf,
  pendingRevisions,
  revisionsOf,
} from "@/lib/moderation/queries";
import { createRevision, rejectRevision } from "@/lib/moderation/revisionWrite";
import { insertReport, insertRevision, insertSong, insertUser, PAYLOAD } from "./factories";
import { resetDb } from "./helpers";

const UNKNOWN = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";
const at = (iso: string) => new Date(iso);

describe("propositions en base", () => {
  beforeEach(resetDb);

  it("enregistre une proposition en attente, que Mes contributions liste de la plus récente à la plus ancienne", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = await insertSong("Ya Lella");
    const old = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-01T10:00:00Z") });
    const created = await createRevision(db, { authorId: leila.id, songId: song, payload: PAYLOAD });
    if (!created.ok) throw new Error("proposition refusée");

    const list = await revisionsOf(leila.id);
    expect(list.map((r) => r.id)).toEqual([created.id, old]);
    expect(list[0]).toMatchObject({
      songId: song,
      authorId: leila.id,
      authorName: "Leïla",
      status: "pending",
      reviewNote: null,
      reviewedAt: null,
      payload: { titleAr: PAYLOAD.titleAr, titleLatin: PAYLOAD.titleLatin, artists: PAYLOAD.artists },
      songPublished: true,
    });
    expect(list[1].songPublished).toBe(false);
    expect(await getRevision(created.id)).toMatchObject({ payload: PAYLOAD, rightsDeclared: true });
    expect(await getRevision("pas-un-uuid")).toBeNull();
    expect(await getRevision(UNKNOWN)).toBeNull();
  });

  it("refuse une seconde correction en attente de la même chanson (spec §8.3)", async () => {
    const leila = await insertUser();
    const song = await insertSong("Sidi Mansour");
    expect((await createRevision(db, { authorId: leila.id, songId: song, payload: PAYLOAD })).ok).toBe(true);
    expect(await hasPendingRevision(leila.id, song)).toBe(true);
    expect(await createRevision(db, { authorId: leila.id, songId: song, payload: PAYLOAD })).toEqual({
      ok: false,
      error: "pendingExists",
    });
  });

  it("file de modération : les propositions en attente, de la plus ancienne à la plus récente (spec §8.4)", async () => {
    const [leila, sami] = [await insertUser(), await insertUser()];
    const second = await insertRevision({ authorId: sami.id, createdAt: at("2026-11-12T10:00:00Z") });
    const first = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-10T10:00:00Z") });
    const done = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-01T10:00:00Z") });
    await db
      .update(songRevisions)
      .set({ status: "rejected", reviewedAt: new Date(), reviewNote: "Doublon." })
      .where(eq(songRevisions.id, done));
    expect((await pendingRevisions()).map((r) => r.id)).toEqual([first, second]);
  });

  it("rejette une proposition en attente avec la note du modérateur, une seule fois", async () => {
    const [leila, rania] = [await insertUser(), await insertUser({ globalRole: "moderator" })];
    const id = await insertRevision({ authorId: leila.id });
    expect(await rejectRevision(db, { revisionId: id, reviewerId: rania.id, note: "Déjà dans Ghnaya." })).toEqual({ ok: true });
    const rejected = await getRevision(id);
    expect(rejected).toMatchObject({ status: "rejected", reviewNote: "Déjà dans Ghnaya." });
    expect(rejected?.reviewedAt).not.toBeNull();
    expect(await rejectRevision(db, { revisionId: id, reviewerId: rania.id, note: "Encore." })).toEqual({
      ok: false,
      error: "notPending",
    });
    expect(await rejectRevision(db, { revisionId: UNKNOWN, reviewerId: rania.id, note: "x" })).toEqual({
      ok: false,
      error: "notFound",
    });
  });

  it("compte les propositions en attente d'un auteur, et la taille des deux files", async () => {
    const leila = await insertUser();
    const song = await insertSong("Ya Lili");
    await insertRevision({ authorId: leila.id });
    await insertRevision({ authorId: leila.id, songId: song });
    await insertReport({ songId: song });
    expect(await pendingRevisionCountOf(leila.id)).toBe(2);
    expect(await moderationCounts()).toEqual({ proposals: 2, reports: 1 });
  });

  it("garde les propositions d'un compte supprimé, sans auteur (spec §12, écart 1)", async () => {
    const leila = await insertUser();
    const id = await insertRevision({ authorId: leila.id });
    expect(await deleteUserAccount(db, leila.id)).toEqual({ ok: true });
    expect(await getRevision(id)).toMatchObject({ authorId: null, authorName: null, status: "pending" });
  });

  it(`limite à ${REVISION_LIMIT.limit} propositions par jour et par personne (spec §8.7)`, async () => {
    const leila = await insertUser();
    for (let i = 0; i < REVISION_LIMIT.limit; i += 1) expect(await allowRevision(leila.id)).toBe(true);
    expect(await allowRevision(leila.id)).toBe(false);
    expect(await allowRevision((await insertUser()).id)).toBe(true);
  });
});
```

- [ ] **Étape 3 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/auth tests/unit/moderation` puis `pnpm exec vitest run --project integration tests/integration/revisions.test.ts`. Attendu : FAIL, fonctions et modules introuvables.

- [ ] **Étape 4 : l'adresse vérifiée et les droits.**

`src/lib/auth/types.ts` :
- dans `CurrentUser`, après `locale` :

```ts
  /** Adresse vérifiée (lien magique, ou Google qui l'atteste) : exigée pour proposer (spec §8.7). */
  emailVerified: boolean;
```

- dans `SessionUserFields`, ajouter `emailVerified?: unknown;` ;
- dans `toCurrentUser`, après `locale` : `emailVerified: user.emailVerified === true,`.

`getCurrentUser` passe déjà `session.user`, qui porte `emailVerified` (champ de Better Auth).

Dans `src/lib/auth/permissions.ts`, ajouter :

```ts
/** Proposer un ajout ou une correction : un membre à l'adresse vérifiée (spec §8.7). */
export const canContribute = (user: CurrentUser | null): boolean => user?.emailVerified ?? false;

/**
 * Approuver une proposition : un modérateur, sauf la sienne ; un admin approuve aussi les siennes, pour
 * amorcer la plateforme (spec §4.3). Une proposition d'un compte supprimé (`authorId` nul) n'est à personne.
 * Rejeter reste permis à tout modérateur (`canModerate`).
 */
export function canApproveRevision(user: CurrentUser | null, revision: { authorId: string | null }): boolean {
  if (!user?.isModerator) return false;
  return revision.authorId !== user.id || user.globalRole === "admin";
}
```

- [ ] **Étape 5 : les règles de décision et les files.**

`src/lib/moderation/review.ts` :
- remplacer `import type { ReportStatus } from "@/mocks/reports";` par `import type { ReportStatus } from "@/types/report";` ;
- remplacer `checkReview` par :

```ts
/**
 * Approuver ou rejeter une proposition en attente. Le rejet exige une note, que l'auteur verra dans
 * Mes contributions. `mayApprove` vient de `canApproveRevision` : un modérateur n'approuve pas sa propre
 * proposition, sauf un admin.
 */
export function checkReview(input: {
  proposal: { status: ProposalStatus };
  mayApprove: boolean;
  decision: Decision;
  note: unknown;
}): Checked<ReviewError> {
  const { proposal, mayApprove, decision, note } = input;
  if (proposal.status !== "pending") return { ok: false, error: "notPending" };
  if (decision === "approve" && !mayApprove) return { ok: false, error: "ownProposal" };
  return checkNote(note, decision === "reject");
}
```

Dans `src/app/actions/moderation.ts` (maquette jusqu'à la tâche 7), l'appel devient `checkReview({ proposal, mayApprove: canApproveRevision(user, proposal), decision, note: formData.get("note") })`, avec `import { canApproveRevision } from "@/lib/auth/permissions";`.

`src/lib/moderation/queue.ts` : remplacer tout le haut du fichier, jusqu'à `nextInQueue` exclu, par :

```ts
import type { ProposalStatus } from "@/types/proposal";
import type { ReportReason, ReportStatus } from "@/types/report";

/**
 * Ordre des deux files de la modération (IA, « Croissance du contenu ») :
 *  - propositions : de la plus ancienne à la plus récente ;
 *  - signalements : droits d'auteur en tête, puis les autres par ancienneté.
 * L'identifiant départage deux éléments du même instant, pour un ordre stable. Les requêtes en base
 * trient dans le même ordre ; ces fonctions servent à `nextInQueue` et aux listes en mémoire.
 */

type Queued = { id: string; createdAt: string };
type QueuedReport = Queued & { reason: ReportReason };

const byAge = (a: Queued, b: Queued) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export const compareProposals = (a: Queued, b: Queued): number => byAge(a, b);

export const compareReports = (a: QueuedReport, b: QueuedReport): number =>
  Number(b.reason === "copyright") - Number(a.reason === "copyright") || byAge(a, b);

export const proposalQueue = <T extends Queued & { status: ProposalStatus }>(proposals: readonly T[]): T[] =>
  proposals.filter((p) => p.status === "pending").sort(compareProposals);

export const reportQueue = <T extends QueuedReport & { status: ReportStatus }>(reports: readonly T[]): T[] =>
  reports.filter((r) => r.status === "open").sort(compareReports);

/** Nombre de propositions de chaque statut, et en tout : les filtres de Mes contributions. */
export function countByStatus(proposals: readonly { status: ProposalStatus }[]): Record<"all" | ProposalStatus, number> {
  const count = (status: ProposalStatus) => proposals.filter((p) => p.status === status).length;
  return { all: proposals.length, pending: count("pending"), approved: count("approved"), rejected: count("rejected") };
}
```

`nextInQueue` ne change pas.

- [ ] **Étape 6 : les limites du jour.**

`src/lib/moderation/limits.ts` :

```ts
import "server-only";
import { hitRateLimit } from "@/lib/ratelimit/fixedWindow";

const DAY_SECONDS = 24 * 60 * 60;

/** Spec §8.7 et §12 : 10 propositions par jour et par utilisateur, 10 signalements par jour et par IP (écart 8). */
export const REVISION_LIMIT = { limit: 10, windowSeconds: DAY_SECONDS } as const;
export const REPORT_LIMIT = { limit: 10, windowSeconds: DAY_SECONDS } as const;

/** Compte une proposition de plus pour l'utilisateur ; `false` au-delà de la limite du jour. */
export async function allowRevision(userId: string): Promise<boolean> {
  const { allowed } = await hitRateLimit(`revision:${userId}`, REVISION_LIMIT.limit, REVISION_LIMIT.windowSeconds);
  return allowed;
}

/** Compte un signalement de plus depuis cette adresse IP ; `false` au-delà de la limite du jour. */
export async function allowReport(ip: string): Promise<boolean> {
  const { allowed } = await hitRateLimit(`report:${ip}`, REPORT_LIMIT.limit, REPORT_LIMIT.windowSeconds);
  return allowed;
}
```

- [ ] **Étape 7 : les lectures.**

`src/lib/moderation/queries.ts` :

```ts
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { isUuid } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import type { ProposalPayload, ProposalStatus, Revision, RevisionSummary } from "@/types/proposal";

/**
 * Lectures de la modération (spec §8, §9) : Mes contributions, la file des propositions, une proposition,
 * et la taille des files. Les listes ne lisent pas les paroles.
 */

const iso = (value: Date | string): string => new Date(value).toISOString();
const isoOrNull = (value: Date | string | null): string | null => (value === null ? null : iso(value));

type SummaryRow = {
  id: string;
  song_id: string | null;
  author_id: string | null;
  author_name: string | null;
  title_ar: string | null;
  title_latin: string | null;
  artists: ProposalPayload["artists"];
  status: ProposalStatus;
  review_note: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  song_published: boolean;
};

const toSummary = (r: SummaryRow): RevisionSummary => ({
  id: r.id,
  songId: r.song_id,
  authorId: r.author_id,
  authorName: r.author_name,
  payload: { titleAr: r.title_ar, titleLatin: r.title_latin, artists: r.artists },
  rightsDeclared: true,
  status: r.status,
  reviewNote: r.review_note,
  createdAt: iso(r.created_at),
  reviewedAt: isoOrNull(r.reviewed_at),
  songPublished: r.song_published,
});

async function summariesWhere(where: SQL, order: SQL): Promise<RevisionSummary[]> {
  const res = await db.execute<SummaryRow>(sql`
    SELECT r.id, r.song_id, r.author_id, u.name AS author_name,
      r.payload->>'titleAr' AS title_ar, r.payload->>'titleLatin' AS title_latin, r.payload->'artists' AS artists,
      r.status, r.review_note, r.created_at, r.reviewed_at,
      COALESCE(s.status = 'published', false) AS song_published
    FROM song_revisions r
    LEFT JOIN users u ON u.id = r.author_id
    LEFT JOIN songs s ON s.id = r.song_id
    WHERE ${where}
    ORDER BY ${order}`);
  return res.rows.map(toSummary);
}

/** Mes contributions : les propositions de l'auteur, de la plus récente à la plus ancienne. */
export const revisionsOf = (authorId: string): Promise<RevisionSummary[]> =>
  summariesWhere(sql`r.author_id = ${authorId}`, sql`r.created_at DESC, r.id`);

/** File de modération : les propositions en attente, de la plus ancienne à la plus récente (spec §8.4). */
export const pendingRevisions = (): Promise<RevisionSummary[]> =>
  summariesWhere(sql`r.status = 'pending'`, sql`r.created_at ASC, r.id`);

/** Une proposition, avec sa version complète. `null` si l'identifiant est invalide ou inconnu. */
export async function getRevision(id: string): Promise<Revision | null> {
  if (!isUuid(id)) return null;
  const res = await db.execute<{
    id: string;
    song_id: string | null;
    author_id: string | null;
    author_name: string | null;
    payload: ProposalPayload;
    status: ProposalStatus;
    review_note: string | null;
    created_at: Date | string;
    reviewed_at: Date | string | null;
  }>(sql`
    SELECT r.id, r.song_id, r.author_id, u.name AS author_name, r.payload, r.status, r.review_note,
      r.created_at, r.reviewed_at
    FROM song_revisions r LEFT JOIN users u ON u.id = r.author_id
    WHERE r.id = ${id}`);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id,
    songId: r.song_id,
    authorId: r.author_id,
    authorName: r.author_name,
    payload: r.payload,
    rightsDeclared: true,
    status: r.status,
    reviewNote: r.review_note,
    createdAt: iso(r.created_at),
    reviewedAt: isoOrNull(r.reviewed_at),
  };
}

/** L'auteur a déjà une correction de cette chanson en attente (spec §8.3 : une seule à la fois). */
export async function hasPendingRevision(authorId: string, songId: string): Promise<boolean> {
  const res = await db.execute(sql`
    SELECT 1 FROM song_revisions WHERE author_id = ${authorId} AND song_id = ${songId} AND status = 'pending'`);
  return res.rows.length > 0;
}

/** Propositions en attente de l'auteur : la pastille de Mes contributions sur la page Moi. */
export async function pendingRevisionCountOf(authorId: string): Promise<number> {
  const res = await db.execute<{ n: string }>(sql`
    SELECT count(*) AS n FROM song_revisions WHERE author_id = ${authorId} AND status = 'pending'`);
  return Number(res.rows[0].n);
}

/** Taille des deux files : sous-onglets de la modération et pastille « N à relire » de la page Moi. */
export async function moderationCounts(): Promise<{ proposals: number; reports: number }> {
  const res = await db.execute<{ proposals: string; reports: string }>(sql`
    SELECT (SELECT count(*) FROM song_revisions WHERE status = 'pending') AS proposals,
      (SELECT count(*) FROM reports WHERE status = 'open') AS reports`);
  return { proposals: Number(res.rows[0].proposals), reports: Number(res.rows[0].reports) };
}
```

`isUuid` est encore exporté par `lib/catalog/queries` ; la tâche 8 le déplace dans `lib/db/uuid.ts` en gardant cet export.

- [ ] **Étape 8 : l'envoi et le rejet.**

`src/lib/moderation/revisionWrite.ts` :

```ts
import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/errors";
import { songRevisions } from "@/lib/db/schema";
import type { ProposalPayload } from "@/types/proposal";

/**
 * Écritures des propositions (spec §8). L'appelant (Server Action) a vérifié la session, le droit
 * (`canContribute`, `canApproveRevision`), la limite du jour et le formulaire (`validateProposal`).
 */

export type CreateRevisionResult = { ok: true; id: string } | { ok: false; error: "pendingExists" };

/**
 * Enregistre une proposition en attente (spec §8.3). Une seconde correction en attente de la même chanson
 * par le même auteur est refusée par l'index unique `song_revisions_pending_uq`, même si deux envois se croisent.
 */
export async function createRevision(
  db: Db,
  input: { authorId: string; songId: string | null; payload: ProposalPayload },
): Promise<CreateRevisionResult> {
  try {
    const [row] = await db
      .insert(songRevisions)
      .values({ authorId: input.authorId, songId: input.songId, payload: input.payload, rightsDeclared: true })
      .returning({ id: songRevisions.id });
    return { ok: true, id: row.id };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "pendingExists" };
    throw error;
  }
}

/** Raisons d'une décision refusée : proposition inconnue, déjà relue, ou chanson retirée entre-temps. */
export type DecisionError = "notFound" | "notPending" | "songGone";

/** Rejette une proposition en attente, avec la note que l'auteur lira dans Mes contributions (spec §8.4). */
export async function rejectRevision(
  db: Db,
  input: { revisionId: string; reviewerId: string; note: string },
): Promise<{ ok: true } | { ok: false; error: Exclude<DecisionError, "songGone"> }> {
  const res = await db.execute(sql`
    UPDATE song_revisions
    SET status = 'rejected', reviewer_id = ${input.reviewerId}, review_note = ${input.note},
      reviewed_at = now(), updated_at = now()
    WHERE id = ${input.revisionId} AND status = 'pending'
    RETURNING id`);
  if (res.rows.length > 0) return { ok: true };
  const found = await db.execute(sql`SELECT 1 FROM song_revisions WHERE id = ${input.revisionId}`);
  return { ok: false, error: found.rows.length > 0 ? "notPending" : "notFound" };
}
```

L'appelant passe un identifiant lu par `getRevision`, donc un UUID valide.

- [ ] **Étape 9 : le commentaire de la suppression de compte.** Dans `src/lib/account/write.ts`, la dernière phrase du commentaire de `deleteUserAccount` (« Plan 3 : rattacher ses révisions au compte « compte supprimé » dans la même transaction. ») devient : « Ses propositions et ses signalements restent, sans auteur : `ON DELETE SET NULL` les anonymise dans la même transaction (plan 3, écart 1). »

- [ ] **Étape 10 : relancer les tests.** Lancer `pnpm test`, `pnpm exec vitest run --project integration tests/integration/revisions.test.ts` et `pnpm typecheck`. Attendu : PASS. `pnpm typecheck` passe aussi sur la maquette : `mocks/moderation.ts` appelle `proposalQueue` et `reportQueue` avec ses propres types, qui ont les champs utiles.

- [ ] **Étape 11 : commit.**

```bash
git add src/lib/auth src/lib/moderation src/lib/account/write.ts src/app/actions/moderation.ts tests/unit tests/integration/revisions.test.ts
git commit -m "feat(moderation): revisions in the database, approval rights and daily limits"
```

---

### Tâche 3 : approuver une proposition, en une transaction

**Fichiers :**
- Modifier : `src/lib/moderation/revisionWrite.ts`, `src/lib/catalog/queries.ts` (exporter `ARTISTS_OF`), `src/lib/catalog/artists.ts` (`upsertArtist` accepte une transaction)
- Test : `tests/integration/approve.test.ts`

**Interfaces :**
- Consomme : `songFromProposal(payload, song, ids)` (`lib/moderation/apply.ts`, inchangé) ; `upsertArtist` (plan 1) ; `songSearchColumns` (plan 1) ; `songDedupeKey` (plan 1) ; `inList` (plan 2) ; `Executor` (tâche 1) ; `DecisionError` (tâche 2).
- Produit : `approveRevision(db: Db, input: { revisionId: string; reviewerId: string; note: string | null }): Promise<ApproveResult>` avec `type ApproveResult = { ok: true; songId: string } | { ok: false; error: DecisionError }`.
- Produit : `ARTISTS_OF(songAlias: string): SQL` exporté par `lib/catalog/queries` ; `upsertArtist(db: Executor, input)`.

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

`tests/integration/approve.test.ts` :

```ts
// Plan 3, tâche 3 : approbation d'une proposition, en une transaction (spec §8.5 ; §13, cycle de vie d'une révision).
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getSongById } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songRevisions, songs } from "@/lib/db/schema";
import { getRevision } from "@/lib/moderation/queries";
import { approveRevision } from "@/lib/moderation/revisionWrite";
import { searchSongs } from "@/lib/search/searchSongs";
import type { Song } from "@/types/catalog";
import type { ProposalPayload } from "@/types/proposal";
import { seedFixtures } from "../fixtures/seed";
import { insertRevision, insertUser } from "./factories";
import { resetDb } from "./helpers";

const UNKNOWN = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";

/** La chanson telle quelle, comme le formulaire de correction la pré-remplit. */
const payloadOf = (song: Song): ProposalPayload => ({
  titleAr: song.titleAr,
  titleLatin: song.titleLatin,
  artists: song.artists.map(({ id, nameAr, nameLatin }) => ({ id, nameAr, nameLatin })),
  lyrics: song.lyrics,
  lyricsTranslit: song.lyricsTranslit,
  dialect: song.dialect,
});

const count = async (query: string) => Number((await db.execute<{ n: string }>(sql.raw(query))).rows[0].n);
const artistCount = () => count("SELECT count(*) AS n FROM artists");

describe("approuver une proposition", () => {
  let ids = new Map<string, string>();
  let leila: { id: string };
  let rania: { id: string };

  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    leila = await insertUser({ name: "Leïla" });
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
  });

  const fixture = async (ref: string): Promise<Song> => {
    const song = await getSongById(ids.get(ref)!);
    if (!song) throw new Error(`chanson de test introuvable : ${ref}`);
    return song;
  };

  it("un ajout crée la chanson, publiée et cherchable, avec un artiste nouveau et un artiste connu", async () => {
    const saber = (await fixture("s-sidi-mansour")).artists[0];
    const payload: ProposalPayload = {
      titleAr: "لمّا بدا يتثنّى",
      titleLatin: "Lamma Bada Yatathanna",
      artists: [
        { id: null, nameAr: "تراث أندلسي", nameLatin: "Répertoire andalou" },
        { id: saber.id, nameAr: saber.nameAr, nameLatin: saber.nameLatin },
      ],
      lyrics: "يا نسيم الليل سلّم\nعلى الحبايب في الدار",
      lyricsTranslit: "ya nassim el lil sallem\n3la el 7bayeb fi ed-dar",
      dialect: "maghreb_other",
    };
    const revision = await insertRevision({ authorId: leila.id, payload });
    const artistsBefore = await artistCount();

    const result = await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null });
    if (!result.ok) throw new Error(result.error);

    expect(await artistCount()).toBe(artistsBefore + 1);
    expect(await getSongById(result.songId)).toMatchObject({
      titleLatin: "Lamma Bada Yatathanna",
      source: "contribution",
      dialect: "maghreb_other",
      lyricsTranslit: payload.lyricsTranslit,
      translitStatus: "reviewed",
      artists: [
        { nameLatin: "Répertoire andalou", role: "main" },
        { id: saber.id, nameLatin: "Saber Rebai", role: "main" },
      ],
    });
    const [row] = await db.select().from(songs).where(eq(songs.id, result.songId));
    expect(row).toMatchObject({ status: "published", sourceRef: null, importLocked: false });
    expect((await searchSongs("lamma bada")).items[0]?.id).toBe(result.songId);
    expect((await searchSongs("répertoire andalou")).items.map((i) => i.id)).toContain(result.songId);

    expect(await getRevision(revision)).toMatchObject({ status: "approved", songId: null });
    const [reviewed] = await db.select().from(songRevisions).where(eq(songRevisions.id, revision));
    expect(reviewed.reviewerId).toBe(rania.id);
    expect(reviewed.reviewedAt).not.toBeNull();
  });

  it("une correction garde l'identifiant, la source et le rôle des artistes, et protège la chanson des imports", async () => {
    const sidi = await fixture("s-sidi-mansour");
    const payload = { ...payloadOf(sidi), titleLatin: "Sidi Mansour (version longue)", lyrics: `${sidi.lyrics}\nوالدار ضاوية بينا` };
    const revision = await insertRevision({ authorId: leila.id, songId: sidi.id, payload });

    expect(await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: "Merci !" })).toEqual({
      ok: true,
      songId: sidi.id,
    });
    const after = await getSongById(sidi.id);
    expect(after).toMatchObject({ titleLatin: "Sidi Mansour (version longue)", source: sidi.source, artists: sidi.artists });
    expect(after?.lyrics.endsWith("والدار ضاوية بينا")).toBe(true);
    const [row] = await db.select().from(songs).where(eq(songs.id, sidi.id));
    expect(row.importLocked).toBe(true);
    expect((await searchSongs("version longue")).items[0]?.id).toBe(sidi.id);
    expect(await getRevision(revision)).toMatchObject({ status: "approved", reviewNote: "Merci !" });

    // Un nouvel import ne défait pas la correction (écart 6 ; plan 1 : une chanson verrouillée n'est pas réécrite).
    await seedFixtures(db);
    expect((await getSongById(sidi.id))?.titleLatin).toBe("Sidi Mansour (version longue)");
  });

  it("des paroles corrigées sans nouvelle translittération vident la translittération (spec §8.5)", async () => {
    const id = ids.get("s-ya-lili")!;
    await db.update(songs).set({ lyricsTranslit: "ya lili\nya lili", translitStatus: "auto" }).where(eq(songs.id, id));
    const yaLili = await fixture("s-ya-lili");
    const revision = await insertRevision({
      authorId: leila.id,
      songId: id,
      payload: { ...payloadOf(yaLili), lyrics: `${yaLili.lyrics}\nيا ليلي يا ليلي` },
    });
    await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null });
    expect(await getSongById(id)).toMatchObject({ lyricsTranslit: null, translitStatus: "none" });
  });

  it("refuse la correction d'une chanson retirée entre-temps, sans rien écrire", async () => {
    const habaytak = await fixture("s-habaytak");
    const revision = await insertRevision({
      authorId: leila.id,
      songId: habaytak.id,
      payload: { ...payloadOf(habaytak), artists: [{ id: null, nameAr: null, nameLatin: "Artiste Nouveau" }] },
    });
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, habaytak.id));
    const artistsBefore = await artistCount();

    expect(await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null })).toEqual({
      ok: false,
      error: "songGone",
    });
    expect(await artistCount()).toBe(artistsBefore);
    expect((await getRevision(revision))?.status).toBe("pending");
  });

  it("refuse une proposition déjà relue ou inconnue", async () => {
    const revision = await insertRevision({ authorId: leila.id });
    expect((await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null })).ok).toBe(true);
    expect(await approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null })).toEqual({
      ok: false,
      error: "notPending",
    });
    expect(await approveRevision(db, { revisionId: UNKNOWN, reviewerId: rania.id, note: null })).toEqual({
      ok: false,
      error: "notFound",
    });
  });

  it("deux modérateurs qui approuvent en même temps : une seule chanson créée", async () => {
    const revision = await insertRevision({ authorId: leila.id });
    const other = await insertUser({ globalRole: "moderator" });
    const results = await Promise.all([
      approveRevision(db, { revisionId: revision, reviewerId: rania.id, note: null }),
      approveRevision(db, { revisionId: revision, reviewerId: other.id, note: null }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, error: "notPending" }]);
    expect(await count("SELECT count(*) AS n FROM songs WHERE source = 'contribution'")).toBe(1);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm exec vitest run --project integration tests/integration/approve.test.ts`. Attendu : FAIL, `approveRevision` introuvable.

- [ ] **Étape 3 : préparer le catalogue.**

Dans `src/lib/catalog/queries.ts`, exporter la sous-requête des artistes, sans la changer : `const ARTISTS_OF = …` devient `export const ARTISTS_OF = …`.

Dans `src/lib/catalog/artists.ts`, `upsertArtist` accepte une transaction : remplacer `import type { Db } from "@/lib/db/client";` par `import type { Executor } from "@/lib/db/client";`, et la signature devient `export async function upsertArtist(db: Executor, input: ArtistInput): Promise<UpsertedArtist>`. Le corps ne change pas : une transaction a les mêmes méthodes `insert` et `update` que la base.

- [ ] **Étape 4 : écrire l'approbation.** Dans `src/lib/moderation/revisionWrite.ts`, compléter les imports :

```ts
import { eq, sql } from "drizzle-orm";
import { upsertArtist } from "@/lib/catalog/artists";
import { ARTISTS_OF } from "@/lib/catalog/queries";
import { songSearchColumns } from "@/lib/catalog/searchColumns";
import { songDedupeKey } from "@/lib/catalog/songs";
import { songArtists, songRevisions } from "@/lib/db/schema";
import { inList } from "@/lib/db/sqlList";
import { songFromProposal } from "@/lib/moderation/apply";
import type { ArtistRef, Dialect, Song, SongSource, TranslitStatus } from "@/types/catalog";
import type { ProposalPayload, ProposalStatus } from "@/types/proposal";
```

(fusionner avec les imports existants de `drizzle-orm`, `@/lib/db/schema` et `@/types/proposal`). Puis ajouter à la fin :

```ts
export type ApproveResult = { ok: true; songId: string } | { ok: false; error: DecisionError };

type LockedSong = {
  id: string;
  title_ar: string | null;
  title_latin: string | null;
  lyrics: string;
  lyrics_translit: string | null;
  translit_status: TranslitStatus;
  dialect: Dialect;
  source: SongSource;
  status: "published" | "removed";
  artists: ArtistRef[];
};

type ArtistNamesRow = {
  id: string;
  name_ar: string | null;
  name_latin: string | null;
  aliases: string[];
  identity_key: string;
};

/**
 * Approuve une proposition (spec §8.5), en une transaction. Verrous : la proposition, puis la chanson
 * corrigée. Les nouveaux artistes sont créés, ou retrouvés par leur clé d'identité s'ils existent déjà.
 * Un ajout crée la chanson (source « contribution ») ; une correction la met à jour sous le même identifiant,
 * avec la même source, et la verrouille contre les imports (écart 6). Les colonnes de recherche sont
 * recalculées. Un refus (`ok: false`) n'écrit rien : il survient avant toute écriture.
 */
export function approveRevision(
  db: Db,
  input: { revisionId: string; reviewerId: string; note: string | null },
): Promise<ApproveResult> {
  return db.transaction(async (tx): Promise<ApproveResult> => {
    const found = await tx.execute<{ song_id: string | null; payload: ProposalPayload; status: ProposalStatus }>(sql`
      SELECT song_id, payload, status FROM song_revisions WHERE id = ${input.revisionId} FOR UPDATE`);
    const revision = found.rows[0];
    if (!revision) return { ok: false, error: "notFound" };
    if (revision.status !== "pending") return { ok: false, error: "notPending" };

    let current: Song | undefined;
    if (revision.song_id) {
      const res = await tx.execute<LockedSong>(sql`
        SELECT s.id, s.title_ar, s.title_latin, s.lyrics, s.lyrics_translit, s.translit_status, s.dialect, s.source,
          s.status, ${ARTISTS_OF("s")} AS artists
        FROM songs s WHERE s.id = ${revision.song_id} FOR UPDATE OF s`);
      const row = res.rows[0];
      if (!row || row.status !== "published") return { ok: false, error: "songGone" };
      current = {
        id: row.id,
        titleAr: row.title_ar,
        titleLatin: row.title_latin,
        lyrics: row.lyrics,
        lyricsTranslit: row.lyrics_translit,
        translitStatus: row.translit_status,
        dialect: row.dialect,
        source: row.source,
        artists: row.artists,
      };
    }

    // Artistes nouveaux (`id` nul), par leur position dans la proposition.
    const createdArtists = new Map<number, string>();
    for (const [index, artist] of revision.payload.artists.entries()) {
      if (artist.id !== null) continue;
      const created = await upsertArtist(tx, {
        nameAr: artist.nameAr ?? undefined,
        nameLatin: artist.nameLatin ?? undefined,
      });
      createdArtists.set(index, created.id);
    }

    // Identifiant de la nouvelle chanson, tiré par PostgreSQL comme tous les identifiants du projet.
    const songId =
      current?.id ?? (await tx.execute<{ id: string }>(sql`SELECT gen_random_uuid() AS id`)).rows[0].id;
    const song = songFromProposal(revision.payload, current, {
      songId,
      artistId: (index) => createdArtists.get(index)!,
    });
    // Un nouvel artiste peut se confondre avec un artiste déjà cité (même clé d'identité) : une seule fois.
    const artists = song.artists.filter((a, i, all) => all.findIndex((b) => b.id === a.id) === i);

    const names = await tx.execute<ArtistNamesRow>(sql`
      SELECT id, name_ar, name_latin, aliases, identity_key FROM artists WHERE id IN (${inList(artists.map((a) => a.id))})`);
    const byId = new Map(names.rows.map((r) => [r.id, r]));
    const cols = songSearchColumns({
      titleAr: song.titleAr,
      titleLatin: song.titleLatin,
      lyrics: song.lyrics,
      artists: artists.map((a) => {
        const r = byId.get(a.id)!;
        return { nameAr: r.name_ar, nameLatin: r.name_latin, aliases: r.aliases };
      }),
    });

    if (current) {
      await tx.execute(sql`
        UPDATE songs SET title_ar = ${song.titleAr}, title_latin = ${song.titleLatin}, lyrics = ${song.lyrics},
          lyrics_translit = ${song.lyricsTranslit}, translit_status = ${song.translitStatus}, dialect = ${song.dialect},
          search_ar = ${cols.searchAr}, search_latin = ${cols.searchLatin}, search_key = ${cols.searchKey},
          lyrics_search_ar = ${cols.lyricsSearchAr}, lyrics_search_key = ${cols.lyricsSearchKey},
          import_locked = true, updated_at = now()
        WHERE id = ${songId}`);
      await tx.delete(songArtists).where(eq(songArtists.songId, songId));
    } else {
      const title = song.titleAr ?? song.titleLatin ?? "";
      const dedupeKey = songDedupeKey(byId.get(artists[0].id)!.identity_key, title);
      await tx.execute(sql`
        INSERT INTO songs (id, title_ar, title_latin, lyrics, lyrics_translit, translit_status, dialect, source,
          dedupe_key, search_ar, search_latin, search_key, lyrics_search_ar, lyrics_search_key)
        VALUES (${songId}, ${song.titleAr}, ${song.titleLatin}, ${song.lyrics}, ${song.lyricsTranslit},
          ${song.translitStatus}, ${song.dialect}, 'contribution', ${dedupeKey}, ${cols.searchAr}, ${cols.searchLatin},
          ${cols.searchKey}, ${cols.lyricsSearchAr}, ${cols.lyricsSearchKey})`);
    }
    await tx
      .insert(songArtists)
      .values(artists.map((a, position) => ({ songId, artistId: a.id, role: a.role, position })));

    await tx.execute(sql`
      UPDATE song_revisions
      SET status = 'approved', reviewer_id = ${input.reviewerId}, review_note = ${input.note},
        reviewed_at = now(), updated_at = now()
      WHERE id = ${input.revisionId}`);
    return { ok: true, songId };
  });
}
```

Une proposition a toujours au moins un artiste (`validateProposal`) : `artists[0]` existe. `songRevisions` n'est utilisé que par `createRevision` : garder l'import.

- [ ] **Étape 5 : relancer les tests.** Lancer `pnpm exec vitest run --project integration tests/integration/approve.test.ts`, puis `pnpm test:integration` (les tests d'import du plan 1 appellent `upsertArtist`) et `pnpm typecheck`. Attendu : PASS. Si le test des deux approbations simultanées échoue par interblocage, vérifier que la proposition est verrouillée avant la chanson.

- [ ] **Étape 6 : commit.**

```bash
git add src/lib/moderation/revisionWrite.ts src/lib/catalog tests/integration/approve.test.ts
git commit -m "feat(moderation): approve a revision in one transaction"
```

---

### Tâche 4 : artistes connus et « existe peut-être déjà », lus en base

**Fichiers :**
- Créer : `src/lib/catalog/artistSuggestions.ts`, `src/app/api/artistes/route.ts`, `src/lib/contribution/similarSongs.ts`, `src/components/contribute/useArtistSuggestions.ts`
- Modifier : `src/lib/search/searchSongs.ts`, `src/lib/search/types.ts`, `src/lib/moderation/limits.ts`, `src/lib/contribution/artists.ts`, `src/components/contribute/ArtistInput.tsx`, `src/components/contribute/ContributionForm.tsx`, `src/components/contribute/SimilarSongs.tsx`, `src/app/contribuer/page.tsx`, `src/app/contribuer/[songId]/page.tsx`
- Supprimer : `src/mocks/similar.ts`, `tests/unit/contribution/similar.test.ts`
- Test : `tests/integration/artistSuggestions.test.ts`, `tests/integration/artistsRoute.test.ts`, `tests/integration/similarSongs.test.ts` ; modifier `tests/unit/contribution/artists.test.ts`

**Interfaces :**
- Consomme : `suggestArtists`, `resolveArtists`, `KnownArtist` (`lib/contribution/artists.ts`, inchangés) ; `searchSongs` (plan 1) ; `canContribute` (tâche 2) ; `hitRateLimit` (plan 1).
- Produit : `SearchOptions.inLyrics?: boolean` (vaut vrai par défaut) ; `suggestArtistsFromDb(query: string, limit?: number): Promise<KnownArtist[]>` ; `artistCandidates(names: readonly string[]): Promise<KnownArtist[]>` ; `allowArtistSuggestion(userId: string): Promise<boolean>` ; `findSimilarSongs(query: { titles: string[]; artists: string[] }, limit?: number): Promise<SongHit[]>` ; `SIMILAR_MAX = 3` ; `GET /api/artistes?q=` qui répond `{ artists: KnownArtist[] }`.
- Retiré : `knownArtists`, `src/mocks/similar.ts`, la prop `artists` de `ContributionForm` et d'`ArtistInput`.

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

`tests/integration/artistSuggestions.test.ts` :

```ts
// Plan 3, tâche 4 : artistes connus en base, pour l'autocomplétion et pour la résolution des noms saisis (spec §8.1).
import { beforeAll, describe, expect, it } from "vitest";
import { artistCandidates, suggestArtistsFromDb } from "@/lib/catalog/artistSuggestions";
import { resolveArtists } from "@/lib/contribution/artists";
import { db } from "@/lib/db/client";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

const names = (artists: { nameLatin: string | null }[]) => artists.map((a) => a.nameLatin);

describe("artistes connus, lus en base", () => {
  beforeAll(async () => {
    await resetDb();
    await seedFixtures(db);
  });

  it("propose les artistes dès 2 lettres, dans l'écriture tapée", async () => {
    expect(names(await suggestArtistsFromDb("sab"))[0]).toBe("Saber Rebai");
    expect(names(await suggestArtistsFromDb("صابر"))[0]).toBe("Saber Rebai");
    expect(names(await suggestArtistsFromDb("oum kal"))[0]).toBe("Oum Kalthoum");
  });

  it("rapproche l'arabizi de l'arabe par la clé de consonnes", async () => {
    expect(names(await suggestArtistsFromDb("fayrouz"))).toContain("Fairuz");
  });

  it("ne propose rien sous 2 lettres, ni pour un nom inconnu", async () => {
    expect(await suggestArtistsFromDb("s")).toEqual([]);
    expect(await suggestArtistsFromDb("   ")).toEqual([]);
    expect(await suggestArtistsFromDb("zzzzzz")).toEqual([]);
  });

  it("classe les artistes dont le nom commence par la saisie en premier, et respecte la limite demandée", async () => {
    // « ou » est dans quatre noms ; « Oum Kalthoum » le commence.
    const all = await suggestArtistsFromDb("ou");
    expect(names(all)[0]).toBe("Oum Kalthoum");
    expect(all).toHaveLength(4);
    expect(names(await suggestArtistsFromDb("ou", 2))).toEqual(names(all).slice(0, 2));
  });

  it("retrouve l'artiste d'un nom saisi, quelle que soit la casse, et laisse un nom inconnu nouveau", async () => {
    const typed = ["saber rebai", "Artiste Nouveau"];
    const resolved = resolveArtists(typed, await artistCandidates(typed));
    expect(resolved[0]).toMatchObject({ nameLatin: "Saber Rebai", nameAr: "صابر الرباعي" });
    expect(resolved[0].id).toEqual(expect.any(String));
    expect(resolved[1]).toEqual({ id: null, nameAr: null, nameLatin: "Artiste Nouveau" });
  });

  it("ne renvoie aucun candidat pour un nom sans lettres", async () => {
    expect(await artistCandidates(["", "  ", "--"])).toEqual([]);
  });
});
```

`tests/integration/artistsRoute.test.ts` :

```ts
// Plan 3, tâche 4 : GET /api/artistes est réservé aux membres à l'adresse vérifiée, et limité.
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { seedFixtures } from "../fixtures/seed";
import { insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));
vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));

const { GET } = await import("@/app/api/artistes/route");

const ask = (q: string) => GET(new Request(`http://localhost/api/artistes?q=${encodeURIComponent(q)}`));

async function signIn(userId: string): Promise<void> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

describe("GET /api/artistes", () => {
  beforeEach(async () => {
    await resetDb();
    await seedFixtures(db);
    session.user = null;
  });

  it("refuse un visiteur et une adresse non vérifiée", async () => {
    expect((await ask("sab")).status).toBe(401);
    await signIn((await insertUser({ emailVerified: false })).id);
    expect((await ask("sab")).status).toBe(401);
  });

  it("propose les artistes connus à un membre, sans mise en cache", async () => {
    await signIn((await insertUser()).id);
    const res = await ask("sab");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    const body = (await res.json()) as { artists: { nameLatin: string | null }[] };
    expect(body.artists[0].nameLatin).toBe("Saber Rebai");
  });

  it("répond 429 au-delà de 120 requêtes par minute", async () => {
    await signIn((await insertUser()).id);
    for (let i = 0; i < 120; i += 1) expect((await ask("sab")).status).toBe(200);
    expect((await ask("sab")).status).toBe(429);
  });
});
```

`tests/integration/similarSongs.test.ts` :

```ts
// Plan 3, tâche 4 : « Cette chanson existe peut-être déjà » (spec §8.2, écart 5).
import { beforeAll, describe, expect, it } from "vitest";
import { findSimilarSongs } from "@/lib/contribution/similarSongs";
import { db } from "@/lib/db/client";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

describe("findSimilarSongs", () => {
  let ids = new Map<string, string>();
  beforeAll(async () => {
    await resetDb();
    ids = await seedFixtures(db);
  });
  const idsOf = (hits: { id: string }[]) => hits.map((h) => h.id);

  it("trouve la chanson par son titre latin ou arabe", async () => {
    expect(idsOf(await findSimilarSongs({ titles: ["sidi mansour"], artists: ["Saber Rebai"] }))[0]).toBe(
      ids.get("s-sidi-mansour"),
    );
    expect(idsOf(await findSimilarSongs({ titles: ["سيدي منصور"], artists: [] }))[0]).toBe(ids.get("s-sidi-mansour"));
  });

  it("place d'abord les chansons de l'artiste saisi", async () => {
    // « ya lili » ressort Ya Lili (Balti) puis Ya Lella (Hedi Jouini) : l'artiste remet Ya Lella devant.
    expect(idsOf(await findSimilarSongs({ titles: ["ya lili"], artists: ["Hedi Jouini"] }))).toEqual([
      ids.get("s-ya-lella"),
      ids.get("s-ya-lili"),
    ]);
  });

  it("ne liste pas deux fois une chanson trouvée par ses deux titres", async () => {
    expect(idsOf(await findSimilarSongs({ titles: ["سيدي منصور", "Sidi Mansour"], artists: [] }))).toEqual([
      ids.get("s-sidi-mansour"),
    ]);
  });

  it("montre 3 chansons au plus, sans extrait de paroles", async () => {
    const hits = await findSimilarSongs({ titles: ["ya"], artists: [] });
    expect(hits).toHaveLength(3);
    expect(hits.every((h) => h.snippet === null)).toBe(true);
  });

  it("ne cherche rien sans titre", async () => {
    expect(await findSimilarSongs({ titles: ["", " "], artists: ["Saber Rebai"] })).toEqual([]);
  });

  it("ne rapproche pas une chanson par ses seules paroles", async () => {
    // « الليل » apparaît dans huit paroles, mais dans aucun titre ni nom d'artiste.
    expect(await findSimilarSongs({ titles: ["الليل"], artists: [] })).toEqual([]);
  });
});
```

Dans `tests/unit/contribution/artists.test.ts`, retirer `knownArtists` de l'import (`import { resolveArtists, suggestArtists, type KnownArtist } from "@/lib/contribution/artists";`), retirer la ligne `import { SONGS } from "@/mocks/catalog";` et supprimer le bloc `describe("knownArtists", …)` en entier.

Supprimer `tests/unit/contribution/similar.test.ts` : `tests/integration/similarSongs.test.ts` le remplace, sur la vraie recherche.

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm exec vitest run --project integration tests/integration/artistSuggestions.test.ts tests/integration/artistsRoute.test.ts tests/integration/similarSongs.test.ts`. Attendu : FAIL, modules introuvables.

- [ ] **Étape 3 : la recherche sans les paroles.**

Dans `src/lib/search/types.ts`, ajouter à `SearchOptions` :

```ts
  /** Chercher aussi dans les paroles (vrai par défaut). « Existe peut-être déjà » ne compare que les titres et les artistes. */
  inLyrics?: boolean;
```

Dans `src/lib/search/searchSongs.ts`, trois changements, sans toucher au barème :
- la signature : `function buildClauses(q: PreparedQuery, inLyrics: boolean): { score: SQL; lyricsMatch: SQL; where: SQL } {` ;
- les deux conditions du bloc des paroles : `if (q.ar) {` devient `if (inLyrics && q.ar) {`, et `if (q.lat && q.key.length >= LYRICS_KEY_MIN_LENGTH) {` devient `if (inLyrics && q.lat && q.key.length >= LYRICS_KEY_MIN_LENGTH) {` ;
- l'appel, dans `searchSongs` : `const { score, lyricsMatch, where } = buildClauses(q, opts.inLyrics ?? true);`.

Sans paroles, `lyrics` reste vide, `lyricsMatch` vaut `false` et aucun extrait n'est lu.

- [ ] **Étape 4 : les artistes en base, et la route.**

`src/lib/catalog/artistSuggestions.ts` :

```ts
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { suggestArtists, type KnownArtist } from "@/lib/contribution/artists";
import { db } from "@/lib/db/client";
import { countSignificant, detectScript } from "@/lib/text/detectScript";
import { normalizeArabic } from "@/lib/text/normalizeArabic";
import { normalizeLatin } from "@/lib/text/normalizeLatin";
import { toSearchKey } from "@/lib/text/searchKey";

/**
 * Artistes de la table `artists` pour la saisie d'une proposition (spec §8.1). La base ne livre que des
 * candidats ; `suggestArtists` et `resolveArtists` (lib/contribution/artists, testés sans base) les classent
 * et les comparent, comme du temps de la maquette.
 */

const CANDIDATES_MAX = 200;
const SUGGESTIONS_MAX = 5;

// Les chaînes normalisées ne contiennent que des lettres, des chiffres et des espaces : aucun caractère
// spécial de LIKE (% ou _) ne peut s'y trouver (même raisonnement que `searchSongs`).
const contains = (column: "search_ar" | "search_latin" | "search_key", value: string): SQL =>
  sql`${sql.raw(column)} LIKE ${`%${value}%`}`;

/** Conditions qui retrouvent un nom dans l'une ou l'autre écriture ; la clé de consonnes rapproche l'arabizi de l'arabe. */
function matches(name: string, withKey: boolean): SQL[] {
  const script = detectScript(name);
  const clauses: SQL[] = [];
  const ar = script !== "latin" ? normalizeArabic(name) : "";
  const latin = script !== "arabic" ? normalizeLatin(name) : "";
  const key = toSearchKey(name);
  if (ar) clauses.push(contains("search_ar", ar));
  if (latin) clauses.push(contains("search_latin", latin));
  if (withKey && key.length >= 2) clauses.push(contains("search_key", key));
  return clauses;
}

async function candidatesWhere(clauses: SQL[]): Promise<KnownArtist[]> {
  if (clauses.length === 0) return [];
  const res = await db.execute<{ id: string; name_ar: string | null; name_latin: string | null }>(sql`
    SELECT id, name_ar, name_latin FROM artists
    WHERE ${sql.join(clauses, sql` OR `)}
    ORDER BY length(search_ar) + length(search_latin), id
    LIMIT ${CANDIDATES_MAX}`);
  return res.rows.map((r) => ({ id: r.id, nameAr: r.name_ar, nameLatin: r.name_latin }));
}

/** Autocomplétion : à partir de 2 lettres, les artistes connus qui répondent à la saisie, les meilleurs d'abord. */
export async function suggestArtistsFromDb(query: string, limit = SUGGESTIONS_MAX): Promise<KnownArtist[]> {
  const q = query.trim();
  if (countSignificant(q) < 2) return [];
  return suggestArtists(q, await candidatesWhere(matches(q, true)), limit);
}

/** Artistes qui peuvent porter l'un de ces noms saisis : la matière de `resolveArtists`, qui compare les noms en entier. */
export async function artistCandidates(names: readonly string[]): Promise<KnownArtist[]> {
  return candidatesWhere(names.flatMap((name) => matches(name, false)));
}
```

Dans `src/lib/moderation/limits.ts`, ajouter :

```ts
/** L'autocomplétion des artistes interroge la base à chaque frappe : 120 requêtes par minute et par personne. */
export const ARTIST_SUGGEST_LIMIT = { limit: 120, windowSeconds: 60 } as const;

export async function allowArtistSuggestion(userId: string): Promise<boolean> {
  const { allowed } = await hitRateLimit(
    `artists:${userId}`,
    ARTIST_SUGGEST_LIMIT.limit,
    ARTIST_SUGGEST_LIMIT.windowSeconds,
  );
  return allowed;
}
```

`src/app/api/artistes/route.ts` :

```ts
import { canContribute } from "@/lib/auth/permissions";
import { suggestArtistsFromDb } from "@/lib/catalog/artistSuggestions";
import { ARTIST_NAME_MAX_LENGTH } from "@/lib/contribution/validate";
import { allowArtistSuggestion } from "@/lib/moderation/limits";
import { getCurrentUser } from "@/lib/session";

/**
 * Autocomplétion des artistes du formulaire de proposition (écart 4). Réservée à qui peut proposer :
 * ni un visiteur ni une adresse non vérifiée n'interroge la table des artistes.
 */
export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!canContribute(user)) return Response.json({ artists: [] }, { status: 401 });
  if (!(await allowArtistSuggestion(user!.id))) return Response.json({ artists: [] }, { status: 429 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const artists = await suggestArtistsFromDb(q.slice(0, ARTIST_NAME_MAX_LENGTH));
  return Response.json({ artists }, { headers: { "Cache-Control": "private, no-store" } });
}
```

- [ ] **Étape 5 : « existe peut-être déjà ».**

`src/lib/contribution/similarSongs.ts` :

```ts
import "server-only";
import { suggestArtists } from "@/lib/contribution/artists";
import { searchSongs } from "@/lib/search/searchSongs";
import type { SongHit } from "@/lib/search/types";

export const SIMILAR_MAX = 3;

/**
 * « Existe peut-être déjà » (spec §8.2) : les chansons dont le titre ressemble à l'un des titres saisis,
 * celles des artistes saisis en premier, 3 au plus, sans extrait de paroles (écart 5). La recherche porte
 * sur les titres : avec les paroles, un mot courant (« الليل ») ferait remonter des chansons sans rapport.
 */
export async function findSimilarSongs(
  { titles, artists }: { titles: string[]; artists: string[] },
  limit = SIMILAR_MAX,
): Promise<SongHit[]> {
  const hits: SongHit[] = [];
  for (const title of titles.map((t) => t.trim()).filter(Boolean)) {
    for (const hit of (await searchSongs(title, { inLyrics: false })).items) {
      if (!hits.some((h) => h.id === hit.id)) hits.push(hit);
    }
  }
  const names = artists.map((a) => a.trim()).filter(Boolean);
  const sameArtist = (hit: SongHit) => names.some((name) => suggestArtists(name, hit.artists).length > 0);
  return [...hits.filter(sameArtist), ...hits.filter((hit) => !sameArtist(hit))].slice(0, limit);
}
```

Dans `src/components/contribute/SimilarSongs.tsx`, remplacer les deux imports de la maquette (`SONGS` et `findSimilarSongs`) par :

```tsx
import { findSimilarSongs } from "@/lib/contribution/similarSongs";
```

et la ligne de la recherche, `const hits = findSimilarSongs(SONGS, { titles, artists });`, par :

```tsx
  const hits = await findSimilarSongs({ titles, artists });
```

Supprimer `src/mocks/similar.ts`.

- [ ] **Étape 6 : le formulaire interroge la route.**

`src/components/contribute/useArtistSuggestions.ts` :

```ts
"use client";

import { useEffect, useState } from "react";
import type { KnownArtist } from "@/lib/contribution/artists";
import { countSignificant } from "@/lib/text/detectScript";

/** Délai après la dernière frappe avant d'interroger le serveur. */
const DEBOUNCE_MS = 200;

/**
 * Artistes connus qui répondent à ce qui est tapé (`GET /api/artistes?q=`), à partir de 2 lettres. Une réponse
 * qui arrive après une nouvelle frappe est ignorée. Réseau coupé ou réponse refusée : pas de suggestion, et la
 * saisie reste libre (un nom inconnu est un nouvel artiste).
 */
export function useArtistSuggestions(value: string): KnownArtist[] {
  const query = value.trim();
  const [found, setFound] = useState<{ query: string; artists: KnownArtist[] }>({ query: "", artists: [] });

  useEffect(() => {
    if (countSignificant(query) < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/artistes?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!res.ok) return;
        const body = (await res.json()) as { artists: KnownArtist[] };
        setFound({ query, artists: body.artists });
      } catch {
        // Annulée par une nouvelle frappe, ou réseau coupé.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return found.query === query ? found.artists : [];
}
```

`src/components/contribute/ArtistInput.tsx` :
- imports : `import { useId, useState, type Ref } from "react";` (sans `useMemo`), `import type { KnownArtist } from "@/lib/contribution/artists";`, et `import { useArtistSuggestions } from "./useArtistSuggestions";` ;
- retirer la prop `artists` : de la déstructuration et du type ;
- la ligne `const suggestions = useMemo(() => suggestArtists(value, artists), [value, artists]);` devient `const suggestions = useArtistSuggestions(value);` ;
- dans le commentaire du composant, « les artistes connus s'affichent dès 2 lettres » reste, suivi de « (lus en base par `/api/artistes`) ».

`src/components/contribute/ContributionForm.tsx` : retirer `import type { KnownArtist } from "@/lib/contribution/artists";`, la prop `artists` (déstructuration et type) et `artists={artists}` dans l'appel d'`ArtistInput`.

`src/lib/contribution/artists.ts` : supprimer `knownArtists` et son commentaire, et réduire l'import de types à `import type { ArtistRef } from "@/types/catalog";`.

`src/app/contribuer/page.tsx` : retirer les imports `knownArtists` et `SONGS`, et la prop `artists={knownArtists(SONGS)}`. `src/app/contribuer/[songId]/page.tsx` : retirer les mêmes imports ; l'appel devient `<ContributionForm songId={song.id} initial={formValuesFromSong(song, locale)} />`.

- [ ] **Étape 7 : relancer les tests.** Lancer `pnpm test`, `pnpm test:integration`, `pnpm typecheck` et `pnpm lint`. Attendu : PASS. Si le test des artistes cherche une suggestion absente, ne pas élargir `CANDIDATES_MAX` avant d'avoir lu `suggestArtists` : c'est lui qui filtre.

- [ ] **Étape 8 : vérifier dans le navigateur.** `pnpm seed:demo`, puis `pnpm dev`. Se connecter avec `leila@example.com` (lien dans la boîte locale), ouvrir `/contribuer` :
- taper « hedi » dans « Artiste 1 » : la suggestion « Hedi Jouini » apparaît, et le clavier (↑ ↓ Entrée Échap) fonctionne ;
- taper « sidi mansour » dans le titre latin et « Saber Rebai » comme artiste : l'encadré « Cette chanson existe peut-être déjà » montre « Sidi Mansour », sans extrait de paroles ;
- taper « fayrouz » : « Fairuz » est proposé (le nom arabe l'est aussi si la locale est l'arabe).

- [ ] **Étape 9 : commit.**

```bash
git add src tests
git commit -m "feat(contribute): known artists and similar songs read from the database"
```

---

### Tâche 5 : envoyer une proposition, Mes contributions et la pastille de « Moi »

**Fichiers :**
- Modifier : `src/app/actions/contribute.ts`, `src/lib/contribution/validate.ts`, `src/lib/moderation/age.ts`, `src/mocks/proposals.ts` (une ligne), `src/app/contribuer/[songId]/page.tsx`, `src/app/mes-contributions/page.tsx`, `src/components/contribute/ProposalCard.tsx`, `src/app/moi/page.tsx`, `messages/fr.json`, `messages/ar.json`
- Supprimer : `src/mocks/account.ts`
- Test : `tests/integration/contributeAction.test.ts` ; modifier `tests/unit/moderation/age.test.ts`

**Interfaces :**
- Consomme : `createRevision`, `hasPendingRevision`, `revisionsOf`, `pendingRevisionCountOf` (tâche 2) ; `allowRevision`, `REVISION_LIMIT` (tâche 2) ; `canContribute` (tâche 2) ; `artistCandidates` (tâche 4) ; `getSongById` (plan 1) ; `validateProposal`, `resolveArtists`, `isSameAsSong` (inchangés).
- Produit : deux codes d'erreur, `emailNotVerified` et `tooMany`, dans `ProposalErrorCode` ; `formatProposalDate(iso, locale)` dans `lib/moderation/age.ts`. `submitProposal(songId, previous, formData)` garde sa signature.

À partir de cette tâche, une proposition envoyée est lue par Mes contributions, mais la file de modération lit encore la maquette jusqu'à la tâche 6.

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

`tests/unit/moderation/age.test.ts` : ajouter `formatProposalDate` à l'import de `@/lib/moderation/age`, puis, à la fin du fichier :

```ts
describe("formatProposalDate", () => {
  it("écrit la date dans la langue de l'interface, en chiffres occidentaux", () => {
    expect(formatProposalDate("2026-11-18T10:00:00Z", "fr")).toBe("18 novembre 2026");
    expect(formatProposalDate("2026-11-18T10:00:00Z", "ar")).toMatch(/^18 .+ 2026$/);
  });
});
```

`tests/integration/contributeAction.test.ts` :

```ts
// Plan 3, tâche 5 : l'action « Proposer une chanson » (spec §8.1 à §8.3, §8.7, §12 : le serveur refuse).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSongById } from "@/lib/catalog/queries";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { songRevisions, songs, users } from "@/lib/db/schema";
import { REVISION_LIMIT } from "@/lib/moderation/limits";
import { seedFixtures } from "../fixtures/seed";
import { insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  RedirectType: { push: "push", replace: "replace" },
}));
// Les messages d'erreur sont rendus sous la forme de leur clé : le test lit le code d'erreur.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "fr",
}));

const { submitProposal } = await import("@/app/actions/contribute");

const INITIAL = { errors: {}, attempt: 0 };
const LYRICS = "يا نسيم الليل سلّم\nعلى الحبايب في الدار";

function proposalForm(over: {
  titleAr?: string;
  titleLatin?: string;
  artists?: string[];
  lyrics?: string;
  dialect?: string;
  translit?: string;
  rights?: boolean;
} = {}): FormData {
  const data = new FormData();
  data.set("titleAr", over.titleAr ?? "");
  data.set("titleLatin", over.titleLatin ?? "Lamma Bada");
  for (const artist of over.artists ?? ["Hedi Jouini"]) data.append("artist", artist);
  data.set("lyrics", over.lyrics ?? LYRICS);
  data.set("dialect", over.dialect ?? "tn");
  data.set("translit", over.translit ?? "");
  if (over.rights !== false) data.set("rights", "on");
  return data;
}

/** Soit l'état renvoyé au formulaire, soit l'adresse de la redirection. */
async function submit(songId: string | null, data: FormData) {
  try {
    return { state: await submitProposal(songId, INITIAL, data) };
  } catch (error) {
    const match = /^REDIRECT (.+)$/.exec(error instanceof Error ? error.message : "");
    if (!match) throw error;
    return { redirect: match[1] };
  }
}

async function signIn(userId: string): Promise<void> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

const revisions = () => db.select().from(songRevisions);

describe("proposer une chanson", () => {
  let ids = new Map<string, string>();
  let leila: { id: string };

  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    leila = await insertUser({ name: "Leïla" });
    await signIn(leila.id);
  });

  it("renvoie un visiteur vers la connexion", async () => {
    session.user = null;
    expect(await submit(null, proposalForm())).toEqual({ redirect: "/connexion?retour=%2Fcontribuer" });
    expect(await revisions()).toHaveLength(0);
  });

  it("refuse une adresse non vérifiée (spec §8.7)", async () => {
    await signIn((await insertUser({ emailVerified: false })).id);
    const result = await submit(null, proposalForm());
    expect(result).toMatchObject({ state: { errors: { form: "emailNotVerified" }, attempt: 1 } });
    expect(await revisions()).toHaveLength(0);
  });

  it("enregistre un ajout en attente : l'artiste connu est retrouvé, l'inconnu reste nouveau", async () => {
    const result = await submit(null, proposalForm({ artists: ["hedi jouini", "Artiste Nouveau"] }));
    expect(result.redirect).toMatch(/^\/mes-contributions\?envoyee=[0-9a-f-]{36}$/);

    const [row] = await revisions();
    expect(row).toMatchObject({ authorId: leila.id, songId: null, status: "pending", rightsDeclared: true });
    const jouini = (await getSongById(ids.get("s-ya-lella")!))!.artists[0];
    expect(row.payload).toMatchObject({
      titleLatin: "Lamma Bada",
      titleAr: null,
      lyrics: LYRICS,
      dialect: "tn",
      artists: [
        { id: jouini.id, nameLatin: "Hedi Jouini" },
        { id: null, nameLatin: "Artiste Nouveau" },
      ],
    });
  });

  it("enregistre une correction, puis refuse une seconde correction de la même chanson (spec §8.3)", async () => {
    const id = ids.get("s-ya-lella")!;
    const song = (await getSongById(id))!;
    const correction = () =>
      proposalForm({
        titleAr: song.titleAr ?? "",
        titleLatin: "Ya Lella (version de Tunis)",
        lyrics: song.lyrics,
        translit: song.lyricsTranslit ?? "",
        dialect: song.dialect,
      });
    expect((await submit(id, correction())).redirect).toMatch(/^\/mes-contributions\?envoyee=/);
    expect(await submit(id, correction())).toMatchObject({ state: { errors: { form: "pendingExists" } } });
    expect(await revisions()).toHaveLength(1);
  });

  it("refuse une correction qui ne change rien", async () => {
    const id = ids.get("s-ya-lella")!;
    const song = (await getSongById(id))!;
    const same = proposalForm({
      titleAr: song.titleAr ?? "",
      titleLatin: song.titleLatin ?? "",
      lyrics: song.lyrics,
      translit: song.lyricsTranslit ?? "",
      dialect: song.dialect,
    });
    expect(await submit(id, same)).toMatchObject({ state: { errors: { form: "unchanged" } } });
    expect(await revisions()).toHaveLength(0);
  });

  it("refuse la correction d'une chanson retirée ou inconnue", async () => {
    const removed = ids.get("s-habaytak")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    expect(await submit(removed, proposalForm())).toMatchObject({ state: { errors: { form: "songMissing" } } });
    expect(await submit("s-sidi-mansour", proposalForm())).toMatchObject({ state: { errors: { form: "songMissing" } } });
  });

  it("refuse le formulaire invalide, sans rien écrire ni compter dans la limite du jour", async () => {
    const result = await submit(null, proposalForm({ rights: false, lyrics: "قصير" }));
    expect(result).toMatchObject({ state: { errors: { rights: "rightsMissing", lyrics: "lyricsTooShort" } } });
    expect(await revisions()).toHaveLength(0);
    for (let i = 0; i < REVISION_LIMIT.limit; i += 1) {
      expect((await submit(null, proposalForm({ titleLatin: `Titre ${i}` }))).redirect).toBeDefined();
    }
  });

  it(`refuse la ${REVISION_LIMIT.limit + 1}e proposition du jour (spec §8.7)`, async () => {
    for (let i = 0; i < REVISION_LIMIT.limit; i += 1) {
      expect((await submit(null, proposalForm({ titleLatin: `Titre ${i}` }))).redirect).toBeDefined();
    }
    expect(await submit(null, proposalForm({ titleLatin: "Une de trop" }))).toMatchObject({
      state: { errors: { form: "tooMany" } },
    });
    expect(await revisions()).toHaveLength(REVISION_LIMIT.limit);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/moderation/age.test.ts` et `pnpm exec vitest run --project integration tests/integration/contributeAction.test.ts`. Attendu : FAIL, `formatProposalDate` introuvable, et l'action écrit encore dans la maquette.

- [ ] **Étape 3 : les deux codes d'erreur et leurs messages.**

Dans `src/lib/contribution/validate.ts`, ajouter à l'union `ProposalErrorCode`, après `"songMissing"` : `| "emailNotVerified" | "tooMany"`.

`messages/fr.json`, dans `contribute.errors` :

```json
"emailNotVerified": "Votre adresse e-mail n'est pas vérifiée. Connectez-vous avec le lien reçu par e-mail pour proposer une chanson.",
"tooMany": "Vous avez atteint la limite de {max} propositions par jour. Réessayez demain."
```

`messages/ar.json`, dans `contribute.errors` :

```json
"emailNotVerified": "لم يتمّ التحقق من بريدكم الإلكتروني. سجّلوا الدخول عبر الرابط الذي وصلكم بالبريد لتتمكّنوا من اقتراح أغنية.",
"tooMany": "بلغتم حدّ {max} اقتراحات في اليوم. أعيدوا المحاولة غدًا."
```

- [ ] **Étape 4 : la date des propositions.** Dans `src/lib/moderation/age.ts`, ajouter à la fin le corps de `formatProposalDate` de `src/mocks/proposals.ts` :

```ts
/** Date d'une proposition, dans la langue de l'interface ; chiffres occidentaux en arabe (usage tunisien). */
export function formatProposalDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Tunis",
  }).format(new Date(iso));
}
```

Dans `src/mocks/proposals.ts`, supprimer la fonction `formatProposalDate` et ajouter en haut : `export { formatProposalDate } from "@/lib/moderation/age";`. Les écrans de modération et `tests/unit/contribution/store.test.ts` continuent de compiler jusqu'à la tâche 6.

- [ ] **Étape 5 : réécrire l'action.** Remplacer `src/app/actions/contribute.ts`, en gardant `ContributeState`, `numberFormat` et `translate` tels quels :

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { canContribute } from "@/lib/auth/permissions";
import { artistCandidates } from "@/lib/catalog/artistSuggestions";
import { getSongById } from "@/lib/catalog/queries";
import { resolveArtists } from "@/lib/contribution/artists";
import { isSameAsSong } from "@/lib/contribution/correction";
import { contributionsHref, loginHref } from "@/lib/contribution/routes";
import {
  proposalInputFromFormData,
  validateProposal,
  type ProposalErrors,
  type ProposalField,
} from "@/lib/contribution/validate";
import { db } from "@/lib/db/client";
import { allowRevision, REVISION_LIMIT } from "@/lib/moderation/limits";
import { hasPendingRevision } from "@/lib/moderation/queries";
import { createRevision } from "@/lib/moderation/revisionWrite";
import { getCurrentUser } from "@/lib/session";

/** Réponse à un envoi refusé : les messages d'erreur, déjà traduits, champ par champ. */
export interface ContributeState {
  errors: Partial<Record<ProposalField, string>>;
  /** Numéro de l'envoi : le formulaire replace le focus sur le récapitulatif à chaque nouvel échec. */
  attempt: number;
}

/** Nombres dans les messages : « 20 000 » en français, chiffres occidentaux en arabe. */
const numberFormat = (locale: string) => new Intl.NumberFormat(locale === "ar" ? "ar-TN-u-nu-latn" : "fr-FR");

async function translate(errors: ProposalErrors): Promise<ContributeState["errors"]> {
  const [t, locale] = await Promise.all([getTranslations("contribute.errors"), getLocale()]);
  const format = numberFormat(locale);
  const out: ContributeState["errors"] = {};
  for (const [field, error] of Object.entries(errors) as [ProposalField, NonNullable<ProposalErrors[ProposalField]>][]) {
    const values = Object.fromEntries(Object.entries(error.values ?? {}).map(([k, v]) => [k, format.format(Number(v))]));
    out[field] = t(error.code, values);
  }
  return out;
}

/**
 * Envoie une proposition (spec §8.3) : un ajout (`songId` nul) ou une correction. Le serveur refuse ce que
 * le formulaire aurait dû empêcher, dans cet ordre : pas de session (la connexion), adresse non vérifiée,
 * chanson retirée ou inconnue, correction déjà en attente, formulaire invalide, correction sans changement,
 * limite du jour (10 propositions, comptées seulement pour un envoi valide). Une proposition acceptée mène à
 * Mes contributions, où elle apparaît « En attente » sous la confirmation.
 */
export async function submitProposal(
  songId: string | null,
  previous: ContributeState,
  formData: FormData,
): Promise<ContributeState> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(songId ? `/contribuer/${songId}` : "/contribuer"));

  const fail = async (errors: ProposalErrors): Promise<ContributeState> => ({
    errors: await translate(errors),
    attempt: previous.attempt + 1,
  });

  if (!canContribute(user)) return fail({ form: { code: "emailNotVerified" } });

  // Une chanson se corrige par son UUID : un autre identifiant ne désigne aucune chanson.
  const song = songId ? await getSongById(songId) : null;
  if (songId && !song) return fail({ form: { code: "songMissing" } });
  if (song && (await hasPendingRevision(user.id, song.id))) return fail({ form: { code: "pendingExists" } });

  const result = validateProposal(proposalInputFromFormData(formData));
  if (!result.ok) return fail(result.errors);

  const artists = resolveArtists(result.draft.artists, await artistCandidates(result.draft.artists));
  const payload = { ...result.draft, artists };
  if (song && isSameAsSong(payload, song)) return fail({ form: { code: "unchanged" } });

  if (!(await allowRevision(user.id))) {
    return fail({ form: { code: "tooMany", values: { max: String(REVISION_LIMIT.limit) } } });
  }

  const created = await createRevision(db, { authorId: user.id, songId: song?.id ?? null, payload });
  if (!created.ok) return fail({ form: { code: created.error } });
  revalidatePath("/mes-contributions");
  redirect(contributionsHref({ sent: created.id }));
}
```

- [ ] **Étape 6 : brancher les pages.**

`src/app/contribuer/[songId]/page.tsx` : remplacer `proposalStore.hasPending(user.id, song.id)` par `await hasPendingRevision(user.id, song.id)`, importer `hasPendingRevision` de `@/lib/moderation/queries`, et retirer l'import de `proposalStore`.

`src/app/mes-contributions/page.tsx` : remplacer les imports de la maquette par `import { revisionsOf } from "@/lib/moderation/queries";` et `import { countByStatus } from "@/lib/moderation/queue";` ; `const proposals = await revisionsOf(user.id);`. Le reste de la page ne change pas : `RevisionSummary` a les champs que la page lit.

`src/components/contribute/ProposalCard.tsx` : le composant reçoit `proposal: RevisionSummary` et ne lit plus la chanson.
- imports : retirer `getSong` ; `import { formatProposalDate } from "@/lib/moderation/age";` ; `import type { RevisionSummary } from "@/types/proposal";` (et ne plus importer `Proposal`) ;
- `const displayArtists = (proposal: RevisionSummary): ArtistRef[] => …` (même corps) ;
- signature : `export async function ProposalCard({ proposal }: { proposal: RevisionSummary })` ;
- supprimer `const song = proposal.songId ? await getSong(proposal.songId) : undefined;` ;
- le lien final devient `{proposal.songId && proposal.songPublished ? (<Link href={`/chanson/${proposal.songId}`} … >…</Link>) : null}`, avec le même contenu.

`src/app/moi/page.tsx` : `import { pendingRevisionCountOf } from "@/lib/moderation/queries";` à la place de `pendingContributionsOf`, et `const pendingContributions = await pendingRevisionCountOf(user.id);`. Supprimer `src/mocks/account.ts`.

- [ ] **Étape 7 : relancer les tests et vérifier.** Lancer `pnpm test`, `pnpm test:integration`, `pnpm typecheck` et `pnpm lint`. Attendu : PASS (les tests de messages exigent les deux nouvelles clés dans les deux langues, et le lexique les vérifie). Puis, avec `pnpm dev`, en Leïla :
- proposer une chanson : la page « Mes contributions » s'ouvre avec la confirmation « يعيشك » et la proposition « En attente » ; la pastille de `/moi` passe à « 1 en attente » (les trois propositions de démonstration de Leïla seront en base à la tâche 6) ;
- proposer une correction depuis une fiche : un second envoi sur la même chanson affiche le message « Votre correction attend déjà sa relecture ».

- [ ] **Étape 8 : commit.**

```bash
git add src messages tests
git commit -m "feat(contribute): send proposals to the database, with the daily limit"
```

---

### Tâche 6 : file de modération et décisions sur les propositions

**Fichiers :**
- Créer : `scripts/demo/demoRevisions.ts`
- Modifier : `src/app/moderation/page.tsx`, `src/app/moderation/[revisionId]/page.tsx`, `src/components/moderation/parts.tsx`, `src/app/actions/moderation.ts` (`reviewProposal`), `src/lib/moderation/queue.ts` (`nextInQueue`), `src/lib/moderation/queries.ts`, `src/app/moderation/signalements/page.tsx` et `src/app/moderation/signalements/[id]/page.tsx` (lectures de la maquette, adaptées), `src/mocks/moderation.ts`, `src/app/moi/page.tsx`, `scripts/seed-demo.ts`
- Supprimer : `src/mocks/proposals.ts`, `src/mocks/moderationSeed.ts`, `tests/unit/contribution/store.test.ts`, `tests/unit/moderation/proposalStore.test.ts`
- Test : `tests/integration/moderationActions.test.ts` ; modifier `tests/unit/moderation/queue.test.ts`

**Interfaces :**
- Consomme : `pendingRevisions`, `getRevision`, `moderationCounts` (tâche 2) ; `approveRevision`, `rejectRevision` (tâches 2 et 3) ; `canApproveRevision` (tâche 2) ; `checkReview` (`mayApprove`, tâche 2) ; `songLabelsOf` (plan 2).
- Produit : `moderationQueueSize(): Promise<number>` dans `lib/moderation/queries.ts` (la pastille « N à relire » de `/moi`) ; `personLabel(name: string | null): Promise<string>` ; `nextInQueue(queue, current, compare)` accepte un repère d'un autre type que les éléments de la file.
- Retiré : `proposalStore`, `moderationSeedProposals`, `pendingProposals` et `moderationQueueSize` de la maquette.

Entre cette tâche et la suivante, le sous-onglet « Signalements » lit déjà le compteur de la base (zéro) alors que sa liste lit encore la maquette : c'est attendu.

- [ ] **Étape 1 : garder les données de démonstration.** Avant de supprimer `src/mocks/proposals.ts` et `src/mocks/moderationSeed.ts`, en reprendre les propositions dans la base de démonstration. Créer `scripts/demo/demoRevisions.ts` :

```ts
import { getSongById } from "@/lib/catalog/queries";
import type { Song } from "@/types/catalog";
import type { ProposalPayload, ProposalStatus } from "@/types/proposal";

/**
 * Propositions de démonstration reprises de la maquette : les trois de Leïla (une de chaque statut) et quatre
 * en attente d'autres contributeurs, pour la file de modération. Importé par `pnpm seed:demo`, jamais par
 * l'application. Les corrections partent des chansons telles que la base les a (UUID des artistes compris).
 * Les paroles sont inventées, comme le reste des données de démonstration.
 */
export interface DemoRevision {
  /** Clé de la personne (`DEMO_PEOPLE`). */
  author: string;
  /** Identifiant fictif de la chanson corrigée (`s-sidi-mansour`), ou `null` pour un ajout. */
  song: string | null;
  payload: ProposalPayload;
  status: ProposalStatus;
  /** Clé de la personne qui a relu, pour une proposition approuvée ou rejetée. */
  reviewer?: string;
  reviewNote?: string;
  /** ISO 8601. */
  createdAt: string;
  reviewedAt?: string;
}

export async function demoRevisions(songIds: ReadonlyMap<string, string>): Promise<DemoRevision[]> {
  const read = async (ref: string): Promise<Song> => {
    const song = await getSongById(songIds.get(ref) ?? "");
    if (!song) throw new Error(`Chanson de démonstration introuvable : ${ref}`);
    return song;
  };
  const artistOf = async (ref: string) => {
    const { id, nameAr, nameLatin } = (await read(ref)).artists[0];
    return { id, nameAr, nameLatin };
  };
  /** La chanson telle quelle, avec les changements proposés. */
  const correction = async (ref: string, change: Partial<ProposalPayload>): Promise<ProposalPayload> => {
    const song = await read(ref);
    return {
      titleAr: song.titleAr,
      titleLatin: song.titleLatin,
      artists: song.artists.map(({ id, nameAr, nameLatin }) => ({ id, nameAr, nameLatin })),
      lyrics: song.lyrics,
      lyricsTranslit: song.lyricsTranslit,
      dialect: song.dialect,
      ...change,
    };
  };
  const jouini = await artistOf("s-ya-lella");
  const saber = await artistOf("s-sidi-mansour");

  return [
    {
      author: "leila",
      song: null,
      payload: {
        titleAr: "لاموني اللي غاروا مني",
        titleLatin: "Lamouni Elli Gharou Menni",
        artists: [jouini],
        lyrics: `قالوا عليّ كلام كثير
وأنا نغنّي ونسامح
والليل يسمع غنايتي
والقلب ديما فرحان`,
        lyricsTranslit: null,
        dialect: "tn",
      },
      status: "pending",
      createdAt: "2026-11-18T20:15:00Z",
    },
    {
      author: "leila",
      song: "s-ya-lella",
      payload: await correction("s-ya-lella", {
        lyricsTranslit: `ya lella ghannili
ghannili ghnaya helwa
khalli ed-dar tdhawi
wel a7bab yetlammou

ya lella ya lella
el lila lilet fra7`,
      }),
      status: "approved",
      reviewer: "rania",
      createdAt: "2026-11-08T18:40:00Z",
      reviewedAt: "2026-11-10T09:05:00Z",
    },
    {
      author: "leila",
      song: null,
      payload: {
        titleAr: "سيدي منصور",
        titleLatin: "Sidi Mansour",
        artists: [saber],
        lyrics: `يا ليل طوّل شوية
خلّي الغناية تكمّل`,
        lyricsTranslit: null,
        dialect: "tn",
      },
      status: "rejected",
      reviewer: "rania",
      reviewNote:
        "Cette chanson est déjà dans Ghnaya. Pour la compléter, ouvrez sa fiche et touchez « Proposer une correction ».",
      createdAt: "2026-11-03T21:00:00Z",
      reviewedAt: "2026-11-04T08:30:00Z",
    },
    // Deux vers corrigés et un vers ajouté en fin de couplet.
    {
      author: "youssef",
      song: "s-sidi-mansour",
      payload: await correction("s-sidi-mansour", {
        lyrics: `يا ليل طوّل شوية
خلّي الغناية تكمّل
نغنّيو مع بعضنا
والقلب فرحان ومتهلّل
والدار ضاوية بينا

يا قمر ضوّي علينا
والنجوم تسهر معانا`,
      }),
      status: "pending",
      createdAt: "2026-11-12T19:30:00Z",
    },
    // Titre latin corrigé, un vers remplacé et un couplet ajouté.
    {
      author: "amira",
      song: "s-taht-el-yasmina",
      payload: await correction("s-taht-el-yasmina", {
        titleLatin: "Taht el Yasmina fel Lil",
        lyrics: `والريح تجيب الريحة
من الجنينة للدار
نغنّيو للّي غايب
والكلمة تمشي صحيحة

يا ياسمينة يا بيضا
خلّي الليل يطول شوية

نغنّي ونفرح سوا
والصبح مازال بعيد`,
      }),
      status: "pending",
      createdAt: "2026-11-14T08:05:00Z",
    },
    // Ajout d'une chanson du répertoire andalou, avec un artiste nouveau et une translittération.
    {
      author: "karim",
      song: null,
      payload: {
        titleAr: "لمّا بدا يتثنّى",
        titleLatin: "Lamma Bada Yatathanna",
        artists: [{ id: null, nameAr: "تراث أندلسي", nameLatin: "Répertoire andalou" }],
        lyrics: `يا نسيم الليل سلّم
على الحبايب في الدار
قول لهم القلب يغنّي
والشوق ما عندو قرار

يا نسيم الليل عاود
خلّي الغناية تدور`,
        lyricsTranslit: `ya nassim el lil sallem
3la el 7bayeb fi ed-dar
goul lhom el galb yghanni
wech-chouq ma 3andou qrar

ya nassim el lil 3awed
khalli el ghnaya tdour`,
        dialect: "maghreb_other",
      },
      status: "pending",
      createdAt: "2026-11-15T21:45:00Z",
    },
    // Seulement un titre latin, absent jusqu'ici : paroles inchangées.
    {
      author: "hedi",
      song: "s-enta-omri",
      payload: await correction("s-enta-omri", { titleLatin: "Enta Omri" }),
      status: "pending",
      createdAt: "2026-11-17T13:20:00Z",
    },
  ];
}
```

Dans `scripts/seed-demo.ts` :
- imports : ajouter `songRevisions` à celui de `@/lib/db/schema`, et `import { demoRevisions } from "./demo/demoRevisions";` ;
- juste après `const songIds = await seedFixtures(db);` : `const revisions = await demoRevisions(songIds);` ;
- dans la transaction, **avant** `await tx.delete(users)…`, retirer les propositions des comptes de démonstration, que `ON DELETE SET NULL` laisserait sans auteur à chaque relance :

```ts
    const previous = await tx
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.email, DEMO_PEOPLE.map((p) => p.email)));
    if (previous.length > 0) {
      await tx.delete(songRevisions).where(inArray(songRevisions.authorId, previous.map((u) => u.id)));
    }
```

- après la boucle qui crée les comptes (une fois `people` rempli) :

```ts
    await tx.insert(songRevisions).values(
      revisions.map((r) => ({
        authorId: people.get(r.author)!,
        songId: r.song ? songIds.get(r.song)! : null,
        payload: r.payload,
        rightsDeclared: true,
        status: r.status,
        reviewerId: r.reviewer ? people.get(r.reviewer)! : null,
        reviewNote: r.reviewNote ?? null,
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : null,
        createdAt: new Date(r.createdAt),
      })),
    );
```

- le message final cite `${revisions.length} propositions`.

- [ ] **Étape 2 : écrire les tests, qui doivent échouer.**

`tests/unit/moderation/queue.test.ts`, à la fin du `describe` de `nextInQueue` (ou en dessous) :

```ts
describe("nextInQueue, avec un repère d'un autre type que la file", () => {
  it("compare une proposition lue en entier à la file des résumés", () => {
    const queue = [
      { id: "b", createdAt: "2026-11-02" },
      { id: "c", createdAt: "2026-11-03" },
    ];
    const current = { id: "a", createdAt: "2026-11-01", payload: { lyrics: "سطر" } };
    expect(nextInQueue(queue, current, compareProposals)?.id).toBe("b");
  });
});
```

`tests/integration/moderationActions.test.ts` :

```ts
// Plan 3, tâche 6 : décider d'une proposition (spec §4.3, §8.4, §8.5 ; §12 : le serveur refuse).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { songRevisions, songs, users } from "@/lib/db/schema";
import { getRevision } from "@/lib/moderation/queries";
import { insertRevision, insertSong, insertUser, PAYLOAD } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  RedirectType: { push: "push", replace: "replace" },
}));
// Les messages sont rendus sous la forme de leur clé : le test lit le code d'erreur.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "fr",
}));

const { reviewProposal } = await import("@/app/actions/moderation");

const INITIAL = { error: null, attempt: 0 };

async function decide(revisionId: string, decision: "approve" | "reject", note = "") {
  const data = new FormData();
  data.set("decision", decision);
  data.set("note", note);
  try {
    return { state: await reviewProposal(revisionId, INITIAL, data) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND") return { notFound: true };
    const match = /^REDIRECT (.+)$/.exec(message);
    if (!match) throw error;
    return { redirect: match[1] };
  }
}

async function signIn(userId: string): Promise<void> {
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

const contributed = async () => (await db.select().from(songs).where(eq(songs.source, "contribution"))).length;
const at = (iso: string) => new Date(iso);

describe("décider d'une proposition", () => {
  let leila: { id: string };
  let rania: { id: string };

  beforeEach(async () => {
    await resetDb();
    leila = await insertUser({ name: "Leïla" });
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
    await signIn(rania.id);
  });

  it("renvoie un visiteur à la connexion et cache la modération à un membre", async () => {
    const id = await insertRevision({ authorId: leila.id });
    session.user = null;
    expect((await decide(id, "approve")).redirect).toMatch(/^\/connexion/);
    await signIn(leila.id);
    expect(await decide(id, "approve")).toEqual({ notFound: true });
    expect((await getRevision(id))?.status).toBe("pending");
    expect(await contributed()).toBe(0);
  });

  it("approuver publie la chanson, puis ouvre la proposition suivante, ou la file vide", async () => {
    const first = await insertRevision({ authorId: leila.id, createdAt: at("2026-11-10T10:00:00Z") });
    const second = await insertRevision({
      authorId: leila.id,
      payload: { ...PAYLOAD, titleLatin: "Seconde" },
      createdAt: at("2026-11-11T10:00:00Z"),
    });
    expect(await decide(first, "approve")).toEqual({ redirect: `/moderation/${second}?statut=approved` });
    expect(await decide(second, "approve")).toEqual({ redirect: "/moderation?statut=approved" });
    expect(await contributed()).toBe(2);
    expect(await getRevision(first)).toMatchObject({ status: "approved" });
  });

  it("un modérateur n'approuve pas sa propre proposition, mais peut la rejeter (spec §4.3)", async () => {
    const own = await insertRevision({ authorId: rania.id });
    expect(await decide(own, "approve")).toEqual({ state: { error: "ownProposal", attempt: 1 } });
    expect(await contributed()).toBe(0);
    expect((await getRevision(own))?.status).toBe("pending");
    expect(await decide(own, "reject", "Je la retire.")).toEqual({ redirect: "/moderation?statut=rejected" });
    expect((await getRevision(own))?.status).toBe("rejected");
  });

  it("un admin approuve les siennes, pour amorcer la plateforme", async () => {
    const admin = await insertUser({ globalRole: "admin" });
    await signIn(admin.id);
    const own = await insertRevision({ authorId: admin.id });
    expect(await decide(own, "approve")).toEqual({ redirect: "/moderation?statut=approved" });
    expect(await contributed()).toBe(1);
  });

  it("rejeter exige une note, que l'auteur lira ensuite", async () => {
    const id = await insertRevision({ authorId: leila.id });
    expect(await decide(id, "reject", "  ")).toEqual({ state: { error: "noteRequired", attempt: 1 } });
    expect(await decide(id, "reject", "Déjà dans Ghnaya.")).toEqual({ redirect: "/moderation?statut=rejected" });
    expect(await getRevision(id)).toMatchObject({ status: "rejected", reviewNote: "Déjà dans Ghnaya." });
  });

  it("refuse la correction d'une chanson retirée entre-temps, et une proposition déjà relue ou inconnue", async () => {
    const removed = await insertSong("Ya Lili");
    const correction = await insertRevision({ authorId: leila.id, songId: removed });
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    expect(await decide(correction, "approve")).toEqual({ state: { error: "songGone", attempt: 1 } });
    expect((await getRevision(correction))?.status).toBe("pending");

    const done = await insertRevision({ authorId: leila.id });
    await db
      .update(songRevisions)
      .set({ status: "rejected", reviewedAt: new Date(), reviewNote: "Doublon." })
      .where(eq(songRevisions.id, done));
    expect(await decide(done, "approve")).toEqual({ state: { error: "notPending", attempt: 1 } });
    expect(await decide("6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f", "approve")).toEqual({ notFound: true });
  });
});
```

- [ ] **Étape 3 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/moderation/queue.test.ts` et `pnpm exec vitest run --project integration tests/integration/moderationActions.test.ts`. Attendu : FAIL (la maquette est encore branchée, et `nextInQueue` n'accepte pas ce repère).

- [ ] **Étape 4 : `nextInQueue` et la taille des files.**

Dans `src/lib/moderation/queue.ts`, remplacer `nextInQueue` par (même corps, repère d'un autre type) :

```ts
export function nextInQueue<Item extends { id: string }, Current extends { id: string }>(
  queue: readonly Item[],
  current: Current,
  compare: (a: Item | Current, b: Item | Current) => number,
): Item | null {
  const others = queue.filter((item) => item.id !== current.id);
  return others.find((item) => compare(item, current) > 0) ?? others[0] ?? null;
}
```

Garder le commentaire existant de la fonction. Dans `src/lib/moderation/queries.ts`, ajouter :

```ts
/** Éléments en file, propositions et signalements : la pastille « N à relire » de la page Moi. */
export async function moderationQueueSize(): Promise<number> {
  const { proposals, reports } = await moderationCounts();
  return proposals + reports;
}
```

- [ ] **Étape 5 : l'action de décision.** Dans `src/app/actions/moderation.ts`, remplacer `reviewProposal` par la version ci-dessous, et ajuster les imports : retirer `songFromProposal`, `proposalStore`, `songStore`, `pendingProposals` ; ajouter `canApproveRevision`, `db`, `getRevision`, `pendingRevisions`, `approveRevision` et `rejectRevision`. `handleReport` ne change pas dans cette tâche.

```ts
/**
 * Approuver ou rejeter une proposition (spec §8.4, §8.5), puis ouvrir la suivante de la file, ou la
 * file vide « Plus rien à relire ». Les règles sont rejouées ici : une action serveur peut être appelée
 * directement. L'approbation écrit la chanson en une transaction (`lib/moderation/revisionWrite`).
 */
export async function reviewProposal(
  proposalId: string,
  previous: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const user = await requireModerator(`/moderation/${proposalId}`);
  const proposal = await getRevision(proposalId);
  if (!proposal) notFound();

  const t = await getTranslations("moderation.review.errors");
  const fail = (error: string): ModerationFormState => ({ error, attempt: previous.attempt + 1 });

  const decision = parseDecision(formData.get("decision"));
  if (!decision) return fail(t("notPending"));
  const checked = checkReview({
    proposal,
    mayApprove: canApproveRevision(user, proposal),
    decision,
    note: formData.get("note"),
  });
  if (!checked.ok) return fail(t(checked.error, { max: String(NOTE_MAX) }));

  const result =
    decision === "approve"
      ? await approveRevision(db, { revisionId: proposal.id, reviewerId: user.id, note: checked.note })
      : await rejectRevision(db, { revisionId: proposal.id, reviewerId: user.id, note: checked.note ?? "" });
  if (!result.ok) return fail(t(result.error === "notFound" ? "notPending" : result.error));
  revalidatePath("/", "layout");

  const next = nextInQueue(await pendingRevisions(), proposal, compareProposals);
  redirect(withStatus(next ? `/moderation/${next.id}` : "/moderation", decision === "approve" ? "approved" : "rejected"));
}
```

- [ ] **Étape 6 : brancher les écrans.**

`src/components/moderation/parts.tsx` :
- `ModerationTabs` lit la base : `const [t, counts] = await Promise.all([getTranslations("moderation.tabs"), moderationCounts()]);`, avec `{ n: String(counts.proposals) }` et `{ n: String(counts.reports) }` ; imports : `import { moderationCounts } from "@/lib/moderation/queries";` et `import { formatAge, formatProposalDate } from "@/lib/moderation/age";` ; retirer l'import de `@/mocks/moderation` (`openReports`, `pendingProposals`, `personName`) et celui de `formatProposalDate` de `@/mocks/proposals` ;
- `personLabel` reçoit un nom, et non plus un identifiant :

```tsx
/** Nom d'une personne ; « un compte supprimé » si son compte n'existe plus (spec §12, écart 1). */
export async function personLabel(name: string | null): Promise<string> {
  const t = await getTranslations("moderation");
  return name ?? t("unknownAuthor");
}
```

`src/app/moderation/page.tsx` : `const queue = await pendingRevisions();`, `const reportsWaiting = (await moderationCounts()).reports;` (imports de `@/lib/moderation/queries`, sans `@/mocks/moderation`), et `await personLabel(proposal.authorName)`.

`src/app/moderation/[revisionId]/page.tsx` :
- imports : `canApproveRevision` (`@/lib/auth/permissions`), `songLabelsOf` (`@/lib/catalog/queries`), `formatProposalDate` (`@/lib/moderation/age`), `getRevision` et `pendingRevisions` (`@/lib/moderation/queries`), `Revision` (`@/types/proposal`) ; retirer `getRemovedSong`, `pendingProposals`, `proposalStore` et `Proposal` ;
- `const displayArtists = (proposal: Revision): ArtistRef[] => …` et `ChangedFields({ proposal, song }: { proposal: Revision; song: Song })` ;
- la lecture :

```tsx
  const proposal = await getRevision(revisionId);
  if (!proposal) notFound();

  const [t, locale, done] = await Promise.all([
    getTranslations("moderation"),
    getLocale(),
    doneMessage((await searchParams).statut),
  ]);
  const queue = await pendingRevisions();
  const index = queue.findIndex((p) => p.id === proposal.id);
  const next = nextInQueue(queue, proposal, compareProposals);
  const isCorrection = proposal.songId !== null;
  const song = proposal.songId ? await getSong(proposal.songId) : undefined;
  const songRemoved =
    proposal.songId && !song ? (await songLabelsOf([proposal.songId])).get(proposal.songId)?.removed === true : false;
  const own = proposal.authorId === user.id;
```

- le bandeau de la chanson retirée : `{songRemoved ? <p …>{t("report.songRemoved")}</p> : null}` ;
- `await personLabel(proposal.authorName)` ;
- le formulaire : `<ReviewForm proposalId={proposal.id} canApprove={canApproveRevision(user, proposal)} />`.

`src/app/moi/page.tsx` : `moderationQueueSize` vient de `@/lib/moderation/queries` : `const moderationQueue = user.isModerator ? await moderationQueueSize() : 0;`.

Les deux pages de signalements lisent encore la maquette : `src/app/moderation/signalements/page.tsx` et `[id]/page.tsx` appellent `personLabel(report.reporterId)` et `personLabel(report.resolvedBy)`. Les remplacer par `personLabel(personName(report.reporterId))` et `personLabel(personName(report.resolvedBy))`, avec le commentaire `// MAQUETTE : retiré à la tâche 7`, et `personName` importé de `@/mocks/moderation`. `pendingProposals().length > 0` devient `(await moderationCounts()).proposals > 0`.

- [ ] **Étape 7 : retirer la maquette des propositions.** Dans `src/mocks/moderation.ts`, supprimer `pendingProposals`, `moderationQueueSize` et l'import de `CONTRIBUTOR_NAMES` (avec sa propagation dans `NAMES`) ; il ne reste que `openReports` et `personName`. Supprimer `src/mocks/proposals.ts`, `src/mocks/moderationSeed.ts`, `tests/unit/contribution/store.test.ts` et `tests/unit/moderation/proposalStore.test.ts`. Vérifier : `grep -rn "mocks/proposals\|moderationSeed\|proposalStore" src tests scripts` ne doit plus rien trouver.

- [ ] **Étape 8 : relancer les tests et vérifier.** Lancer `pnpm seed:demo` deux fois de suite (sans erreur, sans doublon : `SELECT count(*) FROM song_revisions` donne 7 les deux fois), puis `pnpm test`, `pnpm test:integration`, `pnpm typecheck` et `pnpm lint`. Attendu : PASS. Puis, avec `pnpm dev`, en Rania (modératrice, lien magique) :
- `/moderation` : cinq propositions en attente, de la plus ancienne (12/11) à la plus récente (18/11, celle de Leïla) ; `/moi` affiche « 5 à relire » (les signalements de la maquette ne sont plus comptés) ;
- ouvrir « Lamma Bada Yatathanna », approuver : le toast « Proposition approuvée » s'affiche sur la proposition suivante ; la chanson est trouvée par `/recherche?q=lamma+bada`, avec la source « Proposition » et l'artiste « Répertoire andalou » ;
- rejeter une correction sans note : le message « Écrivez une note… » s'affiche et la proposition reste en attente ;
- en Leïla : `/mes-contributions` montre la proposition refusée avec la note de Rania.

- [ ] **Étape 9 : commit.**

```bash
git add src scripts tests
git commit -m "feat(moderation): review queue and decisions on the database"
```

---

### Tâche 7 : signalements, retraits et rétablissement

**Fichiers :**
- Créer : `src/lib/moderation/reportWrite.ts`, `src/components/moderation/RestoreSongForm.tsx`, `scripts/demo/demoReports.ts`
- Modifier : `src/lib/moderation/queries.ts`, `src/lib/report/validate.ts`, `src/app/actions/report.ts`, `src/app/actions/moderation.ts` (`handleReport`, `restoreSongAction`), `src/app/moderation/signalements/page.tsx`, `src/app/moderation/signalements/[id]/page.tsx`, `src/components/moderation/parts.tsx`, `src/components/report/ReportForm.tsx`, `scripts/seed-demo.ts`, `messages/fr.json`, `messages/ar.json`
- Supprimer : `src/mocks/reports.ts`, `src/mocks/moderation.ts`, `src/mocks/songStore.ts`, `tests/unit/moderation/songStore.test.ts`
- Test : `tests/integration/reports.test.ts`, `tests/integration/reportActions.test.ts`

**Interfaces :**
- Consomme : `Report`, `REPORT_REASONS` (tâche 1) ; `allowReport` (tâche 2) ; `checkReportAction`, `statusAfter`, `parseReportAction` (`lib/moderation/review.ts`, inchangés) ; `songLabelsOf`, `ARTISTS_OF` (plans 1 et 2) ; `clientIp` (plan 1).
- Produit (`queries.ts`) : `openReports(): Promise<Report[]>` (droits d'auteur en tête, puis du plus ancien au plus récent), `treatedReports(limit?: number): Promise<Report[]>` (les 100 derniers traités ou classés), `getReport(id: string): Promise<Report | null>`.
- Produit (`reportWrite.ts`) : `createReport(db, input: { songId: string; reporterId: string | null; contactEmail: string | null; reason: ReportReason; details: string }): Promise<string>` ; `type ResolveAction = "remove" | "correct" | "dismiss"` ; `resolveReport(db, input: { reportId: string; resolverId: string; action: ResolveAction; note: string }): Promise<ResolveResult>` avec `type ResolveResult = { ok: true } | { ok: false; error: "notFound" | "notOpen" | "songGone" }` ; `restoreSong(db, songId: string): Promise<"restored" | "notRemoved">`.
- Produit : `restoreSongAction(reportId: string): Promise<void>` ; `reporterLabel(report): Promise<ReactNode>` (`parts.tsx`) ; le code d'erreur `tooMany` de `ReportErrorCode`.

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

`tests/integration/reports.test.ts` :

```ts
// Plan 3, tâche 7 : signalements, retrait doux et rétablissement (spec §9 ; §13, retrait doux).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteUserAccount } from "@/lib/account/write";
import { getSongById } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { getReport, openReports, treatedReports } from "@/lib/moderation/queries";
import { createReport, resolveReport, restoreSong } from "@/lib/moderation/reportWrite";
import { searchSongs } from "@/lib/search/searchSongs";
import { seedFixtures } from "../fixtures/seed";
import { insertReport, insertUser } from "./factories";
import { resetDb } from "./helpers";

const UNKNOWN = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";
const at = (iso: string) => new Date(iso);
const statusOf = async (songId: string) => (await db.select().from(songs).where(eq(songs.id, songId)))[0];

describe("signalements en base", () => {
  let ids = new Map<string, string>();
  let rania: { id: string };

  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
  });

  it("enregistre le signalement d'un visiteur (avec son adresse) et celui d'un membre", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = ids.get("s-ya-lili")!;
    const visitor = await createReport(db, {
      songId: song,
      reporterId: null,
      contactEmail: "droits@exemple-editions.com",
      reason: "copyright",
      details: "Nous représentons les ayants droit.",
    });
    const member = await createReport(db, {
      songId: song,
      reporterId: leila.id,
      contactEmail: null,
      reason: "wrong_lyrics",
      details: "Deux vers sont inversés.",
    });
    expect(await getReport(visitor)).toMatchObject({
      reporterId: null,
      reporterName: null,
      contactEmail: "droits@exemple-editions.com",
      reason: "copyright",
      status: "open",
      resolutionNote: null,
      song: { id: song, titleLatin: "Ya Lili", published: true, artists: [{ nameLatin: "Balti" }] },
    });
    expect(await getReport(member)).toMatchObject({ reporterId: leila.id, reporterName: "Leïla", contactEmail: null });
    expect(await getReport("pas-un-uuid")).toBeNull();
    expect(await getReport(UNKNOWN)).toBeNull();
  });

  it("file des signalements : droits d'auteur en tête, puis du plus ancien au plus récent (spec §9)", async () => {
    const song = ids.get("s-ya-lili")!;
    const oldSpam = await insertReport({ songId: song, reason: "spam", createdAt: at("2026-11-10T10:00:00Z") });
    const lateCopyright = await insertReport({ songId: song, reason: "copyright", createdAt: at("2026-11-18T10:00:00Z") });
    const wrong = await insertReport({ songId: song, reason: "wrong_lyrics", createdAt: at("2026-11-16T10:00:00Z") });
    const earlyCopyright = await insertReport({ songId: song, reason: "copyright", createdAt: at("2026-11-17T10:00:00Z") });
    expect((await openReports()).map((r) => r.id)).toEqual([earlyCopyright, lateCopyright, oldSpam, wrong]);
  });

  it("retirer la chanson : retrait doux, motif, protégée des imports ; plus cherchable ni lisible", async () => {
    const song = ids.get("s-sidi-mansour")!;
    const report = await insertReport({ songId: song, reason: "copyright" });
    expect(await resolveReport(db, { reportId: report, resolverId: rania.id, action: "remove", note: "Demande des ayants droit." })).toEqual({ ok: true });

    expect(await statusOf(song)).toMatchObject({ status: "removed", removedReason: "Demande des ayants droit.", importLocked: true });
    expect(await getSongById(song)).toBeNull();
    expect((await searchSongs("sidi mansour")).items.map((i) => i.id)).not.toContain(song);
    expect(await getReport(report)).toMatchObject({
      status: "resolved",
      resolutionNote: "Demande des ayants droit.",
      resolvedByName: "Rania",
      song: { id: song, published: false },
    });
    expect(await openReports()).toEqual([]);
    expect((await treatedReports()).map((r) => r.id)).toEqual([report]);
  });

  it("corriger ou classer sans suite ne retire rien", async () => {
    const song = ids.get("s-ya-lella")!;
    const toCorrect = await insertReport({ songId: song });
    const toDismiss = await insertReport({ songId: song, reason: "spam" });
    expect(await resolveReport(db, { reportId: toCorrect, resolverId: rania.id, action: "correct", note: "Je propose la correction." })).toEqual({ ok: true });
    expect(await resolveReport(db, { reportId: toDismiss, resolverId: rania.id, action: "dismiss", note: "Sans rapport." })).toEqual({ ok: true });
    expect((await statusOf(song)).status).toBe("published");
    expect(await getReport(toCorrect)).toMatchObject({ status: "resolved" });
    expect(await getReport(toDismiss)).toMatchObject({ status: "dismissed", resolutionNote: "Sans rapport." });
  });

  it("refuse un signalement déjà traité ou inconnu, et retirer une chanson déjà retirée", async () => {
    const song = ids.get("s-habaytak")!;
    const first = await insertReport({ songId: song });
    const second = await insertReport({ songId: song });
    await resolveReport(db, { reportId: first, resolverId: rania.id, action: "remove", note: "Retrait." });
    expect(await resolveReport(db, { reportId: first, resolverId: rania.id, action: "dismiss", note: "Encore." })).toEqual({ ok: false, error: "notOpen" });
    expect(await resolveReport(db, { reportId: second, resolverId: rania.id, action: "remove", note: "Aussi." })).toEqual({ ok: false, error: "songGone" });
    expect(await resolveReport(db, { reportId: second, resolverId: rania.id, action: "correct", note: "Aussi." })).toEqual({ ok: false, error: "songGone" });
    expect(await resolveReport(db, { reportId: second, resolverId: rania.id, action: "dismiss", note: "Déjà retirée." })).toEqual({ ok: true });
    expect(await resolveReport(db, { reportId: UNKNOWN, resolverId: rania.id, action: "dismiss", note: "x" })).toEqual({ ok: false, error: "notFound" });
  });

  it("deux modérateurs qui traitent le même signalement en même temps : un seul l'emporte", async () => {
    const report = await insertReport({ songId: ids.get("s-ala-nar")! });
    const other = await insertUser({ globalRole: "moderator" });
    const results = await Promise.all([
      resolveReport(db, { reportId: report, resolverId: rania.id, action: "remove", note: "A." }),
      resolveReport(db, { reportId: report, resolverId: other.id, action: "remove", note: "B." }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, error: "notOpen" }]);
  });

  it("rétablit une chanson retirée : cherchable et lisible de nouveau, motif effacé", async () => {
    const song = ids.get("s-sidi-mansour")!;
    const report = await insertReport({ songId: song });
    await resolveReport(db, { reportId: report, resolverId: rania.id, action: "remove", note: "Demande des ayants droit." });
    expect(await restoreSong(db, song)).toBe("restored");
    expect(await statusOf(song)).toMatchObject({ status: "published", removedReason: null });
    expect((await searchSongs("sidi mansour")).items.map((i) => i.id)).toContain(song);
    expect(await restoreSong(db, song)).toBe("notRemoved");
  });

  it("garde le signalement d'un compte supprimé, sans auteur, et lit les 100 derniers signalements traités", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = ids.get("s-ya-lili")!;
    const report = await insertReport({ songId: song, reporterId: leila.id });
    await resolveReport(db, { reportId: report, resolverId: rania.id, action: "dismiss", note: "Sans suite." });
    expect(await deleteUserAccount(db, leila.id)).toEqual({ ok: true });
    expect(await getReport(report)).toMatchObject({ reporterId: null, reporterName: null, contactEmail: null });

    for (let i = 0; i < 101; i += 1) {
      const id = await insertReport({ songId: song, createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)) });
      await resolveReport(db, { reportId: id, resolverId: rania.id, action: "dismiss", note: `Note ${i}.` });
    }
    expect(await treatedReports()).toHaveLength(100);
  });
});
```

`tests/integration/reportActions.test.ts` :

```ts
// Plan 3, tâche 7 : les actions « Signaler », « Traiter un signalement » et « Rétablir » (spec §9, §12).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { db } from "@/lib/db/client";
import { reports, songs, users } from "@/lib/db/schema";
import { REPORT_LIMIT } from "@/lib/moderation/limits";
import { seedFixtures } from "../fixtures/seed";
import { insertReport, insertUser } from "./factories";
import { resetDb } from "./helpers";

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

vi.mock("@/lib/session", () => ({ getCurrentUser: async () => session.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  RedirectType: { push: "push", replace: "replace" },
}));
// Les messages sont rendus sous la forme de leur clé : le test lit le code d'erreur.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => Object.assign((key: string) => key, { markup: (key: string) => key }),
  getLocale: async () => "fr",
}));

const { submitReport } = await import("@/app/actions/report");
const { handleReport, restoreSongAction } = await import("@/app/actions/moderation");

const EDITING = { status: "editing" as const, errors: {}, attempt: 0 };
const NOTE_STATE = { error: null, attempt: 0 };

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const report = (over: Record<string, string> = {}) =>
  form({ reason: "wrong_lyrics", details: "Deux vers sont inversés.", email: "visiteur@example.com", ...over });

/** Soit la valeur renvoyée, soit l'adresse de la redirection, soit « introuvable ». */
async function run<T>(call: () => Promise<T>): Promise<{ value: T } | { redirect: string } | { notFound: true }> {
  try {
    return { value: await call() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOT_FOUND") return { notFound: true };
    const match = /^REDIRECT (.+)$/.exec(message);
    if (!match) throw error;
    return { redirect: match[1] };
  }
}

async function signIn(userId: string | null): Promise<void> {
  if (!userId) {
    session.user = null;
    return;
  }
  const [row] = await db.select().from(users).where(eq(users.id, userId));
  session.user = toCurrentUser(row, []);
}

const allReports = () => db.select().from(reports).orderBy(reports.createdAt);
const songStatus = async (id: string) => (await db.select().from(songs).where(eq(songs.id, id)))[0].status;

describe("signaler une chanson", () => {
  let ids = new Map<string, string>();
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    await signIn(null);
  });

  it("un visiteur laisse son adresse ; un membre signale avec son compte, sans adresse", async () => {
    const song = ids.get("s-ya-lili")!;
    expect(await run(() => submitReport(song, EDITING, report({ email: "" })))).toMatchObject({
      value: { status: "editing", errors: { email: "emailMissing" } },
    });
    expect(await run(() => submitReport(song, EDITING, report()))).toEqual({
      value: { status: "sent", sentTo: "visiteur@example.com" },
    });
    await signIn((await insertUser()).id);
    expect(await run(() => submitReport(song, EDITING, report({ email: "ignoree@example.com" })))).toEqual({
      value: { status: "sent", sentTo: null },
    });
    const rows = await allReports();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => [r.contactEmail, r.reporterId === null])).toEqual([
      ["visiteur@example.com", true],
      [null, false],
    ]);
  });

  it("refuse une chanson retirée ou inconnue", async () => {
    const removed = ids.get("s-habaytak")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    for (const song of [removed, "s-sidi-mansour"]) {
      expect(await run(() => submitReport(song, EDITING, report()))).toMatchObject({
        value: { errors: { form: "songMissing" } },
      });
    }
    expect(await allReports()).toHaveLength(0);
  });

  it(`refuse le ${REPORT_LIMIT.limit + 1}e signalement du jour depuis la même adresse IP (spec §12)`, async () => {
    const song = ids.get("s-ya-lili")!;
    for (let i = 0; i < REPORT_LIMIT.limit; i += 1) {
      expect(await run(() => submitReport(song, EDITING, report()))).toMatchObject({ value: { status: "sent" } });
    }
    expect(await run(() => submitReport(song, EDITING, report()))).toMatchObject({
      value: { status: "editing", errors: { form: "tooMany" } },
    });
    expect(await allReports()).toHaveLength(REPORT_LIMIT.limit);
  });
});

describe("traiter un signalement", () => {
  let ids = new Map<string, string>();
  let rania: { id: string };
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    rania = await insertUser({ name: "Rania", globalRole: "moderator" });
    await signIn(rania.id);
  });

  const handle = (id: string, action: string, note = "Retrait demandé par les ayants droit.") =>
    run(() => handleReport(id, NOTE_STATE, form({ action, note })));

  it("réserve le traitement aux modérateurs", async () => {
    const id = await insertReport({ songId: ids.get("s-ya-lili")! });
    await signIn(null);
    expect(await handle(id, "remove")).toMatchObject({ redirect: expect.stringMatching(/^\/connexion/) });
    await signIn((await insertUser()).id);
    expect(await handle(id, "remove")).toEqual({ notFound: true });
    expect(await songStatus(ids.get("s-ya-lili")!)).toBe("published");
  });

  it("retirer la chanson : retrait doux, puis le signalement suivant ou la file vide", async () => {
    const first = await insertReport({ songId: ids.get("s-ya-lili")!, reason: "copyright", createdAt: new Date("2026-11-10T10:00:00Z") });
    const second = await insertReport({ songId: ids.get("s-habaytak")!, createdAt: new Date("2026-11-11T10:00:00Z") });
    expect(await handle(first, "remove")).toEqual({ redirect: `/moderation/signalements/${second}?statut=removed` });
    expect(await songStatus(ids.get("s-ya-lili")!)).toBe("removed");
    expect(await handle(second, "dismiss", "Sans suite.")).toEqual({ redirect: "/moderation/signalements?statut=dismissed" });
    expect(await songStatus(ids.get("s-habaytak")!)).toBe("published");
  });

  it("exige une note, et refuse un signalement déjà traité", async () => {
    const id = await insertReport({ songId: ids.get("s-ya-lili")! });
    expect(await handle(id, "remove", "  ")).toEqual({ value: { error: "noteRequired", attempt: 1 } });
    await handle(id, "dismiss", "Sans suite.");
    expect(await handle(id, "remove")).toEqual({ value: { error: "notOpen", attempt: 1 } });
  });

  it("corriger ouvre le formulaire de correction de la chanson", async () => {
    const song = ids.get("s-ya-lella")!;
    const id = await insertReport({ songId: song });
    expect(await handle(id, "correct", "Je propose la correction.")).toEqual({ redirect: `/contribuer/${song}` });
    expect(await songStatus(song)).toBe("published");
  });

  it("rétablir une chanson retirée, par son signalement, et par un modérateur seulement", async () => {
    const song = ids.get("s-ala-nar")!;
    const id = await insertReport({ songId: song, reason: "copyright" });
    await handle(id, "remove");
    await signIn((await insertUser()).id);
    expect(await run(() => restoreSongAction(id))).toEqual({ notFound: true });
    expect(await songStatus(song)).toBe("removed");
    await signIn(rania.id);
    expect(await run(() => restoreSongAction(id))).toEqual({ redirect: `/moderation/signalements/${id}?statut=restored` });
    expect(await songStatus(song)).toBe("published");
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm exec vitest run --project integration tests/integration/reports.test.ts tests/integration/reportActions.test.ts`. Attendu : FAIL, modules introuvables.

- [ ] **Étape 3 : les lectures.** Dans `src/lib/moderation/queries.ts`, ajouter les imports `import { ARTISTS_OF } from "@/lib/catalog/queries";` (à fusionner avec l'import existant de `isUuid`) et `import type { Report, ReportReason, ReportStatus } from "@/types/report";`, puis :

```ts
type ReportRow = {
  id: string;
  reporter_id: string | null;
  reporter_name: string | null;
  contact_email: string | null;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  resolution_note: string | null;
  resolved_by_name: string | null;
  created_at: Date | string;
  song_id: string;
  title_ar: string | null;
  title_latin: string | null;
  song_status: "published" | "removed";
  artists: Report["song"]["artists"];
};

async function reportsWhere(where: SQL, order: SQL, limit?: number): Promise<Report[]> {
  const res = await db.execute<ReportRow>(sql`
    SELECT r.id, r.reporter_id, ur.name AS reporter_name, r.contact_email, r.reason, r.details, r.status,
      r.resolution_note, uv.name AS resolved_by_name, r.created_at,
      s.id AS song_id, s.title_ar, s.title_latin, s.status AS song_status, ${ARTISTS_OF("s")} AS artists
    FROM reports r
    JOIN songs s ON s.id = r.song_id
    LEFT JOIN users ur ON ur.id = r.reporter_id
    LEFT JOIN users uv ON uv.id = r.resolved_by
    WHERE ${where}
    ORDER BY ${order}
    ${limit === undefined ? sql`` : sql`LIMIT ${limit}`}`);
  return res.rows.map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    reporterName: r.reporter_name,
    contactEmail: r.contact_email,
    reason: r.reason,
    details: r.details,
    status: r.status,
    resolutionNote: r.resolution_note,
    resolvedByName: r.resolved_by_name,
    createdAt: iso(r.created_at),
    song: {
      id: r.song_id,
      titleAr: r.title_ar,
      titleLatin: r.title_latin,
      artists: r.artists,
      published: r.song_status === "published",
    },
  }));
}

/** File des signalements : droits d'auteur en tête, puis du plus ancien au plus récent (spec §9). */
export const openReports = (): Promise<Report[]> =>
  reportsWhere(sql`r.status = 'open'`, sql`(r.reason = 'copyright') DESC, r.created_at ASC, r.id`);

/** Les derniers signalements traités ou classés (les 100 derniers), du plus récent au plus ancien. */
export const treatedReports = (limit = 100): Promise<Report[]> =>
  reportsWhere(sql`r.status <> 'open'`, sql`r.created_at DESC, r.id`, limit);

/** Un signalement, avec sa chanson (publiée ou retirée). `null` si l'identifiant est invalide ou inconnu. */
export async function getReport(id: string): Promise<Report | null> {
  if (!isUuid(id)) return null;
  return (await reportsWhere(sql`r.id = ${id}`, sql`r.id`))[0] ?? null;
}
```

- [ ] **Étape 4 : les écritures.** `src/lib/moderation/reportWrite.ts` :

```ts
import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { reports } from "@/lib/db/schema";
import { statusAfter } from "@/lib/moderation/review";
import type { ReportReason, ReportStatus } from "@/types/report";

/**
 * Écritures des signalements et des retraits (spec §9). L'appelant (Server Action) a vérifié la session, le
 * droit (`canModerate`), la limite du jour et les entrées (`validateReport`, `checkReportAction`).
 */

export async function createReport(
  db: Db,
  input: { songId: string; reporterId: string | null; contactEmail: string | null; reason: ReportReason; details: string },
): Promise<string> {
  const [row] = await db
    .insert(reports)
    .values({
      songId: input.songId,
      reporterId: input.reporterId,
      contactEmail: input.contactEmail,
      reason: input.reason,
      details: input.details,
    })
    .returning({ id: reports.id });
  return row.id;
}

export type ResolveAction = "remove" | "correct" | "dismiss";
export type ResolveResult = { ok: true } | { ok: false; error: "notFound" | "notOpen" | "songGone" };

/**
 * Traite un signalement ouvert, en une transaction. Verrous : le signalement, puis la chanson.
 *  - `remove` : retrait doux (`status = removed`), la note en est le motif ; `import_locked` empêche un nouvel
 *    import de réécrire une chanson retirée pour ses droits ;
 *  - `correct` : le signalement est traité, la chanson reste publiée (le modérateur propose ensuite sa correction) ;
 *  - `dismiss` : classé sans suite, y compris pour une chanson déjà retirée.
 * `remove` et `correct` refusent une chanson déjà retirée (`songGone`) : rien n'est écrit.
 */
export function resolveReport(
  db: Db,
  input: { reportId: string; resolverId: string; action: ResolveAction; note: string },
): Promise<ResolveResult> {
  return db.transaction(async (tx): Promise<ResolveResult> => {
    const found = await tx.execute<{ song_id: string; status: ReportStatus }>(sql`
      SELECT song_id, status FROM reports WHERE id = ${input.reportId} FOR UPDATE`);
    const report = found.rows[0];
    if (!report) return { ok: false, error: "notFound" };
    if (report.status !== "open") return { ok: false, error: "notOpen" };

    if (input.action !== "dismiss") {
      const song = await tx.execute<{ status: "published" | "removed" }>(sql`
        SELECT status FROM songs WHERE id = ${report.song_id} FOR UPDATE`);
      if (song.rows[0]?.status !== "published") return { ok: false, error: "songGone" };
      if (input.action === "remove") {
        await tx.execute(sql`
          UPDATE songs SET status = 'removed', removed_reason = ${input.note}, import_locked = true, updated_at = now()
          WHERE id = ${report.song_id}`);
      }
    }
    await tx.execute(sql`
      UPDATE reports
      SET status = ${statusAfter(input.action)}, resolution_note = ${input.note}, resolved_by = ${input.resolverId},
        updated_at = now()
      WHERE id = ${input.reportId}`);
    return { ok: true };
  });
}

/** Annule un retrait doux (spec §9, « Réversibilité ») : la chanson est de nouveau publiée, son motif effacé. */
export async function restoreSong(db: Db, songId: string): Promise<"restored" | "notRemoved"> {
  const res = await db.execute(sql`
    UPDATE songs SET status = 'published', removed_reason = NULL, updated_at = now()
    WHERE id = ${songId} AND status = 'removed'
    RETURNING id`);
  return res.rows.length > 0 ? "restored" : "notRemoved";
}
```

- [ ] **Étape 5 : le formulaire de signalement.**

`src/lib/report/validate.ts` : remplacer l'import de la maquette par `import { REPORT_REASONS, type ReportReason } from "@/types/report";` et ajouter `| "tooMany"` à `ReportErrorCode`. `src/components/report/ReportForm.tsx` : `import { REPORT_REASONS, type ReportReason } from "@/types/report";`.

`messages/fr.json`, dans `reportForm.errors` : `"tooMany": "Vous avez envoyé trop de signalements aujourd'hui. Réessayez demain."` ; `messages/ar.json` : `"tooMany": "أرسلتم عددًا كبيرًا من الإبلاغات اليوم. أعيدوا المحاولة غدًا."`.

`src/app/actions/report.ts` : retirer les imports de `getSong` (`@/lib/catalog/read`) et d'`addReport` (la maquette), ajouter les imports ci-dessous à ceux qui restent (`next-intl/server`, `@/lib/report/validate`, `@/lib/session`, `@/lib/text/isolate`), et remplacer `submitReport` (`ReportState`, `numberFormat` et `translate` ne changent pas) :

```ts
import { headers } from "next/headers";
import { getSongById } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { allowReport } from "@/lib/moderation/limits";
import { createReport } from "@/lib/moderation/reportWrite";
import { clientIp } from "@/lib/ratelimit/clientIp";
```

```ts
/**
 * Envoie un signalement (spec §9) : ouvert à tous. Un visiteur laisse une adresse e-mail ; pour un membre, le
 * compte suffit (l'auteur vient de la session, jamais du formulaire). Le serveur rejoue la validation, puis
 * applique la limite de 10 signalements par jour et par adresse IP, comptés pour un envoi valide seulement.
 */
export async function submitReport(songId: string, previous: ReportState, formData: FormData): Promise<ReportState> {
  const attempt = previous.status === "editing" ? previous.attempt + 1 : 1;
  const fail = async (errors: ReportErrors): Promise<ReportState> => ({
    status: "editing",
    errors: await translate(errors),
    attempt,
  });

  const song = await getSongById(songId);
  if (!song) return fail({ form: { code: "songMissing" } });

  const user = await getCurrentUser();
  const result = validateReport(reportInputFromFormData(formData), { emailRequired: !user });
  if (!result.ok) return fail(result.errors);
  if (!(await allowReport(clientIp(await headers())))) return fail({ form: { code: "tooMany" } });

  await createReport(db, { songId: song.id, reporterId: user?.id ?? null, ...result.report });
  return { status: "sent", sentTo: result.report.contactEmail };
}
```

- [ ] **Étape 6 : le traitement et le rétablissement.**

`messages/fr.json`, dans `moderation.done` : `"restored": "Chanson rétablie"` ; dans `moderation.report`, un bloc `restore` :

```json
"restore": {
  "title": "Rétablir la chanson",
  "body": "Cette chanson est retirée. La rétablir la rend de nouveau cherchable et lisible, et elle revient dans les playlists où elle était.",
  "button": "Rétablir la chanson"
}
```

`messages/ar.json`, dans `moderation.done` : `"restored": "تمّت إعادة الأغنية"` ; dans `moderation.report` :

```json
"restore": {
  "title": "إعادة الأغنية",
  "body": "هذه الأغنية مسحوبة. إعادتها تُظهرها من جديد في البحث وفي القراءة، وتعود إلى القوائم التي كانت فيها.",
  "button": "إعادة الأغنية"
}
```

`src/components/moderation/RestoreSongForm.tsx` :

```tsx
import { Eye } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { restoreSongAction } from "@/app/actions/moderation";
import { BUTTON_SECONDARY } from "@/components/ui/styles";

/**
 * Rétablir une chanson retirée (spec §9, « Réversibilité »), depuis le signalement qui a mené au retrait. Un
 * simple formulaire : l'action serveur vérifie elle-même le droit de modérer.
 */
export async function RestoreSongForm({ reportId }: { reportId: string }) {
  const t = await getTranslations("moderation.report.restore");
  return (
    <section aria-labelledby="retablir" className="rounded-lg border border-line-subtle bg-card p-4">
      <h2 id="retablir" className="text-lg font-medium">
        {t("title")}
      </h2>
      <p className="mt-1 text-ink-2">{t("body")}</p>
      <form action={restoreSongAction.bind(null, reportId)} className="mt-4">
        <button type="submit" className={`${BUTTON_SECONDARY} w-full sm:w-auto`}>
          <Eye aria-hidden="true" className="size-4" />
          {t("button")}
        </button>
      </form>
    </section>
  );
}
```

`src/app/actions/moderation.ts` : `export type DoneStatus = "approved" | "rejected" | "removed" | "dismissed" | "restored";`, les imports `getReport`, `openReports` (`@/lib/moderation/queries`), `resolveReport`, `restoreSong` (`@/lib/moderation/reportWrite`), et le retrait de tout import de la maquette (`@/mocks/*`, `getSong`). Remplacer `handleReport` et ajouter `restoreSongAction` :

```ts
/**
 * Traiter un signalement (spec §9) : retirer la chanson (retrait doux), la corriger (le formulaire de
 * correction s'ouvre) ou classer sans suite, toujours avec une note ; puis ouvrir le suivant.
 */
export async function handleReport(
  reportId: string,
  previous: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const user = await requireModerator(`/moderation/signalements/${reportId}`);
  const report = await getReport(reportId);
  if (!report) notFound();

  const t = await getTranslations("moderation.report.errors");
  const fail = (error: string): ModerationFormState => ({ error, attempt: previous.attempt + 1 });

  const action = parseReportAction(formData.get("action"));
  if (!action) return fail(t("notOpen"));
  const checked = checkReportAction({ report, action, note: formData.get("note"), songPublished: report.song.published });
  if (!checked.ok) return fail(t(checked.error, { max: String(NOTE_MAX) }));

  const result = await resolveReport(db, { reportId: report.id, resolverId: user.id, action, note: checked.note });
  if (!result.ok) return fail(t(result.error === "notFound" ? "notOpen" : result.error, { max: String(NOTE_MAX) }));
  revalidatePath("/", "layout");

  if (action === "correct") redirect(`/contribuer/${report.song.id}`);
  const next = nextInQueue(await openReports(), report, compareReports);
  redirect(
    withStatus(
      next ? `/moderation/signalements/${next.id}` : "/moderation/signalements",
      action === "remove" ? "removed" : "dismissed",
    ),
  );
}

/** Rétablir une chanson retirée (spec §9). Passe par un signalement : c'est le seul écran qui mène à une chanson retirée. */
export async function restoreSongAction(reportId: string): Promise<void> {
  await requireModerator(`/moderation/signalements/${reportId}`);
  const report = await getReport(reportId);
  if (!report) notFound();
  await restoreSong(db, report.song.id);
  revalidatePath("/", "layout");
  redirect(withStatus(`/moderation/signalements/${report.id}`, "restored"));
}
```

- [ ] **Étape 7 : brancher les écrans.**

`src/components/moderation/parts.tsx` :
- `import type { ReportReason } from "@/types/report";` et `import type { Report } from "@/types/report";` à la place de l'import de la maquette ; `import { personName } from "@/mocks/moderation";` disparaît ;
- `doneMessage` accepte `"restored"` : `status === "approved" || status === "rejected" || status === "removed" || status === "dismissed" || status === "restored"` ;
- ajouter :

```tsx
/** « Signalé par … » : la personne, un visiteur (qui a laissé une adresse), ou un compte supprimé depuis. */
export async function reporterLabel(report: Pick<Report, "reporterName" | "contactEmail">): Promise<ReactNode> {
  const t = await getTranslations("moderation");
  if (report.reporterName !== null) return t.rich("report.by", { name: report.reporterName, person });
  if (report.contactEmail !== null) return t("report.byVisitor");
  return t.rich("report.by", { name: await personLabel(null), person });
}
```

`src/app/moderation/signalements/page.tsx` :
- imports : `moderationCounts`, `openReports`, `treatedReports` (`@/lib/moderation/queries`), `Report` (`@/types/report`), `reporterLabel` (parts) ; retirer `getSong`, `getRemovedSong`, `listReports`, `pendingProposals`, `person`, `personLabel` ;
- `const [queue, treated, counts] = await Promise.all([openReports(), treatedReports(), moderationCounts()]);` ; l'état vide propose les propositions si `counts.proposals > 0` ;
- `ReportItem` : `const song = report.song;`, `const reporter = await reporterLabel(report);`, `song ? <SongTitles …/> : …` devient `<SongTitles titleAr={song.titleAr} titleLatin={song.titleLatin} />`.

`src/app/moderation/signalements/[id]/page.tsx` :
- `const report = await getReport(id); if (!report) notFound();`, `const { song } = report;`, `const next = nextInQueue(await openReports(), report, compareReports);` ;
- le lien « Voir la chanson » et `ReportForm songPublished` lisent `song.published` ; le bandeau « chanson retirée » s'affiche quand `!song.published` ; `<ArtistNames artists={song.artists} …/>` ;
- l'auteur : `{await reporterLabel(report)}` à la place du `t.rich("report.by", …)` ; le traitant : `t.rich("report.resolvedBy", { name: await personLabel(report.resolvedByName), person })` ;
- après la section du traitement (formulaire ou note), pour une chanson retirée : `{!song.published ? <RestoreSongForm reportId={report.id} /> : null}` (import de `@/components/moderation/RestoreSongForm`) ;
- retirer les imports de la maquette (`getSong`, `getRemovedSong`, `openReports`, `getReport`).

- [ ] **Étape 8 : données de démonstration et retrait de la maquette.** Créer `scripts/demo/demoReports.ts` (les quatre signalements de la maquette) :

```ts
import type { ReportReason, ReportStatus } from "@/types/report";

/** Signalements de démonstration, repris de la maquette. Importé par `pnpm seed:demo`, jamais par l'application. */
export interface DemoReport {
  /** Identifiant fictif de la chanson (`s-enta-omri`). */
  song: string;
  /** Clé de la personne qui a signalé ; sans elle, c'est un visiteur, qui a laissé `contactEmail`. */
  reporter?: string;
  contactEmail?: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  /** Clé de la personne qui a traité, pour un signalement traité ou classé. */
  resolvedBy?: string;
  resolutionNote?: string;
  createdAt: string;
}

export const DEMO_REPORTS: DemoReport[] = [
  {
    song: "s-enta-omri",
    contactEmail: "droits@exemple-editions.com",
    reason: "copyright",
    details: "Nous représentons les ayants droit de cette chanson et demandons son retrait.",
    status: "open",
    createdAt: "2026-11-17T09:12:00Z",
  },
  {
    song: "s-ya-lili",
    reporter: "leila",
    reason: "wrong_lyrics",
    details: "Les deux derniers vers du premier couplet sont inversés.",
    status: "open",
    createdAt: "2026-11-16T20:40:00Z",
  },
  {
    song: "s-habaytak",
    reporter: "sami",
    reason: "duplicate",
    details: "La même chanson existe sous un autre titre latin.",
    status: "open",
    createdAt: "2026-11-18T07:30:00Z",
  },
  {
    song: "s-ala-nar",
    contactEmail: "visiteur@example.com",
    reason: "spam",
    details: "Publicité.",
    status: "dismissed",
    resolvedBy: "rania",
    resolutionNote: "Signalement sans rapport avec la chanson.",
    createdAt: "2026-11-10T11:05:00Z",
  },
];
```

Dans `scripts/seed-demo.ts` : ajouter `reports` aux imports du schéma, `or` à celui de `drizzle-orm`, et `import { DEMO_REPORTS } from "./demo/demoReports";`. Dans la transaction, juste après la suppression des propositions (étape 1 de la tâche 6), supprimer aussi les signalements des comptes de démonstration, et ceux des visiteurs de démonstration :

```ts
    const visitorEmails = DEMO_REPORTS.flatMap((r) => (r.contactEmail ? [r.contactEmail] : []));
    const previousIds = previous.map((u) => u.id);
    await tx
      .delete(reports)
      .where(
        or(
          inArray(reports.contactEmail, visitorEmails),
          ...(previousIds.length > 0 ? [inArray(reports.reporterId, previousIds), inArray(reports.resolvedBy, previousIds)] : []),
        ),
      );
```

Après l'insertion des propositions :

```ts
    await tx.insert(reports).values(
      DEMO_REPORTS.map((r) => ({
        songId: songIds.get(r.song)!,
        reporterId: r.reporter ? people.get(r.reporter)! : null,
        contactEmail: r.contactEmail ?? null,
        reason: r.reason,
        details: r.details,
        status: r.status,
        resolvedBy: r.resolvedBy ? people.get(r.resolvedBy)! : null,
        resolutionNote: r.resolutionNote ?? null,
        createdAt: new Date(r.createdAt),
      })),
    );
```

Supprimer `src/mocks/reports.ts`, `src/mocks/moderation.ts`, `src/mocks/songStore.ts` et `tests/unit/moderation/songStore.test.ts`. Vérifier : `grep -rn "mocks/reports\|mocks/moderation\|songStore\|MAQUETTE : retiré à la tâche 7" src tests scripts` ne doit plus rien trouver.

- [ ] **Étape 9 : relancer les tests et vérifier.** Lancer `pnpm seed:demo` deux fois de suite, puis `pnpm test`, `pnpm test:integration`, `pnpm typecheck` et `pnpm lint`. Attendu : PASS (parité des messages, lexique et icônes comprises : `Eye` n'est pas une icône directionnelle). Puis, avec `pnpm dev` :
- en visiteur, sur la fiche d'une chanson : « Signaler », motif « Droits d'auteur », détails, adresse : « Signalement envoyé » ;
- en Rania : `/moderation/signalements` met ce signalement en tête, au-dessus de celui de la veille. L'ouvrir, écrire une note, « Retirer la chanson » : le toast « Chanson retirée » s'affiche ; la fiche de la chanson répond « introuvable ou retirée » et la recherche ne la trouve plus ; une playlist qui la contient l'affiche « Chanson retirée » ;
- rouvrir le signalement : la section « Rétablir la chanson » est là ; la chanson revient dans la recherche, la fiche et la playlist.

- [ ] **Étape 10 : commit.**

```bash
git add src scripts messages tests
git commit -m "feat(moderation): reports, soft removal and restore on the database"
```

---

### Tâche 8 : retrait en masse par source, en ligne de commande

**Fichiers :**
- Créer : `src/lib/db/uuid.ts`, `src/lib/moderation/bulk.ts`, `scripts/remove-songs.ts`
- Modifier : `src/lib/catalog/queries.ts` (`isUuid` vient de `lib/db/uuid`), `package.json`
- Test : `tests/unit/moderation/bulkArgs.test.ts`, `tests/integration/bulkRemoval.test.ts`

**Interfaces :**
- Consomme : `SONG_SOURCES`, `SongSource` (`types/catalog`) ; `Db` (type seulement : `bulk.ts` ne charge pas le client de base, pour que son test unitaire n'ouvre aucune connexion).
- Produit : `isUuid(value: string): boolean` dans `lib/db/uuid.ts`, ré-exporté par `lib/catalog/queries` ; `BulkArgs` (`{ source: SongSource; reason: string; artistId: string | null; dryRun: boolean; restore: boolean }`) ; `parseBulkArgs(argv: string[]): { ok: true; args: BulkArgs } | { ok: false; error: string }` ; `runBulk(db: Db, args: BulkArgs): Promise<number>` (le nombre de chansons retirées, rétablies, ou qui le seraient avec `--dry-run`) ; `pnpm songs:remove`.

La spec §9 réserve à un admin le retrait de toutes les chansons d'une source, au besoin filtrées par artiste. Comme les rôles (écart 5 du plan 2) et les imports, il se lance en ligne de commande, avec l'accès direct à la base (écart 2).

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

`tests/unit/moderation/bulkArgs.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { parseBulkArgs } from "@/lib/moderation/bulk";

const ARTIST = "6f1c2a7e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";

describe("parseBulkArgs", () => {
  it("lit la source, le motif, l'artiste et les deux options", () => {
    expect(parseBulkArgs(["--source", "lrclib", "--reason", "  Retrait des ayants droit.  "])).toEqual({
      ok: true,
      args: { source: "lrclib", reason: "Retrait des ayants droit.", artistId: null, dryRun: false, restore: false },
    });
    expect(parseBulkArgs(["--source", "public_domain", "--reason", "Erreur", "--artist", ARTIST, "--dry-run", "--restore"])).toEqual({
      ok: true,
      args: { source: "public_domain", reason: "Erreur", artistId: ARTIST, dryRun: true, restore: true },
    });
  });

  it("refuse une commande sans source ou sans motif, une source inconnue et un artiste qui n'est pas un UUID", () => {
    for (const argv of [
      [],
      ["--source", "lrclib"],
      ["--reason", "Motif"],
      ["--source", "youtube", "--reason", "Motif"],
      ["--source", "lrclib", "--reason", "   "],
      ["--source", "lrclib", "--reason", "Motif", "--artist", "saber-rebai"],
      ["--source", "lrclib", "--reason", "Motif", "--tout"],
      ["--source", "lrclib", "--reason", "x".repeat(1001)],
    ]) {
      expect(parseBulkArgs(argv).ok).toBe(false);
    }
  });
});
```

`tests/integration/bulkRemoval.test.ts` :

```ts
// Plan 3, tâche 8 : retrait en masse par source, au besoin par artiste (spec §9), et son annulation.
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getSongById } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { runBulk, type BulkArgs } from "@/lib/moderation/bulk";
import { searchSongs } from "@/lib/search/searchSongs";
import { seedFixtures } from "../fixtures/seed";
import { resetDb } from "./helpers";

const REASON = "Retrait demandé par les ayants droit.";
const args = (over: Partial<BulkArgs> = {}): BulkArgs => ({
  source: "lrclib",
  reason: REASON,
  artistId: null,
  dryRun: false,
  restore: false,
  ...over,
});
const count = async (where: string) =>
  Number((await db.execute<{ n: string }>(sql.raw(`SELECT count(*) AS n FROM songs WHERE ${where}`))).rows[0].n);

describe("retrait en masse", () => {
  let ids = new Map<string, string>();
  let lrclib = 0;
  beforeEach(async () => {
    await resetDb();
    ids = await seedFixtures(db);
    lrclib = await count("source = 'lrclib'");
  });

  it("--dry-run compte sans rien changer", async () => {
    expect(lrclib).toBeGreaterThan(0);
    expect(await runBulk(db, args({ dryRun: true }))).toBe(lrclib);
    expect(await count("status = 'removed'")).toBe(0);
  });

  it("retire toutes les chansons de la source, protégées des imports, et laisse les autres", async () => {
    expect(await runBulk(db, args())).toBe(lrclib);
    expect(await count("source = 'lrclib' AND status = 'removed' AND import_locked AND removed_reason IS NOT NULL")).toBe(lrclib);
    expect(await count("source <> 'lrclib' AND status = 'removed'")).toBe(0);
    expect(await getSongById(ids.get("s-sidi-mansour")!)).toBeNull();
    expect((await searchSongs("sidi mansour")).items).toEqual([]);
    expect(await runBulk(db, args())).toBe(0);
  });

  it("filtre par artiste", async () => {
    const [{ id: saber }] = (await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`)).rows;
    const expected = Number(
      (
        await db.execute<{ n: string }>(sql`
          SELECT count(*) AS n FROM songs s JOIN song_artists sa ON sa.song_id = s.id
          WHERE sa.artist_id = ${saber} AND s.source = 'lrclib'`)
      ).rows[0].n,
    );
    expect(expected).toBeGreaterThan(0);
    expect(await runBulk(db, args({ artistId: saber }))).toBe(expected);
    expect(await count("status = 'removed'")).toBe(expected);
    expect((await getSongById(ids.get("s-ya-lili")!))?.titleLatin).toBe("Ya Lili");
  });

  it("--restore rétablit les chansons retirées pour ce motif, et seulement celles-là", async () => {
    await runBulk(db, args());
    const other = ids.get("s-habaytak")!;
    await db.update(songs).set({ removedReason: "Retrait d'un modérateur." }).where(eq(songs.id, other));
    expect(await runBulk(db, args({ restore: true, dryRun: true }))).toBe(lrclib - 1);
    expect(await runBulk(db, args({ restore: true }))).toBe(lrclib - 1);
    expect(await count("status = 'removed'")).toBe(1);
    expect((await getSongById(ids.get("s-sidi-mansour")!))?.titleLatin).toBe("Sidi Mansour");
    expect(await getSongById(other)).toBeNull();
    expect(await runBulk(db, args({ restore: true, reason: "Autre motif." }))).toBe(0);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/moderation/bulkArgs.test.ts` et `pnpm exec vitest run --project integration tests/integration/bulkRemoval.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : `isUuid` sans client de base.** `src/lib/db/uuid.ts` :

```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identifiant UUID bien formé : à tester avant de comparer une chaîne de l'adresse à une colonne `uuid`. */
export const isUuid = (value: string): boolean => UUID_RE.test(value);
```

Dans `src/lib/catalog/queries.ts`, remplacer les deux lignes de `UUID_RE` et `isUuid` par `import { isUuid } from "@/lib/db/uuid";` (avec les autres imports) et `export { isUuid };`. Les appelants existants ne changent pas.

- [ ] **Étape 4 : implémenter.** `src/lib/moderation/bulk.ts` (sans `server-only` : le script de la tâche le charge hors de Next) :

```ts
import { sql, type SQL } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { isUuid } from "@/lib/db/uuid";
import { SONG_SOURCES, type SongSource } from "@/types/catalog";

/**
 * Retrait en masse (spec §9), lancé par un admin en ligne de commande : toutes les chansons d'une source,
 * au besoin celles d'un artiste. C'est un retrait doux, comme celui d'un signalement : la chanson est
 * gardée, avec son motif, et protégée des imports (`import_locked`). `--restore` annule un retrait fait
 * avec le même motif, et laisse les chansons retirées pour un autre motif. Le verrou d'import reste posé
 * après un rétablissement : un modérateur a décidé de cette chanson.
 */

export const BULK_REASON_MAX = 1000;

const USAGE =
  'Usage : pnpm songs:remove --source lrclib|public_domain|contribution --reason "<motif>" [--artist <uuid>] [--dry-run] [--restore]';

export interface BulkArgs {
  source: SongSource;
  reason: string;
  artistId: string | null;
  /** Compte les chansons concernées sans rien écrire. */
  dryRun: boolean;
  /** Rétablit au lieu de retirer. */
  restore: boolean;
}

export type BulkArgsResult = { ok: true; args: BulkArgs } | { ok: false; error: string };

export function parseBulkArgs(argv: string[]): BulkArgsResult {
  let source: SongSource | null = null;
  let reason: string | null = null;
  let artistId: string | null = null;
  let dryRun = false;
  let restore = false;
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--dry-run") dryRun = true;
    else if (flag === "--restore") restore = true;
    else if (flag === "--source" && SONG_SOURCES.includes(value as SongSource)) {
      source = value as SongSource;
      i += 1;
    } else if (flag === "--reason" && value !== undefined) {
      reason = value.trim();
      i += 1;
    } else if (flag === "--artist" && value !== undefined && isUuid(value)) {
      artistId = value;
      i += 1;
    } else return { ok: false, error: USAGE };
  }
  if (!source || !reason || reason.length > BULK_REASON_MAX) return { ok: false, error: USAGE };
  return { ok: true, args: { source, reason, artistId, dryRun, restore } };
}

const byArtist = (artistId: string | null): SQL =>
  artistId
    ? sql`AND EXISTS (SELECT 1 FROM song_artists sa WHERE sa.song_id = songs.id AND sa.artist_id = ${artistId})`
    : sql``;

/** Applique la commande, et renvoie le nombre de chansons retirées ou rétablies (ou qui le seraient, avec `--dry-run`). */
export async function runBulk(db: Db, args: BulkArgs): Promise<number> {
  const { source, reason, artistId, dryRun, restore } = args;
  const filter = byArtist(artistId);
  if (restore) {
    const where = sql`source = ${source} AND status = 'removed' AND removed_reason = ${reason} ${filter}`;
    if (dryRun) return count(db, where);
    const res = await db.execute(sql`
      UPDATE songs SET status = 'published', removed_reason = NULL, updated_at = now()
      WHERE ${where} RETURNING id`);
    return res.rows.length;
  }
  const where = sql`source = ${source} AND status = 'published' ${filter}`;
  if (dryRun) return count(db, where);
  const res = await db.execute(sql`
    UPDATE songs SET status = 'removed', removed_reason = ${reason}, import_locked = true, updated_at = now()
    WHERE ${where} RETURNING id`);
  return res.rows.length;
}

async function count(db: Db, where: SQL): Promise<number> {
  const res = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs WHERE ${where}`);
  return Number(res.rows[0].n);
}
```

`scripts/remove-songs.ts` :

```ts
// Plan 3, tâche 8 : retrait en masse des chansons d'une source (spec §9), lancé par un admin avec l'accès à la base.
import "dotenv/config";
import { db, pool } from "@/lib/db/client";
import { parseBulkArgs, runBulk } from "@/lib/moderation/bulk";

async function main(): Promise<void> {
  const parsed = parseBulkArgs(process.argv.slice(2));
  if (!parsed.ok) throw new Error(parsed.error);
  const { args } = parsed;
  const count = await runBulk(db, args);
  const done = args.restore ? (args.dryRun ? "seraient rétablies" : "rétablies") : args.dryRun ? "seraient retirées" : "retirées";
  console.log(`${count} chanson(s) ${done} (source ${args.source}${args.artistId ? `, artiste ${args.artistId}` : ""}).`);
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

Ajouter `"songs:remove": "tsx scripts/remove-songs.ts"` à `package.json`.

- [ ] **Étape 5 : relancer les tests.** Lancer `pnpm test`, `pnpm test:integration` et `pnpm typecheck`. Attendu : PASS. Puis, à la main sur la base de développement : `pnpm songs:remove --source lrclib --reason "Essai" --dry-run` affiche `11 chanson(s) seraient retirées (source lrclib).` après `pnpm seed:fixtures`, et ne change rien.

- [ ] **Étape 6 : commit.**

```bash
git add src scripts package.json tests
git commit -m "feat(moderation): bulk removal by source from the command line"
```

---

### Tâche 9 : la passerelle du catalogue ne lit plus que la base

**Fichiers :**
- Modifier : `src/lib/catalog/read.ts`, `src/mocks/catalog.ts`, `tests/integration/read.test.ts`
- Supprimer : `src/mocks/artists.ts`, `tests/unit/artist/artistPage.test.ts`

**Interfaces :**
- Consomme : `getSongById`, `getArtistPage`, `publishedSongIds`, `songIdExists` (`lib/catalog/queries`, plan 1).
- Produit : `getSong(id): Promise<Song | undefined>`, `getArtistPage(id, page)`, `songExists(id)` et `readerPositionsOf(playlist)` gardent leurs signatures ; un identifiant qui n'est pas un UUID n'est plus une chanson, ni un artiste.
- Retiré : la branche fictive de la passerelle, `REMOVED_SONGS`, `getSong` et `getRemovedSong` de `src/mocks/catalog.ts`, et `src/mocks/artists.ts`. `SONGS` reste : `pnpm seed:fixtures` l'écrit en base, et `src/mocks/search.ts` ainsi que les aperçus de développement de `/recherche` le lisent.

- [ ] **Étape 1 : adapter les tests, qui doivent échouer.** Dans `tests/integration/read.test.ts`, remplacer les trois premiers tests du `describe` (le test de numérotation d'une playlist reste tel quel : il vérifie déjà qu'un identifiant fictif est ignoré) :

```ts
  it("lit un UUID en base ; un identifiant fictif ou inconnu n'est aucune chanson", async () => {
    expect(await getSong(ids.get("s-sidi-mansour")!)).toMatchObject({
      id: ids.get("s-sidi-mansour"),
      titleLatin: "Sidi Mansour",
    });
    expect(await getSong("s-sidi-mansour")).toBeUndefined();
    expect(await getSong(UNKNOWN_UUID)).toBeUndefined();
    expect(await getSong("s-inconnue")).toBeUndefined();
  });

  it("lit la page artiste en base ; un identifiant fictif n'est aucun artiste", async () => {
    const r = await db.execute<{ id: string }>(sql`SELECT id FROM artists WHERE identity_key = 'saber rebai'`);
    expect((await getArtistPage(r.rows[0].id, 1))?.artist.nameLatin).toBe("Saber Rebai");
    expect(await getArtistPage("a-saber", 1)).toBeNull();
  });
```

et le dernier test :

```ts
  it("songExists : connue publiée ou retirée, en base seulement", async () => {
    const removed = ids.get("s-ala-nar")!;
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, removed));
    expect(await songExists(removed)).toBe(true);
    expect(await songExists(ids.get("s-habaytak")!)).toBe(true);
    expect(await songExists(UNKNOWN_UUID)).toBe(false);
    expect(await songExists("s-sidi-mansour")).toBe(false);
  });
```

Lancer `pnpm exec vitest run --project integration tests/integration/read.test.ts`. Attendu : FAIL (la passerelle lit encore le catalogue fictif).

- [ ] **Étape 2 : réécrire la passerelle.** `src/lib/catalog/read.ts` :

```ts
import "server-only";
import type { ArtistPage } from "@/lib/artist/types";
import { readablePositions } from "@/lib/playlist/rows";
import type { Playlist, Song } from "@/types/catalog";
import { getArtistPage as getDbArtistPage, getSongById, publishedSongIds, songIdExists } from "./queries";

/**
 * Passerelle de lecture du catalogue pour les écrans. Tout vient de la base : une chanson ou un artiste se
 * désigne par son UUID, et un autre identifiant (ceux de la maquette, `s-sidi-mansour`, `a-saber`) ne désigne
 * rien. Les playlists, les propositions et les signalements ne contiennent que des chansons de la base.
 */

/** Chanson publiée, ou `undefined` si elle est inconnue ou retirée. */
export async function getSong(id: string): Promise<Song | undefined> {
  return (await getSongById(id)) ?? undefined;
}

/** Page d'un artiste, ou `null` s'il est inconnu ou n'a aucune chanson publiée. */
export function getArtistPage(id: string, page: number): Promise<ArtistPage | null> {
  return getDbArtistPage(id, page);
}

/** Chanson connue, publiée ou retirée (pour annuler un retrait sans accepter n'importe quel identifiant). */
export function songExists(id: string): Promise<boolean> {
  return songIdExists(id);
}

/** Numéros du lecteur pour les chansons lisibles de la playlist (les chansons retirées n'en ont pas). */
export async function readerPositionsOf(playlist: Pick<Playlist, "items">): Promise<Map<string, number>> {
  const published = await publishedSongIds(playlist.items.map((item) => item.songId));
  return readablePositions(playlist.items, (id) => published.has(id));
}
```

- [ ] **Étape 3 : alléger le catalogue fictif.** Dans `src/mocks/catalog.ts`, remplacer tout ce qui suit la définition de `RAW_SONGS` (le commentaire de `songMemory`, `songMemory`, `SONGS`, `REMOVED_SONGS`, `getSong` et `getRemovedSong`) par :

```ts
/**
 * Jeu de test du catalogue : `pnpm seed:fixtures` l'écrit en base (plan 1), et `src/mocks/search.ts` ainsi que
 * les aperçus de développement de /recherche le lisent. Plus aucun écran ne le lit. Les translittérations
 * déjà en base : relue pour Chebbi, automatiques pour deux chansons, absentes sinon.
 */
export const SONGS: Song[] = RAW_SONGS.map((song) => {
  const stored = STORED_TRANSLIT[song.id];
  return stored
    ? { ...song, lyricsTranslit: TRANSLIT_TEXTS[song.id] ?? null, translitStatus: stored }
    : { ...song, lyricsTranslit: null, translitStatus: "none" };
});
```

Supprimer `src/mocks/artists.ts` et `tests/unit/artist/artistPage.test.ts` : la page artiste en base est testée par `tests/integration/queries.test.ts` et `tests/integration/read.test.ts`.

- [ ] **Étape 4 : chercher les restes.** `grep -rn "getRemovedSong\|REMOVED_SONGS\|mocks/artists\|mocks/proposals\|mocks/reports\|mocks/moderation\|mocks/songStore\|mocks/similar\|mocks/account\|MAQUETTE" src tests scripts` ne doit plus rien trouver, hors les mentions de `MAQUETTE` qui concernent la translittération (plan 4) et les aperçus. `grep -rn "mocks/catalog" src tests scripts` ne doit citer que `tests/fixtures/seed.ts`, `src/mocks/search.ts`, `src/mocks/translit.ts` (en commentaire) et leurs tests.

- [ ] **Étape 5 : relancer toute la suite.** Lancer `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, puis `pnpm build` (la compilation de production attrape ce que le typage laisse passer, comme un import de module serveur dans un composant client). Attendu : PASS. Puis, avec `pnpm dev` (après `pnpm seed:demo`) : `/chanson/s-sidi-mansour` et `/artiste/a-saber` répondent 404 ; la recherche, les fiches, les playlists, le lecteur, `/moderation` et `/mes-contributions` fonctionnent comme avant.

- [ ] **Étape 6 : commit.**

```bash
git add src tests
git commit -m "refactor(catalog): the read gateway reads the database only"
```

---

### Tâche 10 : tests de bout en bout

**Fichiers :**
- Créer : `tests/e2e/contributions.spec.ts`, `tests/e2e/moderation.spec.ts`

**Interfaces :**
- Consomme : `signIn(page, email, retour?)` (plan 2, tâche 12) ; `pnpm seed:demo` (tâches 6 et 7), qui crée Leïla (membre), Rania (modératrice) et Nour (membre sans droit de modérer) ; la recherche, la fiche chanson, `/signaler/[songId]`, `/moderation`, `/moderation/signalements`.
- Produit : les parcours (b) de la spec §13 (contribuer, valider en modérateur, retrouver la chanson), un parcours de signalement, de retrait et de rétablissement, et un refus d'accès.

Les fichiers tournent dans l'ordre alphabétique, avec un seul processus : `auth`, `clubs`, `contributions`, `moderation`, `playlists`, `search`. Les parcours ne retirent que « Taht el Yasmina » (puis la rétablissent) : `playlists` et `search` n'en ont pas besoin. Les limites du jour sont remises à zéro par `seed:fixtures` à chaque lancement.

- [ ] **Étape 1 : écrire le parcours de contribution.**

`tests/e2e/contributions.spec.ts` :

```ts
import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("proposer une chanson, la faire approuver par une modératrice, puis la retrouver (spec §13, parcours b)", async ({ page }) => {
  // Leïla propose une chanson, avec un artiste connu choisi dans la liste.
  await signIn(page, "leila@example.com", "/contribuer");
  await page.getByLabel("Titre en lettres latines").fill("Lamma Bada Yatathanna");
  await page.getByRole("combobox", { name: "Artiste 1" }).fill("hedi jou");
  await page.getByRole("option", { name: /Hedi Jouini/ }).click();
  await page.getByLabel("Paroles", { exact: true }).fill("يا نسيم الليل سلّم\nعلى الحبايب في الدار");
  await page.getByLabel("Dialecte").selectOption({ label: "Maghreb" });
  await page.getByRole("checkbox", { name: /domaine public/ }).check();
  await page.getByRole("button", { name: "Envoyer la proposition" }).click();
  await expect(page).toHaveURL(/\/mes-contributions\?envoyee=/);
  await expect(page.getByText("votre proposition sera relue")).toBeVisible();
  await expect(page.getByText("En attente").first()).toBeVisible();

  // Rania la relit et l'approuve.
  await page.context().clearCookies();
  await signIn(page, "rania@example.com", "/moderation");
  await page.getByRole("link", { name: /Lamma Bada Yatathanna/ }).click();
  await expect(page.getByText("يا نسيم الليل سلّم")).toBeVisible();
  await page.getByRole("button", { name: "Approuver" }).click();
  await expect(page.getByText("Proposition approuvée")).toBeVisible();

  // La chanson est publiée : cherchable, lisible, avec sa source.
  await page.goto(`/recherche?q=${encodeURIComponent("Lamma Bada Yatathanna")}`);
  await page.getByRole("link", { name: /Lamma Bada Yatathanna/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lamma Bada Yatathanna");
  await expect(page.getByTestId("lyrics")).toContainText("يا نسيم الليل سلّم");
  await expect(page.getByText("Proposition", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Hedi Jouini" })).toBeVisible();
});
```

Les libellés viennent de `messages/fr.json` (`contribute.*`, `moderation.*`, `song.*`). Les vérifier, ainsi que l'accessibilité des champs (`getByLabel("Paroles", { exact: true })`, le choix du dialecte par son libellé « Maghreb »), et reprendre les textes réels de l'interface si l'un diffère.

- [ ] **Étape 2 : écrire les parcours de signalement et d'accès.**

`tests/e2e/moderation.spec.ts` :

```ts
import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("signaler une chanson, la retirer en modératrice, puis la rétablir", async ({ page }) => {
  // Un visiteur signale une chanson pour droits d'auteur, avec son adresse.
  await page.goto("/recherche?q=taht+el+yasmina");
  await page.getByRole("link", { name: /Taht el Yasmina/ }).first().click();
  const songUrl = page.url();
  await page.getByRole("link", { name: "Signaler", exact: true }).click();
  await page.getByRole("radio", { name: /Droits d'auteur/ }).check({ force: true });
  await page.getByLabel("Détails").fill("Nous représentons les ayants droit de cette chanson.");
  await page.getByLabel("Votre adresse e-mail").fill("ayants-droit@example.com");
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(page.getByRole("heading", { name: "Signalement envoyé" })).toBeVisible();

  // Rania le traite : retrait doux, avec le motif en note.
  await signIn(page, "rania@example.com", "/moderation/signalements");
  await page.getByRole("link", { name: /Taht el Yasmina/ }).first().click();
  const reportUrl = page.url();
  await page.getByLabel("Note de traitement").fill("Retrait demandé par les ayants droit.");
  await page.getByRole("button", { name: "Retirer la chanson" }).click();
  await expect(page.getByText("Chanson retirée")).toBeVisible();

  const gone = await page.goto(songUrl);
  expect(gone?.status()).toBe(404);
  await expect(page.getByText("introuvable ou a été retirée")).toBeVisible();

  // Le retrait est réversible : la chanson revient, fiche comprise.
  await page.goto(reportUrl);
  await page.getByRole("button", { name: "Rétablir la chanson" }).click();
  await expect(page.getByText("Chanson rétablie")).toBeVisible();
  const back = await page.goto(songUrl);
  expect(back?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Taht el Yasmina");
});

test("un membre qui n'est pas modérateur ne voit pas la modération", async ({ page }) => {
  await signIn(page, "nour@example.com", "/moderation");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});
```

Vérifier le nom accessible des boutons radio du formulaire de signalement : si l'entrée est masquée visuellement, `check({ force: true })` suffit ; sinon retirer `force`.

- [ ] **Étape 3 : lancer les parcours.** Lancer `CI=true pnpm test:e2e`. Attendu : PASS, soit les 11 parcours des plans 1 et 2 et les 3 nouveaux. Lancer les parcours trois fois de suite (`CI=true pnpm test:e2e` ×3) : chaque lancement remet la base à zéro (`globalSetup`), et un parcours qui ne passe qu'au premier lancement dépend d'un état laissé par un autre. Puis toute la suite : `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration`.

- [ ] **Étape 4 : commit.**

```bash
git add tests/e2e
git commit -m "test(e2e): contribution, moderation, report and restore journeys"
```

---

### Tâche 11 : documentation, spec et état du plan

**Fichiers :**
- Modifier : `README.md`, `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md`, ce plan

- [ ] **Étape 1 : README.** Après la section « Rôles », ajouter :

```markdown
## Modération

- **Premier modérateur** : se connecter une fois, puis `pnpm user:role <adresse> --role moderator` (voir « Rôles »). Un admin (`--role admin`) approuve aussi ses propres propositions, pour amorcer la plateforme ; un modérateur ne le peut pas.
- **Propositions et signalements** : `/moderation` (propositions, de la plus ancienne à la plus récente) et `/moderation/signalements` (droits d'auteur en tête). Un retrait est doux : il se rétablit depuis la page du signalement qui l'a provoqué.
- **Limites** : 10 propositions par jour et par personne, 10 signalements par jour et par adresse IP (fenêtre du jour UTC, table `rate_limits`).
- **Retrait en masse** (admin, avec l'accès à la base) :

  `pnpm songs:remove --source lrclib|public_domain|contribution --reason "<motif>" [--artist <uuid>] [--dry-run] [--restore]`

  `--dry-run` compte sans rien changer ; `--restore` rétablit les chansons retirées avec le même motif. Un retrait protège la chanson des imports (`import_locked`), et un rétablissement laisse cette protection.
- **Comptes supprimés** : leurs propositions et leurs signalements restent, sans auteur (« un compte supprimé »).
```

Dans la section « Développement », mentionner que `pnpm seed:demo` crée aussi sept propositions (dont trois de Leïla) et quatre signalements.

- [ ] **Étape 2 : mettre la spec à jour.** Dans la spec, chaque changement daté du 23/11/2026 et renvoyant à ce plan :
- §5, `song_revisions` et `reports` : `author_id`, `reviewer_id`, `reporter_id` et `resolved_by` peuvent être nuls (`ON DELETE SET NULL`) ; `song_revisions` a un index unique partiel sur `(author_id, song_id)` en attente ;
- §12, « Suppression de compte » : l'anonymisation met `author_id` à nul, et non vers un utilisateur système « compte supprimé » (écart 1) ;
- §8.5 : une correction approuvée pose `import_locked` sur la chanson (écart 6) ;
- §9 : le retrait en masse se lance par `pnpm songs:remove` ; un retrait pose `import_locked`, et une chanson se rétablit depuis le signalement qui l'a retirée (écarts 2 et 3) ;
- §4.3, ligne de l'admin : « retirer en masse par source » renvoie à la même commande ;
- §4.4 : `/moderation/[revisionId]` et `/moderation/signalements/[id]` s'ajoutent aux deux routes de la file ; `GET /api/artistes?q=` (écart 4) ;
- §8.2 : la recherche des chansons proches ne lit pas les paroles (écart 5).

- [ ] **Étape 3 : état du plan.** Ajouter en tête de ce plan, après « Plan suivant », une section « État des tâches », sur le modèle du plan 2 : pour chaque tâche, la date, ce qui a été vérifié, et les écarts constatés pendant l'exécution. Y noter ce que les vérifications n'ont pas couvert, par exemple : le rendu en arabe des nouveaux écrans (rétablir, messages de limite), le comportement d'un antivirus de messagerie qui ouvre le lien magique avant la personne (resté ouvert depuis le plan 2), et la proposition d'un contenu de plus de 20 000 caractères.

- [ ] **Étape 4 : commit.**

```bash
git add README.md docs/superpowers
git commit -m "docs(plan-3): moderation, bulk removal, spec updates and task status"
```

---

## Couverture de la spec par ce plan

| Spec | Tâches |
|---|---|
| §4.2 `lib/moderation` : création, approbation, rejet des révisions, application d'une révision à `songs`, traitement des signalements | 2, 3, 6, 7 |
| §4.3 Membre : proposer des ajouts et des corrections ; adresse vérifiée | 2, 5 |
| §4.3 Modérateur : approuver, rejeter, traiter, retirer, rétablir ; pas sa propre révision ; admin : les siennes, retrait en masse | 2, 6, 7, 8 |
| §4.4 `/contribuer`, `/contribuer/[songId]`, `/mes-contributions`, `/moderation`, `/moderation/signalements`, `/signaler/[songId]` | 4, 5, 6, 7 |
| §5 `song_revisions`, `reports` ; retrait doux ; colonnes de recherche recalculées à l'approbation | 1, 3, 7 |
| §8.1 Formulaire : titres, artistes avec autocomplétion, dialecte, paroles, translittération, droits | 4, 5 |
| §8.2 « Existe peut-être déjà » : trois meilleurs résultats de `searchSongs` | 4 |
| §8.3 Une révision `pending` par auteur et par chanson ; correction pré-remplie | 1, 2, 5 |
| §8.4 File triée, diff, approuver ou rejeter avec note obligatoire | 2, 6 |
| §8.5 Approbation en une transaction ; paroles changées sans translittération | 3 |
| §8.6 Suivi dans `/mes-contributions` | 2, 5 |
| §8.7 E-mail vérifié ; 10 révisions par jour | 2, 5 |
| §9 Signalement ouvert à tous ; 10 par jour et par IP ; file avec droits d'auteur en tête ; retirer, corriger, classer ; réversibilité ; retrait en masse | 2, 7, 8 |
| §12 Validation des entrées, permissions côté serveur, limites, anonymisation d'un compte supprimé | 2, 5, 6, 7 |
| §13 Intégration : cycle de vie d'une révision, application en transaction, retrait doux, matrice des permissions | 1, 2, 3, 6, 7 |
| §13 Bout en bout : parcours (b) | 10 |

**Hors de ce plan** :

| Sujet de la spec | Plan |
|---|---|
| §7 translittération (génération à la demande, verrou, plafond quotidien, bouton du lecteur et de la fiche) | Plan 4 |
| Page `/a-propos/droits` : déjà construite avec la maquette, elle décrit la procédure sans changement | — |

