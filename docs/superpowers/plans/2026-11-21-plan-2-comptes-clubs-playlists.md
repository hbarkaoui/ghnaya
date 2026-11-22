# Plan 2 — Comptes, clubs, playlists et lecteur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objectif** : de vrais comptes (lien magique par e-mail et Google), des clubs, des playlists personnelles et de club, et un lecteur de séance qui lit ces playlists en base. À la fin du plan, plus aucun écran de comptes, de clubs ou de playlists ne lit les données fictives.

**Architecture** :
- **Better Auth** gère les comptes et les sessions en base (tables `users`, `sessions`, `accounts`, `verifications`), via l'adaptateur Drizzle.
- `src/lib/session.ts` garde sa signature (`getCurrentUser()`), mais lit la session Better Auth et les adhésions en base.
- `src/lib/auth/permissions.ts` est **le seul endroit** où l'on décide qui peut faire quoi (spec §4.2).
- `src/lib/clubs` et `src/lib/playlist` reçoivent des modules `queries.ts` (lecture) et `write.ts` (écritures en transaction). Les fonctions pures déjà écrites pour la maquette (`membership.ts`, `edit.ts`, `invite.ts`, `slug.ts`, `name.ts`) restent la référence des règles, et les écritures les appliquent.
- Les e-mails partent par SMTP. En développement et en test, ils sont écrits dans une boîte locale (`.outbox/`), que la page « Vérifiez vos e-mails » et les tests de bout en bout savent ouvrir.

**Stack** : celle du plan 1, plus `better-auth` (1.7) et `nodemailer`.

**Spec** : `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md` (§4.3 rôles, §4.4 pages, §5 modèle, §10 clubs, playlists et lecteur, §12 suppression de compte).

**Plan précédent** : `docs/superpowers/plans/2026-11-18-plan-1-catalogue-recherche.md`, terminé le 21/11/2026. Ses conventions s'appliquent (tests, commits, base locale sur le port 5433).

**Plans suivants**, hors de ce plan :
- Plan 3 : contributions, modération et signalements (y compris l'anonymisation des révisions d'un compte supprimé) ;
- Plan 4 : translittération.

## État des tâches

Toutes les tâches ont été exécutées le 22/11/2026, sur la branche `feat/plan-2-comptes`, une revue après chacune.

| Tâche | État | Ce qui a été vérifié, et les écarts constatés |
|---|---|---|
| 1. Schéma | Faite le 22/11/2026 (`7b8ffc2`) | Migration `0002_accounts_clubs_playlists.sql` générée sans édition manuelle ; tests d'intégration du schéma, dont la contrainte propriétaire de la playlist. `updated_at` n'est qu'une valeur par défaut : chaque écriture doit le renseigner. |
| 2. E-mails | Faite le 22/11/2026 (`2dbd7d0`) | Transport SMTP ou boîte locale, texte et HTML échappés. Le sujet arabe utilise le nom de l'application « غناية ». |
| 3. Better Auth, session, permissions | Faite le 22/11/2026, un tour de correction (`76af319`, `e34fa3b`) | La route `/api/auth/[...all]` ne transmet qu'une liste blanche (vérification du lien magique, rappel des fournisseurs, session, déconnexion, erreur) et répond 404 au reste : sans elle, un appel direct contournait la limite de liens magiques en PostgreSQL. Les crochets de création et de mise à jour d'un utilisateur valident le nom (`normalizeUserName`). Les jetons de lien magique sont stockés hachés. |
| 4. Connexion et déconnexion | Faite le 22/11/2026, un tour de correction (`eb3f4c4`, `6329966`) | Better Auth ajoute lui-même `error=` à l'adresse d'erreur : `signInErrorKey` lit donc une chaîne ou un tableau, et la bannière Google s'affiche. Une erreur de connexion Google est rattrapée et renvoie à `/connexion`. Le cookie « envoyé à » est `secure` en production. |
| 5. Rôles en ligne de commande | Faite le 22/11/2026 (`352cd5e`) | `pnpm user:role`. L'adresse est comparée telle quelle (Better Auth l'enregistre en minuscules) : voir la vérification avant déploiement dans le README. |
| 6. Clubs et adhésions | Faite le 22/11/2026 (`37a533f`) | Règle « un seul club » sous verrou ; test de concurrence (8 × 15 jointures simultanées). Pour lancer un seul fichier d'intégration : `pnpm exec vitest run --project integration <fichier>` (`pnpm test:integration -- <fichier>` lance toute la suite). |
| 7. Playlists en base | Faite le 22/11/2026 (`8508655`) | Droits déduits du rôle dans le club. Copies temporaires « MAQUETTE » retirées à la tâche 9. |
| 8. Écrans des clubs | Faite le 22/11/2026 (`5f08374`) | Parcours à deux utilisateurs (promotion, renommage, régénération du lien, playlist de club vue par un membre) vérifié ensuite par les tests de bout en bout de la tâche 12. `deleteAccount` passe par `soleAnimatorClubs`, devenu asynchrone. |
| 9. Playlists, feuille d'ajout, accueil, lecteur | Faite le 22/11/2026 (`49e7e1e`) | Vérifiée dans le navigateur sur 12 chansons de développement. Le lien de `/apercu/etats` vers une playlist fictive (devenu un 404) est retiré à la tâche 11. |
| 10. Compte | Faite le 22/11/2026 (`4863a3f`) | Nom, langue et suppression dans une transaction par `lib/account`. La suppression ferme la session avant d'effacer : en cas d'échec, la personne est déconnectée. |
| 11. Données de démonstration | Faite le 22/11/2026 (`b0bb95b`) | `pnpm seed:demo` crée les comptes, les clubs et les playlists (clés « leila » et « sami »). Les `dedupe_key` périmées des chansons de test de la base de développement ont été corrigées sur place, par un script jetable, pour passer `songs_source_ref_uq`. |
| 12. Bout en bout et CI | Faite le 22/11/2026 (`7471e0c`) | 11 parcours verts trois fois de suite. Les assertions reprennent les libellés réels de l'interface, et non ceux prévus par le plan. Les fichiers de test partagent des données de démonstration modifiées et s'exécutent dans l'ordre, avec un seul processus. Aucun défaut de l'application révélé. |
| 13. Déploiement, documentation | Faite le 22/11/2026 | README (comptes en production), spec §4.1, §4.3 et §5 datées et renvoyant à ce plan. |

### Reste pour plus tard

Petites remarques de revue, non traitées :

- L'aperçu de la boîte locale ouvre une session à quiconque si `MAIL_TRANSPORT=outbox` reste défini sur un déploiement public. Aucun avertissement n'existe hors développement.
- Le message « trop de demandes » dit « pour cette adresse », y compris pour la limite par IP.
- `joinClub` fait confiance à `isAnimator` donné par l'appelant ; `FOR UPDATE` pourrait être `FOR NO KEY UPDATE`.
- Les décalages d'horloge de `updated_at` (heure de l'application ou de la base selon l'écriture).
- Pas de tests unitaires des droits au niveau des Server Actions, ni de `renameUserAction`.
- Les formulaires de suppression et de nom perdent le focus ou le texte saisi après un échec.

## Contraintes globales

- TypeScript `strict: true`. Aucun `any` explicite.
- Tous les identifiants sont des UUID générés par PostgreSQL. Toutes les tables ont `created_at` et `updated_at`.
- Les pages n'écrivent jamais de SQL. Elles passent par `lib/clubs`, `lib/playlist`, `lib/account` ou `lib/catalog`.
- Toutes les Server Actions revérifient la session et les droits : afficher un bouton n'est pas un contrôle d'accès (spec §12).
- Les noms, les notes et les noms de playlist sont rendus en texte brut. Pas de `dangerouslySetInnerHTML`.
- **Rôles** (spec §4.3) :
  - visiteur : chercher, lire ;
  - membre : playlists personnelles, rejoindre **un** club ;
  - animateur (`is_animator`, attribué par un admin) : créer des clubs et en animer **plusieurs** ;
  - modérateur et admin : `global_role`. Leurs écrans viennent au plan 3.
- **Clubs** (spec §5 et §10) :
  - un club garde toujours au moins un animateur : le dernier animateur ne peut ni partir ni être rétrogradé ;
  - un utilisateur sans `is_animator` a au plus une adhésion : en rejoindre un autre club lui fait quitter le premier, après confirmation ;
  - le code d'invitation a 10 caractères (`newInviteCode`), et le régénérer invalide l'ancien lien ;
  - un club est privé : seuls ses membres voient ses playlists.
- **Playlists** (spec §5 et §10) :
  - une playlist appartient soit à un utilisateur, soit à un club : `check ((owner_user_id is null) <> (club_id is null))` ;
  - les playlists de club sont modifiées par les animateurs **de ce club** (`club_members.role`), lues et copiées par ses membres ;
  - une chanson n'apparaît qu'une fois par playlist ;
  - les positions sont numérotées à partir de 1, sans trou.
- **Lecteur** : les préférences restent en `localStorage` (déjà construit). Une chanson retirée n'est pas lisible : le lecteur la saute.
- **Limites** : 5 demandes de lien magique par adresse en 15 minutes, et 20 par IP et par heure (table `rate_limits` du plan 1).
- Les commits suivent Conventional Commits (`feat:`, `test:`, `chore:`…).

## Écarts assumés par rapport à la spec, à confirmer en revue

1. **Better Auth au lieu d'Auth.js** (décision de l'utilisateur, 21/11/2026). next-auth v5 est toujours en bêta (`5.0.0-beta.32`, juillet 2026). Better Auth 1.7 est stable, maintenu, et couvre le lien magique, Google, les sessions en base et Drizzle. La spec §4.1 est mise à jour dans la tâche 13.
2. **Nom des tables d'authentification.** Better Auth impose ses champs : `users` reçoit `name`, `email_verified` (booléen) et `image` en plus de la spec. `email_verified_at` devient `email_verified`. Un compte créé par lien magique a une adresse vérifiée : le lien en est la preuve.
3. **Nom d'un compte créé par lien magique** : la partie de l'adresse avant `@` (`leila@example.com` → « leila »). On peut le changer sur `/moi/compte`.
4. **Limite des liens magiques dans PostgreSQL.** Les appels `auth.api.*` faits depuis une Server Action ne passent pas par le limiteur de Better Auth, qui est en mémoire et ne vaut donc rien sur Vercel. On réutilise `hitRateLimit` du plan 1.
5. **Attribution des rôles en ligne de commande** : `pnpm user:role <email> [--animator|--no-animator] [--role member|moderator|admin]`. La spec ne prévoit pas de page d'administration, et l'admin lance déjà les imports en ligne de commande.
6. **Suppression de compte** : faite par `lib/account` dans une transaction, et non par `auth.api.deleteUser`. Ce dernier exige une session de moins d'un jour, ou un mot de passe, que les comptes à lien magique n'ont pas. La confirmation reste celle de l'écran déjà construit. Le rattachement des révisions au compte « compte supprimé » vient au plan 3, avec la table `song_revisions`.
7. **Nom de playlist** : 60 caractères au plus partout. `edit.ts` (80) et `addToPlaylist.ts` (60) divergeaient.
8. **Positions des chansons** : une modification de l'ordre réécrit les lignes de la playlist dans une transaction (suppression puis insertion). La contrainte `unique(playlist_id, position)` n'a donc pas besoin d'être différée.
9. **Suppression d'une playlist** : la spec la prévoit (§10), mais la maquette ne l'avait pas. On l'ajoute au mode édition, sur le modèle de la suppression d'un club.

## Ce qui existe déjà (maquette fusionnée dans `main`)

Les écrans sont construits sur des données fictives. Ce plan ne les redessine pas : il les branche.

| Écran ou module | Fichiers | Données fictives remplacées |
|---|---|---|
| Connexion, « Vérifiez vos e-mails » | `src/app/connexion/**`, `src/components/auth/**`, `src/app/actions/signIn.ts` | `src/mocks/signIn.ts`, cookie de session de démonstration |
| Session courante, gardes | `src/lib/session.ts`, `src/lib/auth/gate.ts`, `src/lib/moderation/gate.ts`, `src/components/auth/AuthGate.tsx` | `src/mocks/session.ts` (`DemoUser`) |
| Accueil | `src/app/page.tsx` | `clubPlaylistsFor`, `personalPlaylistsFor` |
| Mes playlists, playlist, mode édition, copie | `src/app/playlists/**`, `src/components/playlist/**`, `src/app/actions/playlist.ts` | `src/mocks/playlistStore.ts`, `PLAYLISTS` de `src/mocks/catalog.ts` |
| Feuille « Ajouter à une playlist » | `AddToPlaylistScope.tsx`, `src/app/actions/addToPlaylist.ts` | `src/mocks/playlistMemory.ts` |
| Lecteur | `src/app/lecture/[playlistId]/[position]/page.tsx`, `src/components/reader/**` | `getPlaylist` fictif |
| Clubs, membres, réglages, rejoindre | `src/app/clubs/**`, `src/app/rejoindre/[code]/page.tsx`, `src/components/club/**`, `src/app/actions/clubs.ts` | `src/mocks/clubStore.ts` |
| Moi, Compte | `src/app/moi/**`, `src/components/me/**`, `src/app/actions/account.ts` | `src/mocks/account.ts` |
| Aperçus de développement | `src/app/apercu/session`, `src/app/actions/demo.ts` (`setDemoSession`) | supprimés (tâche 11) |

Ce qui **reste fictif** jusqu'au plan 3 : les propositions, la modération, les signalements (`src/mocks/proposals.ts`, `moderation*.ts`, `reports.ts`, `songStore.ts`), et donc la branche fictive de la passerelle `src/lib/catalog/read.ts` (`getSong` d'un identifiant non UUID). Le nombre de « contributions en attente » de `/moi` reste fictif.

## Structure des fichiers

```text
src/lib/db/schema.ts                    + users, sessions, accounts, verifications, clubs, club_members, playlists, playlist_items
drizzle/0002_accounts_clubs_playlists.sql   migration générée
src/lib/db/errors.ts                    isUniqueViolation
src/lib/db/sqlList.ts                   inList (liste de paramètres SQL)
src/lib/mail/transport.ts               sendMail, mailTransport, readOutbox (SMTP ou boîte locale)
src/lib/mail/magicLinkEmail.ts          sujet, texte et HTML du lien magique, en français et en arabe
src/lib/auth/auth.ts                    configuration Better Auth (server-only)
src/lib/auth/types.ts                   CurrentUser, GlobalRole, ClubMembershipRef, toCurrentUser
src/lib/auth/name.ts                    defaultNameFromEmail, normalizeUserName
src/lib/auth/magicLinkLimit.ts          allowMagicLinkRequest
src/lib/auth/permissions.ts             canModerate, canCreateClub, clubRoleOf, canManageClub, canViewPlaylist, canEditPlaylist, canCopyPlaylist
src/lib/auth/signInCookie.ts            cookie de l'adresse « envoyée à » (remplace DEMO_MAGIC_LINK_COOKIE)
src/app/api/auth/[...all]/route.ts      routes de Better Auth
src/lib/session.ts                      getCurrentUser (session Better Auth + adhésions)
src/lib/clubs/types.ts                  Club, ClubSummary, ClubMember, ClubRef
src/lib/clubs/queries.ts                lectures des clubs et des adhésions
src/lib/clubs/write.ts                  création, renommage, invitation, suppression, promotion, adhésion
src/lib/playlist/queries.ts             lectures des playlists
src/lib/playlist/write.ts               création, ajout, édition, renommage, copie, suppression
src/lib/account/write.ts                nom, langue, suppression du compte
src/lib/account/roles.ts                setUserRoles (commande user:role)
scripts/user-role.ts                    pnpm user:role
scripts/seed-demo.ts                    pnpm seed:demo (comptes, clubs et playlists de démonstration)
tests/integration/factories.ts          insertUser, insertClub, insertSong
tests/e2e/support/signIn.ts             connexion par la boîte locale
```

Les fichiers de test sont donnés dans chaque tâche.

---

### Tâche 1 : schéma des comptes, des clubs et des playlists

**Fichiers :**
- Modifier : `src/lib/db/schema.ts`
- Créer : `drizzle/0002_accounts_clubs_playlists.sql` (généré), `src/lib/db/errors.ts`, `src/lib/db/sqlList.ts`, `tests/integration/factories.ts`
- Modifier : `tests/integration/helpers.ts`, `scripts/seed-fixtures.ts`
- Test : `tests/integration/accountsSchema.test.ts`, `tests/unit/db/errors.test.ts`

**Interfaces :**
- Produit (schéma Drizzle) : `users`, `sessions`, `accounts`, `verifications`, `clubs`, `clubMembers`, `playlists`, `playlistItems`, et les enums `globalRoleEnum`, `localeEnum`, `clubRoleEnum`. Les clés JavaScript sont en camelCase, car Better Auth adresse les colonnes par ces clés. Les noms de colonnes SQL sont en snake_case.
- Produit : `isUniqueViolation(error: unknown): boolean`, `inList(values: readonly string[]): SQL`.
- Produit (tests) : `insertUser(overrides?: Partial<NewUser>): Promise<{ id: string; email: string; name: string }>`, `insertClub(input: { name: string; slug?: string; inviteCode?: string; animatorIds: string[]; memberIds?: string[] }): Promise<{ id: string; slug: string; inviteCode: string }>`, `insertSong(title: string): Promise<string>`.

- [ ] **Étape 1 : écrire les tests du schéma, qui doivent échouer.**

`tests/integration/factories.ts` :

```ts
// Plan 2, tâche 1 : fabriques des tests d'intégration (utilisateurs, clubs, chansons).
import { db } from "@/lib/db/client";
import { clubMembers, clubs, songs, users } from "@/lib/db/schema";

export type NewUser = typeof users.$inferInsert;

let counter = 0;
const next = () => (counter += 1);

export async function insertUser(overrides: Partial<NewUser> = {}) {
  const n = next();
  const [row] = await db
    .insert(users)
    .values({ name: `Personne ${n}`, email: `personne${n}@example.com`, emailVerified: true, ...overrides })
    .returning({ id: users.id, email: users.email, name: users.name });
  return row;
}

export async function insertClub(input: {
  name: string;
  slug?: string;
  inviteCode?: string;
  animatorIds: string[];
  memberIds?: string[];
}) {
  const n = next();
  const [club] = await db
    .insert(clubs)
    .values({
      name: input.name,
      slug: input.slug ?? `club-${n}`,
      inviteCode: input.inviteCode ?? `code${String(n).padStart(6, "0")}`,
      createdBy: input.animatorIds[0] ?? null,
    })
    .returning({ id: clubs.id, slug: clubs.slug, inviteCode: clubs.inviteCode });
  const rows = [
    ...input.animatorIds.map((userId) => ({ clubId: club.id, userId, role: "animator" as const })),
    ...(input.memberIds ?? []).map((userId) => ({ clubId: club.id, userId, role: "member" as const })),
  ];
  if (rows.length > 0) await db.insert(clubMembers).values(rows);
  return club;
}

/** Chanson publiée minimale (les colonnes de recherche restent vides : ces tests ne cherchent pas). */
export async function insertSong(title: string): Promise<string> {
  const n = next();
  const [row] = await db
    .insert(songs)
    .values({ titleLatin: title, lyrics: "سطر\nسطر", source: "public_domain", sourceRef: `test-${n}`, dedupeKey: `test-${n}` })
    .returning({ id: songs.id });
  return row.id;
}
```

`tests/integration/accountsSchema.test.ts` :

```ts
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { clubMembers, playlistItems, playlists, users } from "@/lib/db/schema";
import { insertClub, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("schéma des comptes, des clubs et des playlists", () => {
  beforeEach(resetDb);

  it("donne un UUID et les valeurs par défaut à un nouvel utilisateur", async () => {
    const { id } = await insertUser();
    const [row] = await db.select().from(users).where(eq(users.id, id));
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row).toMatchObject({ globalRole: "member", isAnimator: false, locale: "fr" });
  });

  it("refuse deux comptes avec la même adresse", async () => {
    await insertUser({ email: "leila@example.com" });
    await expect(insertUser({ email: "leila@example.com" })).rejects.toThrow();
  });

  it("exige qu'une playlist appartienne soit à un utilisateur, soit à un club", async () => {
    const user = await insertUser();
    const club = await insertClub({ name: "Les Jasmins", animatorIds: [user.id] });
    await expect(db.insert(playlists).values({ name: "Sans propriétaire" })).rejects.toThrow();
    await expect(
      db.insert(playlists).values({ name: "Les deux", ownerUserId: user.id, clubId: club.id }),
    ).rejects.toThrow();
    await db.insert(playlists).values({ name: "Personnelle", ownerUserId: user.id });
    await db.insert(playlists).values({ name: "De club", clubId: club.id });
  });

  it("refuse une chanson en double et deux chansons à la même position", async () => {
    const user = await insertUser();
    const [a, b] = [await insertSong("A"), await insertSong("B")];
    const [p] = await db.insert(playlists).values({ name: "P", ownerUserId: user.id }).returning();
    await db.insert(playlistItems).values({ playlistId: p.id, songId: a, position: 1 });
    await expect(db.insert(playlistItems).values({ playlistId: p.id, songId: a, position: 2 })).rejects.toThrow();
    await expect(db.insert(playlistItems).values({ playlistId: p.id, songId: b, position: 1 })).rejects.toThrow();
  });

  it("supprime les playlists personnelles et les adhésions d'un compte supprimé", async () => {
    const leila = await insertUser();
    const sami = await insertUser({ isAnimator: true });
    const club = await insertClub({ name: "Les Jasmins", animatorIds: [sami.id], memberIds: [leila.id] });
    await db.insert(playlists).values({ name: "Mes préférées", ownerUserId: leila.id });
    await db.insert(playlists).values({ name: "Séance", clubId: club.id, createdBy: leila.id });

    await db.delete(users).where(eq(users.id, leila.id));

    const left = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM playlists`);
    expect(Number(left.rows[0].n)).toBe(1); // la playlist du club reste, sans créateur
    expect(await db.select().from(clubMembers).where(eq(clubMembers.userId, leila.id))).toEqual([]);
  });

  it("supprime les adhésions et les playlists d'un club supprimé", async () => {
    const sami = await insertUser({ isAnimator: true });
    const club = await insertClub({ name: "Malouf Sfax", animatorIds: [sami.id] });
    await db.insert(playlists).values({ name: "Séance", clubId: club.id });
    await db.execute(sql`DELETE FROM clubs WHERE id = ${club.id}`);
    const left = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM playlists`);
    expect(Number(left.rows[0].n)).toBe(0);
  });
});
```

`tests/unit/db/errors.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "@/lib/db/errors";

describe("isUniqueViolation", () => {
  it("reconnaît le code 23505, directement ou dans la cause (erreur Drizzle)", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ message: "Failed query", cause: { code: "23505" } })).toBe(true);
  });

  it("ignore les autres erreurs", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
    expect(isUniqueViolation(new Error("boom"))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/db` puis `pnpm test:integration -- tests/integration/accountsSchema.test.ts`. Attendu : FAIL, modules et tables introuvables.

- [ ] **Étape 3 : écrire le schéma.** Ajouter à la fin de `src/lib/db/schema.ts`, et compléter l'import de `drizzle-orm/pg-core` avec `check` et `index` :

```ts
// Plan 2, tâche 1 : comptes (tables imposées par Better Auth, spec §5 adaptée), clubs et playlists (spec §5, §10).
export const globalRoleEnum = pgEnum("global_role", ["member", "moderator", "admin"]);
export const localeEnum = pgEnum("locale", ["fr", "ar"]);
export const clubRoleEnum = pgEnum("club_role", ["animator", "member"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    globalRole: globalRoleEnum("global_role").notNull().default("member"),
    isAnimator: boolean("is_animator").notNull().default(false),
    locale: localeEnum("locale").notNull().default("fr"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [uniqueIndex("sessions_token_uq").on(t.token), index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const clubs = pgTable(
  "clubs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    inviteCode: text("invite_code").notNull(),
    // Le créateur peut supprimer son compte une fois le club confié à un autre animateur.
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("clubs_slug_uq").on(t.slug), uniqueIndex("clubs_invite_code_uq").on(t.inviteCode)],
);

export const clubMembers = pgTable(
  "club_members",
  {
    clubId: uuid("club_id")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: clubRoleEnum("role").notNull().default("member"),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.clubId, t.userId] }), index("club_members_user_idx").on(t.userId)],
);

export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    check("playlists_owner_ck", sql`(${t.ownerUserId} IS NULL) <> (${t.clubId} IS NULL)`),
    index("playlists_owner_idx").on(t.ownerUserId),
    index("playlists_club_idx").on(t.clubId),
  ],
);

export const playlistItems = pgTable(
  "playlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    // Pas de cascade : une chanson n'est jamais supprimée, seulement retirée (spec §5, retrait doux).
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id),
    position: integer("position").notNull(),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("playlist_items_position_uq").on(t.playlistId, t.position),
    uniqueIndex("playlist_items_song_uq").on(t.playlistId, t.songId),
  ],
);
```

- [ ] **Étape 4 : écrire `errors.ts` et `sqlList.ts`.**

`src/lib/db/errors.ts` :

```ts
/**
 * Violation d'une contrainte d'unicité (code PostgreSQL 23505). Drizzle enveloppe l'erreur du pilote :
 * le code est alors dans `cause`.
 */
export function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown) =>
    typeof value === "object" && value !== null && "code" in value ? (value as { code: unknown }).code : undefined;
  if (code(error) === "23505") return true;
  const cause = typeof error === "object" && error !== null && "cause" in error ? (error as { cause: unknown }).cause : undefined;
  return code(cause) === "23505";
}
```

`src/lib/db/sqlList.ts` :

```ts
import { sql, type SQL } from "drizzle-orm";

/** `a, b, c` en paramètres SQL, pour `IN (...)`. L'appelant écarte la liste vide (`IN ()` est invalide). */
export const inList = (values: readonly string[]): SQL =>
  sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  );
```

- [ ] **Étape 5 : générer la migration et mettre à jour la remise à zéro des tests.** Lancer `pnpm db:generate --name accounts_clubs_playlists`. Relire `drizzle/0002_accounts_clubs_playlists.sql` : on y attend les trois enums, les huit tables, la contrainte `playlists_owner_ck`, et les clés étrangères en `ON DELETE cascade` ou `set null` comme ci-dessus. Puis, dans `tests/integration/helpers.ts` :

```ts
export async function resetDb(): Promise<void> {
  await db.execute(sql`TRUNCATE playlist_items, playlists, club_members, clubs, verifications, accounts, sessions,
    users, song_artists, songs, artists, rate_limits CASCADE`);
}
```

Dans `scripts/seed-fixtures.ts`, remplacer le `TRUNCATE` par la même liste de tables, pour que les tests de bout en bout repartent sans comptes.

- [ ] **Étape 6 : appliquer la migration et relancer les tests.** Lancer `pnpm db:migrate`, puis `pnpm test -- tests/unit/db` et `pnpm test:integration`. Attendu : PASS, y compris les tests d'intégration du plan 1.

- [ ] **Étape 7 : commit.**

```bash
git add src/lib/db drizzle tests/integration tests/unit/db scripts/seed-fixtures.ts
git commit -m "feat(db): accounts, clubs and playlists schema"
```

---

### Tâche 2 : envoi des e-mails (SMTP ou boîte locale)

**Fichiers :**
- Créer : `src/lib/mail/transport.ts`, `src/lib/mail/magicLinkEmail.ts`
- Modifier : `messages/fr.json`, `messages/ar.json` (clés `mail.magicLink.*`), `.env.example`, `.gitignore`, `package.json` (dépendance `nodemailer`)
- Test : `tests/unit/mail/transport.test.ts`, `tests/unit/mail/magicLinkEmail.test.ts`

**Interfaces :**
- Produit : `interface MailMessage { to: string; subject: string; text: string; html: string; link?: string }`. `link` est l'adresse que l'e-mail invite à ouvrir : la boîte locale la garde pour que l'aperçu de développement et les tests puissent l'ouvrir.
- Produit : `mailTransport(env?: NodeJS.ProcessEnv): "smtp" | "outbox"`, `sendMail(message: MailMessage): Promise<void>`, `readOutbox(email: string): Promise<OutboxEntry | null>` avec `interface OutboxEntry extends MailMessage { sentAt: string }`.
- Produit : `magicLinkEmail({ url, locale }: { url: string; locale: "fr" | "ar" }): { subject: string; text: string; html: string }`.

- [ ] **Étape 1 : installer nodemailer.** Lancer `pnpm add nodemailer`, puis `pnpm add -D @types/nodemailer`. Ajouter `.outbox/` au `.gitignore`.

- [ ] **Étape 2 : écrire les tests, qui doivent échouer.**

`tests/unit/mail/transport.test.ts` :

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mailTransport, readOutbox, sendMail } from "@/lib/mail/transport";

describe("mailTransport", () => {
  it("écrit dans la boîte locale hors production, sauf demande contraire", () => {
    expect(mailTransport({ NODE_ENV: "development" })).toBe("outbox");
    expect(mailTransport({ NODE_ENV: "test" })).toBe("outbox");
    expect(mailTransport({ NODE_ENV: "development", MAIL_TRANSPORT: "smtp" })).toBe("smtp");
  });

  it("envoie par SMTP en production, sauf si la boîte locale est demandée (tests de bout en bout)", () => {
    expect(mailTransport({ NODE_ENV: "production" })).toBe("smtp");
    expect(mailTransport({ NODE_ENV: "production", MAIL_TRANSPORT: "outbox" })).toBe("outbox");
  });
});

describe("boîte locale", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "ghnaya-outbox-"));
    process.env.MAIL_TRANSPORT = "outbox";
    process.env.OUTBOX_DIR = dir;
  });
  afterEach(async () => {
    delete process.env.MAIL_TRANSPORT;
    delete process.env.OUTBOX_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  it("garde le dernier message de chaque adresse, lien compris", async () => {
    await sendMail({ to: "Leila@Example.com", subject: "1", text: "t", html: "h", link: "http://x/1" });
    await sendMail({ to: "leila@example.com", subject: "2", text: "t", html: "h", link: "http://x/2" });
    const entry = await readOutbox("LEILA@example.com");
    expect(entry).toMatchObject({ subject: "2", link: "http://x/2" });
    expect(entry?.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("renvoie null pour une adresse sans message", async () => {
    expect(await readOutbox("personne@example.com")).toBeNull();
  });
});
```

`tests/unit/mail/magicLinkEmail.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { magicLinkEmail } from "@/lib/mail/magicLinkEmail";

const url = "https://ghnaya.example/api/auth/magic-link/verify?token=abc&callbackURL=%2F";

describe("magicLinkEmail", () => {
  it("donne le lien en texte et en HTML, en français", () => {
    const mail = magicLinkEmail({ url, locale: "fr" });
    expect(mail.subject).toContain("Ghnaya");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain('lang="fr"');
    expect(mail.html).toContain(url.replaceAll("&", "&amp;"));
  });

  it("écrit l'e-mail arabe de droite à gauche", () => {
    const mail = magicLinkEmail({ url, locale: "ar" });
    expect(mail.html).toContain('dir="rtl"');
    expect(mail.html).toContain('lang="ar"');
    expect(mail.text).toContain(url);
  });

  it("échappe le HTML de l'adresse", () => {
    const mail = magicLinkEmail({ url: 'https://x/"><script>', locale: "fr" });
    expect(mail.html).not.toContain("<script>");
  });
});
```

- [ ] **Étape 3 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/mail`. Attendu : FAIL, modules introuvables.

- [ ] **Étape 4 : ajouter les messages.** Dans `messages/fr.json`, au premier niveau :

```json
"mail": {
  "magicLink": {
    "subject": "Votre lien de connexion à Ghnaya",
    "greeting": "Bonjour,",
    "body": "Touchez le bouton ci-dessous pour vous connecter à Ghnaya. Le lien est valable 15 minutes et ne sert qu'une fois.",
    "button": "Me connecter",
    "fallback": "Si le bouton ne marche pas, copiez cette adresse dans votre navigateur :",
    "ignore": "Vous n'avez rien demandé ? Ignorez cet e-mail : personne ne pourra se connecter sans ce lien."
  }
}
```

Dans `messages/ar.json` :

```json
"mail": {
  "magicLink": {
    "subject": "رابط الدخول إلى غنّايا",
    "greeting": "مرحبًا،",
    "body": "اضغط على الزر أسفله للدخول إلى غنّايا. الرابط صالح لمدة 15 دقيقة ولمرة واحدة فقط.",
    "button": "الدخول",
    "fallback": "إذا لم يعمل الزر، انسخ هذا العنوان في متصفحك:",
    "ignore": "لم تطلب شيئًا؟ تجاهل هذه الرسالة: لا يمكن لأحد الدخول دون هذا الرابط."
  }
}
```

Vérifier le nom de l'application en arabe dans `messages/ar.json` (`app.name`) et l'utiliser à la place de « غنّايا » s'il diffère. Le test `tests/unit/i18n/messages.test.ts` vérifie que les deux fichiers ont les mêmes clés.

- [ ] **Étape 5 : implémenter.**

`src/lib/mail/magicLinkEmail.ts` :

```ts
import { createTranslator } from "next-intl";
import ar from "../../../messages/ar.json";
import fr from "../../../messages/fr.json";

const MESSAGES = { fr, ar } as const;

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** E-mail du lien magique, dans la langue de l'interface au moment de la demande. */
export function magicLinkEmail({ url, locale }: { url: string; locale: "fr" | "ar" }) {
  const t = createTranslator({ locale, messages: MESSAGES[locale], namespace: "mail.magicLink" });
  const dir = locale === "ar" ? "rtl" : "ltr";
  const href = escapeHtml(url);

  const text = [t("greeting"), "", t("body"), "", url, "", t("ignore")].join("\n");
  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #1b1f3a;">
  <p>${escapeHtml(t("greeting"))}</p>
  <p>${escapeHtml(t("body"))}</p>
  <p><a href="${href}" style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: #1b1f3a; color: #ffffff; text-decoration: none;">${escapeHtml(t("button"))}</a></p>
  <p>${escapeHtml(t("fallback"))}<br><span dir="ltr" style="word-break: break-all;">${href}</span></p>
  <p style="color: #5b5f7a;">${escapeHtml(t("ignore"))}</p>
</body>
</html>`;
  return { subject: t("subject"), text, html };
}
```

`src/lib/mail/transport.ts` :

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";

/**
 * Envoi des e-mails (plan 2, tâche 2). En production : SMTP (`SMTP_URL`, `MAIL_FROM`), quel que soit le
 * fournisseur. Ailleurs, ou si `MAIL_TRANSPORT=outbox` : rien ne part, le dernier message de chaque adresse
 * est écrit dans `.outbox/` (ou `OUTBOX_DIR`). L'aperçu « Ouvrir le lien reçu » de la connexion et les tests
 * de bout en bout y lisent le lien. Ne jamais régler `outbox` sur le serveur de production.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Adresse que le message invite à ouvrir (lien magique) : gardée par la boîte locale. */
  link?: string;
}

export interface OutboxEntry extends MailMessage {
  sentAt: string;
}

export function mailTransport(env: NodeJS.ProcessEnv = process.env): "smtp" | "outbox" {
  if (env.MAIL_TRANSPORT === "smtp" || env.MAIL_TRANSPORT === "outbox") return env.MAIL_TRANSPORT;
  return env.NODE_ENV === "production" ? "smtp" : "outbox";
}

const outboxDir = () => process.env.OUTBOX_DIR ?? join(process.cwd(), ".outbox");
const outboxFile = (email: string) => join(outboxDir(), `${encodeURIComponent(email.trim().toLowerCase())}.json`);

let smtp: nodemailer.Transporter | undefined;

export async function sendMail(message: MailMessage): Promise<void> {
  if (mailTransport() === "outbox") {
    await mkdir(outboxDir(), { recursive: true });
    const entry: OutboxEntry = { ...message, sentAt: new Date().toISOString() };
    await writeFile(outboxFile(message.to), JSON.stringify(entry, null, 2));
    return;
  }
  const url = process.env.SMTP_URL;
  const from = process.env.MAIL_FROM;
  if (!url || !from) throw new Error("SMTP_URL et MAIL_FROM sont nécessaires pour envoyer un e-mail.");
  smtp ??= nodemailer.createTransport(url);
  await smtp.sendMail({ from, to: message.to, subject: message.subject, text: message.text, html: message.html });
}

/** Dernier message envoyé à `email` dans la boîte locale, ou `null`. */
export async function readOutbox(email: string): Promise<OutboxEntry | null> {
  try {
    return JSON.parse(await readFile(outboxFile(email), "utf8")) as OutboxEntry;
  } catch {
    return null;
  }
}
```

Si `tsc` refuse l'import des fichiers JSON, vérifier que `resolveJsonModule` est actif dans `tsconfig.json`, et l'activer sinon.

- [ ] **Étape 6 : compléter `.env.example`.**

```bash
# Comptes (plan 2). Secret : openssl rand -base64 32
BETTER_AUTH_SECRET=remplacer-par-un-secret-de-32-caracteres-au-moins
BETTER_AUTH_URL=http://localhost:3000
# Google : facultatif en développement (le bouton est masqué sans ces deux valeurs).
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# E-mails : boîte locale (.outbox/) hors production ; en production, SMTP.
# MAIL_TRANSPORT=outbox
SMTP_URL=
MAIL_FROM="Ghnaya <connexion@exemple.com>"
```

Copier les deux premières lignes dans `.env`, avec un vrai secret.

- [ ] **Étape 7 : relancer les tests.** Lancer `pnpm test -- tests/unit/mail tests/unit/i18n`. Attendu : PASS.

- [ ] **Étape 8 : commit.**

```bash
git add src/lib/mail messages tests/unit/mail .env.example .gitignore package.json pnpm-lock.yaml tsconfig.json
git commit -m "feat(mail): SMTP or local outbox transport and the magic link email"
```

---

### Tâche 3 : Better Auth, session courante et permissions de base

**Fichiers :**
- Créer : `src/lib/auth/auth.ts`, `src/lib/auth/types.ts`, `src/lib/auth/name.ts`, `src/lib/auth/permissions.ts`, `src/app/api/auth/[...all]/route.ts`, `src/lib/clubs/queries.ts` (première fonction)
- Modifier : `src/lib/session.ts`, `src/lib/auth/gate.ts`, `src/lib/moderation/gate.ts`, `src/app/moi/page.tsx` (type seulement), `src/lib/playlist/addToPlaylist.ts` (commentaire), `package.json`
- Test : `tests/unit/auth/name.test.ts`, `tests/unit/auth/currentUser.test.ts`, `tests/unit/auth/support.ts`, `tests/unit/auth/permissions.test.ts`, `tests/integration/auth.test.ts`

**Interfaces :**
- Produit : `type GlobalRole = "member" | "moderator" | "admin"`.
- Produit : `interface ClubMembershipRef { slug: string; name: string; role: ClubRole }`.
- Produit : `interface CurrentUser { id: string; name: string; email: string; locale: "fr" | "ar"; globalRole: GlobalRole; isAnimator: boolean; isModerator: boolean; clubs: ClubMembershipRef[]; clubSlugs: string[] }`. `clubSlugs` est gardé, car les écrans s'en servent déjà. Il vaut `clubs.map((c) => c.slug)`.
- Produit : `toCurrentUser(user: { id; name; email; globalRole?; isAnimator?; locale? }, clubs: ClubMembershipRef[]): CurrentUser`.
- Produit : `getAuth()` (instance Better Auth, créée au premier appel), `isGoogleEnabled(): boolean`, `MAGIC_LINK_TTL_SECONDS = 900`.
- Produit : `defaultNameFromEmail(email: string): string`, `normalizeUserName(raw: unknown): { ok: true; name: string } | { ok: false; error: "required" | "tooLong" }`, `USER_NAME_MAX = 60`.
- Produit : `canModerate(user: CurrentUser | null): boolean`, `canCreateClub(user: CurrentUser | null): boolean`.
- Produit : `membershipsOf(userId: string): Promise<ClubMembershipRef[]>`, dans l'ordre d'adhésion.
- `getCurrentUser(): Promise<CurrentUser | null>` et `requireUser(retour): Promise<CurrentUser>` gardent leur nom.

- [ ] **Étape 1 : installer Better Auth.** Lancer `pnpm add better-auth`. L'adaptateur Drizzle (`better-auth/adapters/drizzle`) est une dépendance du paquet. Si pnpm signale un script de compilation bloqué, l'autoriser dans `allowBuilds` de `pnpm-workspace.yaml`, comme au plan 1.

- [ ] **Étape 2 : écrire les tests unitaires, qui doivent échouer.**

`tests/unit/auth/name.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { USER_NAME_MAX, defaultNameFromEmail, normalizeUserName } from "@/lib/auth/name";

describe("defaultNameFromEmail", () => {
  it("prend la partie avant @", () => {
    expect(defaultNameFromEmail("leila@example.com")).toBe("leila");
    expect(defaultNameFromEmail("sami.trabelsi+club@gmail.com")).toBe("sami.trabelsi");
  });

  it("ne renvoie jamais un nom vide", () => {
    expect(defaultNameFromEmail("@example.com")).toBe("example.com");
    expect(defaultNameFromEmail("")).toBe("Membre");
  });
});

describe("normalizeUserName", () => {
  it("nettoie les espaces et accepte l'arabe", () => {
    expect(normalizeUserName("  Leïla   Ben Salah ")).toEqual({ ok: true, name: "Leïla Ben Salah" });
    expect(normalizeUserName("سلمى")).toEqual({ ok: true, name: "سلمى" });
  });

  it("refuse un nom vide ou trop long", () => {
    expect(normalizeUserName("   ")).toEqual({ ok: false, error: "required" });
    expect(normalizeUserName(42)).toEqual({ ok: false, error: "required" });
    expect(normalizeUserName("a".repeat(USER_NAME_MAX + 1))).toEqual({ ok: false, error: "tooLong" });
  });
});
```

`tests/unit/auth/currentUser.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { toCurrentUser } from "@/lib/auth/types";

const base = { id: "u1", name: "Leïla", email: "leila@example.com" };

describe("toCurrentUser", () => {
  it("donne les valeurs par défaut d'un membre", () => {
    expect(toCurrentUser(base, [])).toEqual({
      ...base,
      locale: "fr",
      globalRole: "member",
      isAnimator: false,
      isModerator: false,
      clubs: [],
      clubSlugs: [],
    });
  });

  it("un modérateur et un admin modèrent", () => {
    expect(toCurrentUser({ ...base, globalRole: "moderator" }, []).isModerator).toBe(true);
    expect(toCurrentUser({ ...base, globalRole: "admin" }, []).isModerator).toBe(true);
  });

  it("garde l'ordre des clubs et en tire les slugs", () => {
    const clubs = [
      { slug: "les-jasmins", name: "Les Jasmins", role: "animator" as const },
      { slug: "malouf-sfax", name: "Malouf Sfax", role: "member" as const },
    ];
    expect(toCurrentUser({ ...base, isAnimator: true }, clubs).clubSlugs).toEqual(["les-jasmins", "malouf-sfax"]);
  });

  it("ignore un rôle ou une langue inconnus", () => {
    const user = toCurrentUser({ ...base, globalRole: "root", locale: "en" }, []);
    expect(user.globalRole).toBe("member");
    expect(user.locale).toBe("fr");
  });
});
```

`tests/unit/auth/support.ts`, fabrique partagée par les tests de permissions :

```ts
import { toCurrentUser, type ClubMembershipRef, type GlobalRole } from "@/lib/auth/types";

/** Utilisateur courant de test : membre sans club par défaut. */
export const userWith = (over: { globalRole?: GlobalRole; isAnimator?: boolean; clubs?: ClubMembershipRef[] } = {}) =>
  toCurrentUser(
    { id: "u1", name: "Test", email: "t@example.com", globalRole: over.globalRole, isAnimator: over.isAnimator },
    over.clubs ?? [],
  );
```

`tests/unit/auth/permissions.test.ts`, première version (les tâches 6 et 7 la complètent) :

```ts
import { describe, expect, it } from "vitest";
import { canCreateClub, canModerate } from "@/lib/auth/permissions";
import { userWith } from "./support";

describe("permissions de base", () => {
  it("seuls les modérateurs et les admins modèrent", () => {
    expect(canModerate(null)).toBe(false);
    expect(canModerate(userWith())).toBe(false);
    expect(canModerate(userWith({ globalRole: "moderator" }))).toBe(true);
    expect(canModerate(userWith({ globalRole: "admin" }))).toBe(true);
  });

  it("seuls les animateurs créent un club", () => {
    expect(canCreateClub(null)).toBe(false);
    expect(canCreateClub(userWith())).toBe(false);
    expect(canCreateClub(userWith({ globalRole: "admin" }))).toBe(false);
    expect(canCreateClub(userWith({ isAnimator: true }))).toBe(true);
  });
});
```


- [ ] **Étape 3 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/auth`. Attendu : FAIL, modules introuvables (les tests existants `email` et `returnPath` passent).

- [ ] **Étape 4 : implémenter `name.ts`, `types.ts` et `permissions.ts`.**

`src/lib/auth/name.ts` :

```ts
/** Nom d'un compte (affiché dans les clubs) : 60 caractères au plus, espaces nettoyés. */
export const USER_NAME_MAX = 60;

const clean = (raw: string) => raw.normalize("NFC").replace(/\s+/g, " ").trim();

/** Nom par défaut d'un compte créé par lien magique : la partie avant @ (écart 3 du plan 2). */
export function defaultNameFromEmail(email: string): string {
  const [local, domain] = email.split("@");
  const name = clean(local?.split("+")[0] ?? "") || clean(domain ?? "");
  return name.slice(0, USER_NAME_MAX) || "Membre";
}

export type UserNameCheck = { ok: true; name: string } | { ok: false; error: "required" | "tooLong" };

export function normalizeUserName(raw: unknown): UserNameCheck {
  const name = typeof raw === "string" ? clean(raw) : "";
  if (!name) return { ok: false, error: "required" };
  if ([...name].length > USER_NAME_MAX) return { ok: false, error: "tooLong" };
  return { ok: true, name };
}
```

`src/lib/auth/types.ts` :

```ts
import type { ClubRole } from "@/lib/clubs/membership";

/**
 * Utilisateur connecté, tel que les pages et les actions le voient (plan 2). Remplace `DemoUser` de la
 * maquette, avec les mêmes champs (`isAnimator`, `isModerator`, `clubSlugs`), plus les rôles par club.
 */
export const GLOBAL_ROLES = ["member", "moderator", "admin"] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];

export interface ClubMembershipRef {
  slug: string;
  name: string;
  /** Rôle dans ce club (`club_members.role`) : c'est lui qui donne le droit de modifier ses playlists. */
  role: ClubRole;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  locale: "fr" | "ar";
  globalRole: GlobalRole;
  /** Attribué par un admin : créer des clubs et en animer plusieurs (spec §4.3). */
  isAnimator: boolean;
  /** Modérateur ou admin. */
  isModerator: boolean;
  /** Clubs dans l'ordre d'adhésion (un seul pour un membre). */
  clubs: ClubMembershipRef[];
  clubSlugs: string[];
}

interface SessionUserFields {
  id: string;
  name: string;
  email: string;
  globalRole?: unknown;
  isAnimator?: unknown;
  locale?: unknown;
}

const isGlobalRole = (value: unknown): value is GlobalRole => GLOBAL_ROLES.includes(value as GlobalRole);

export function toCurrentUser(user: SessionUserFields, clubs: ClubMembershipRef[]): CurrentUser {
  const globalRole = isGlobalRole(user.globalRole) ? user.globalRole : "member";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    locale: user.locale === "ar" ? "ar" : "fr",
    globalRole,
    isAnimator: user.isAnimator === true,
    isModerator: globalRole !== "member",
    clubs,
    clubSlugs: clubs.map((club) => club.slug),
  };
}
```

`src/lib/auth/permissions.ts` :

```ts
import type { CurrentUser } from "./types";

/**
 * Qui peut faire quoi (spec §4.2 et §4.3) : le seul endroit où l'on en décide. Les pages s'en servent pour
 * afficher ou non une action, et les Server Actions pour la refuser. Fonctions pures, sans accès à la base :
 * l'appelant leur passe l'utilisateur courant (`getCurrentUser`) et l'objet visé, lus juste avant.
 */

export const canModerate = (user: CurrentUser | null): boolean => user?.isModerator ?? false;

/** Créer un club : réservé aux animateurs, rôle attribué par un admin (spec §10). */
export const canCreateClub = (user: CurrentUser | null): boolean => user?.isAnimator ?? false;
```

- [ ] **Étape 5 : écrire la configuration de Better Auth.**

`src/lib/auth/auth.ts` :

```ts
import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { magicLinkEmail } from "@/lib/mail/magicLinkEmail";
import { sendMail } from "@/lib/mail/transport";
import { defaultNameFromEmail } from "./name";

/**
 * Comptes et sessions (plan 2, tâche 3). Sessions en base (tables `sessions`, `accounts`, `verifications`),
 * identifiants UUID générés par PostgreSQL. Connexion par lien magique et, si configuré, par Google.
 * Le compte est créé à la première connexion (spec §4.1).
 */
export const MAGIC_LINK_TTL_SECONDS = 15 * 60;

export const isGoogleEnabled = (): boolean =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const createAuth = () =>
  betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
    advanced: { database: { generateId: "uuid" } },
    user: {
      // Champs gérés par le serveur seulement (`input: false`) : ni l'inscription ni la mise à jour du profil
      // ne peuvent les fixer. Les rôles changent par `pnpm user:role`.
      additionalFields: {
        globalRole: { type: ["member", "moderator", "admin"], required: false, defaultValue: "member", input: false },
        isAnimator: { type: "boolean", required: false, defaultValue: false, input: false },
        locale: { type: ["fr", "ar"], required: false, defaultValue: "fr", input: false },
      },
    },
    socialProviders: isGoogleEnabled()
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
      : {},
    databaseHooks: {
      user: {
        create: {
          // Lien magique : Better Auth crée le compte avec un nom vide (écart 3).
          before: async (user) => ({ data: { ...user, name: user.name?.trim() || defaultNameFromEmail(user.email) } }),
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_TTL_SECONDS,
        sendMagicLink: async ({ email, url, metadata }) => {
          const locale = metadata?.locale === "ar" ? "ar" : "fr";
          await sendMail({ to: email, ...magicLinkEmail({ url, locale }), link: url });
        },
      }),
      // En dernier (documentation de Better Auth) : pose les cookies de session depuis les Server Actions.
      nextCookies(),
    ],
  });

let instance: ReturnType<typeof createAuth> | undefined;

/**
 * Instance créée au premier usage, et non à l'import : Better Auth s'initialise tout de suite et refuse,
 * en production, de démarrer sans `BETTER_AUTH_SECRET`. Or `next build` charge ce module sans secret,
 * et l'image Docker de la CI sert l'accueil sans configuration.
 */
export const getAuth = () => (instance ??= createAuth());

export type AuthSession = ReturnType<typeof createAuth>["$Infer"]["Session"];
```

`src/app/api/auth/[...all]/route.ts` :

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/auth";

// Routes de Better Auth : vérification du lien magique, retour de Google, déconnexion côté client.
export const GET = (request: Request) => toNextJsHandler(getAuth()).GET(request);
export const POST = (request: Request) => toNextJsHandler(getAuth()).POST(request);
```

- [ ] **Étape 6 : écrire le test d'intégration de la connexion par lien magique, qui doit échouer.**

`tests/integration/auth.test.ts` :

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getAuth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";
import { readOutbox } from "@/lib/mail/transport";
import { resetDb } from "./helpers";

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "ghnaya-auth-"));
  process.env.MAIL_TRANSPORT = "outbox";
  process.env.OUTBOX_DIR = dir;
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** Demande un lien, le lit dans la boîte locale, puis l'ouvre (sans callbackURL : réponse JSON). */
async function signInByMagicLink(email: string, locale: "fr" | "ar" = "fr") {
  await getAuth().api.signInMagicLink({ body: { email, metadata: { locale } }, headers: new Headers() });
  const entry = await readOutbox(email);
  const token = new URL(entry!.link!).searchParams.get("token")!;
  await getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() });
  return entry!;
}

describe("connexion par lien magique", () => {
  beforeEach(resetDb);

  it("crée le compte à la première connexion, adresse vérifiée, nom tiré de l'adresse", async () => {
    await signInByMagicLink("leila@example.com");
    const [user] = await db.select().from(users).where(eq(users.email, "leila@example.com"));
    expect(user).toMatchObject({ name: "leila", emailVerified: true, globalRole: "member", isAnimator: false });
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(1);
  });

  it("retrouve le même compte à la connexion suivante", async () => {
    await signInByMagicLink("sami@example.com");
    await signInByMagicLink("sami@example.com");
    expect(await db.select().from(users).where(eq(users.email, "sami@example.com"))).toHaveLength(1);
  });

  it("écrit l'e-mail dans la langue demandée", async () => {
    const entry = await signInByMagicLink("nour@example.com", "ar");
    expect(entry.html).toContain('dir="rtl"');
  });

  it("un lien ne sert qu'une fois", async () => {
    await getAuth().api.signInMagicLink({ body: { email: "rania@example.com" }, headers: new Headers() });
    const token = new URL((await readOutbox("rania@example.com"))!.link!).searchParams.get("token")!;
    await getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() });
    await expect(getAuth().api.magicLinkVerify({ query: { token }, headers: new Headers() })).rejects.toThrow();
  });
});
```

Le projet Vitest `integration` doit fournir `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL`. Dans `vitest.config.mts`, ajouter à ce projet `env: { BETTER_AUTH_SECRET: "secret-de-test-secret-de-test-0123", BETTER_AUTH_URL: "http://localhost:3000" }`, en gardant la forme des autres options de ce projet.

Un lien réutilisé : Better Auth redirige vers l'adresse d'erreur avec `?error=INVALID_TOKEN`. Sans `callbackURL`, cette redirection remonte comme une exception de `auth.api`, d'où le `rejects`. Si la version installée renvoie une réponse au lieu de lever, adapter l'assertion et le noter dans le rapport de la tâche.

- [ ] **Étape 7 : brancher la session courante.**

Créer `src/lib/clubs/queries.ts`, que la tâche 6 complétera :

```ts
import "server-only";
import { sql } from "drizzle-orm";
import type { ClubMembershipRef } from "@/lib/auth/types";
import type { ClubRole } from "@/lib/clubs/membership";
import { db } from "@/lib/db/client";

/** Clubs de l'utilisateur, avec son rôle, dans l'ordre où il les a rejoints. */
export async function membershipsOf(userId: string): Promise<ClubMembershipRef[]> {
  const res = await db.execute<{ slug: string; name: string; role: ClubRole }>(sql`
    SELECT c.slug, c.name, m.role
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId}
    ORDER BY m.created_at, c.slug`);
  return res.rows;
}
```

Remplacer `src/lib/session.ts` :

```ts
import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { cache } from "react";
import { getAuth } from "@/lib/auth/auth";
import { toCurrentUser, type CurrentUser } from "@/lib/auth/types";
import { membershipsOf } from "@/lib/clubs/queries";

/**
 * Utilisateur courant (plan 2) : la session Better Auth, et ses clubs lus en base. Une fois par requête
 * (`cache`), même si la mise en page, la page et ses composants l'appellent chacun.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const requestHeaders = await headers();
  // Sans cookie de session, inutile de démarrer Better Auth ni d'interroger la base : un visiteur coûte
  // zéro requête, et les pages publiques restent servies sans secret (job docker de la CI).
  if (!getSessionCookie(requestHeaders)) return null;
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  return toCurrentUser(session.user, await membershipsOf(session.user.id));
});
```

Dans `src/lib/auth/gate.ts`, remplacer l'import de `DemoUser` par `import type { CurrentUser } from "./types";`, le type de retour de `requireUser` par `Promise<CurrentUser>`, et retirer la phrase « MAQUETTE… » du commentaire. Faire de même dans `src/lib/moderation/gate.ts` (qui teste `user.isModerator`, toujours valable) et dans `src/app/moi/page.tsx` (`DemoUser` → `CurrentUser`). Dans `src/lib/playlist/addToPlaylist.ts`, le commentaire « DemoUser, puis la session du plan 2 » devient « CurrentUser ».

`getDemoSession` disparaît de `src/lib/session.ts`. La page `src/app/apercu/session/page.tsx` l'importe encore : la tâche 4 la supprime. D'ici là, remplacer son import par une constante locale `const session: DemoSession = "member";`, pour que le projet compile.

- [ ] **Étape 8 : lancer les tests.** Lancer `pnpm test -- tests/unit/auth`, `pnpm test:integration -- tests/integration/auth.test.ts` et `pnpm typecheck`. Attendu : PASS. Les écrans de clubs et de playlists lisent encore la maquette, avec l'identifiant UUID du compte : ils sont vides. C'est attendu jusqu'aux tâches 7 et 9.

- [ ] **Étape 9 : commit.**

```bash
git add src/lib/auth src/lib/session.ts src/lib/clubs/queries.ts src/lib/moderation/gate.ts src/app/api src/app/moi/page.tsx src/app/apercu src/lib/playlist/addToPlaylist.ts tests vitest.config.mts package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "feat(auth): Better Auth sessions with magic links, current user from the database"
```

---

### Tâche 4 : écrans de connexion et de déconnexion

**Fichiers :**
- Créer : `src/lib/auth/magicLinkLimit.ts`, `src/lib/auth/signInCookie.ts`
- Modifier : `src/app/actions/signIn.ts`, `src/app/actions/account.ts` (`signOut`), `src/app/connexion/page.tsx`, `src/app/connexion/verifier/page.tsx`, `src/components/auth/GoogleSignInButton.tsx` (si besoin), `src/lib/auth/email.ts` (`MagicLinkState`), `messages/fr.json`, `messages/ar.json`, `src/app/actions/demo.ts`, `src/app/apercu/etats/page.tsx`, `src/app/apercu/reservee/page.tsx`
- Supprimer : `src/mocks/signIn.ts`, `src/app/apercu/session/page.tsx`, `tests/unit/demoSession.test.ts`, `tests/unit/account.test.ts`, les parties « session » de `src/mocks/session.ts`
- Test : `tests/integration/magicLinkLimit.test.ts`

**Interfaces :**
- Consomme : `getAuth`, `isGoogleEnabled` (tâche 3), `hitRateLimit` (plan 1), `clientIp` (plan 1), `readOutbox`, `mailTransport` (tâche 2).
- Produit : `MAGIC_LINK_LIMITS = { perEmail: { limit: 5, windowSeconds: 900 }, perIp: { limit: 20, windowSeconds: 3600 } }`, `allowMagicLinkRequest(email: string, ip: string): Promise<boolean>`.
- Produit : `MAGIC_LINK_SENT_COOKIE = "ghnaya-magic-link-sent"`, `MAGIC_LINK_SENT_MAX_AGE = 900`.
- `MagicLinkState.error` devient `null | "missing" | "invalid" | "tooMany" | "failed"`.

- [ ] **Étape 1 : écrire le test de la limite, qui doit échouer.**

`tests/integration/magicLinkLimit.test.ts` :

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { MAGIC_LINK_LIMITS, allowMagicLinkRequest } from "@/lib/auth/magicLinkLimit";
import { resetDb } from "./helpers";

describe("allowMagicLinkRequest", () => {
  beforeEach(resetDb);

  it("accepte 5 demandes pour une adresse, puis refuse la 6e", async () => {
    for (let i = 0; i < MAGIC_LINK_LIMITS.perEmail.limit; i += 1) {
      expect(await allowMagicLinkRequest("leila@example.com", `10.0.0.${i}`)).toBe(true);
    }
    expect(await allowMagicLinkRequest("leila@example.com", "10.0.0.99")).toBe(false);
    expect(await allowMagicLinkRequest("sami@example.com", "10.0.0.99")).toBe(true);
  });

  it("refuse au-delà de 20 demandes par IP, quelles que soient les adresses", async () => {
    for (let i = 0; i < MAGIC_LINK_LIMITS.perIp.limit; i += 1) {
      expect(await allowMagicLinkRequest(`p${i}@example.com`, "10.1.1.1")).toBe(true);
    }
    expect(await allowMagicLinkRequest("autre@example.com", "10.1.1.1")).toBe(false);
  });
});
```

- [ ] **Étape 2 : lancer le test et constater l'échec.** Lancer `pnpm test:integration -- tests/integration/magicLinkLimit.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter la limite et le cookie.**

`src/lib/auth/magicLinkLimit.ts` :

```ts
import "server-only";
import { hitRateLimit } from "@/lib/ratelimit/fixedWindow";

/** Écart 4 du plan 2 : limite des liens magiques, en base, par adresse et par IP. */
export const MAGIC_LINK_LIMITS = {
  perEmail: { limit: 5, windowSeconds: 15 * 60 },
  perIp: { limit: 20, windowSeconds: 60 * 60 },
} as const;

export async function allowMagicLinkRequest(email: string, ip: string): Promise<boolean> {
  const byIp = await hitRateLimit(`magic-link-ip:${ip}`, MAGIC_LINK_LIMITS.perIp.limit, MAGIC_LINK_LIMITS.perIp.windowSeconds);
  if (!byIp.allowed) return false;
  const byEmail = await hitRateLimit(
    `magic-link-email:${email}`,
    MAGIC_LINK_LIMITS.perEmail.limit,
    MAGIC_LINK_LIMITS.perEmail.windowSeconds,
  );
  return byEmail.allowed;
}
```

`src/lib/auth/signInCookie.ts` :

```ts
import { SIGN_IN_PATH } from "./returnPath";

/**
 * Adresse à laquelle le lien vient de partir, pour « Vérifiez vos e-mails ». Gardée quelques minutes dans
 * un cookie limité à /connexion, jamais dans l'URL (historique, journaux).
 */
export const MAGIC_LINK_SENT_COOKIE = "ghnaya-magic-link-sent";
export const MAGIC_LINK_SENT_MAX_AGE = 15 * 60;
export const MAGIC_LINK_SENT_COOKIE_OPTIONS = {
  path: SIGN_IN_PATH,
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: MAGIC_LINK_SENT_MAX_AGE,
};
```

Dans `src/lib/auth/email.ts`, élargir le type :

```ts
/** État du formulaire du lien magique : l'adresse saisie est rendue pour rester dans le champ après une erreur. */
export type MagicLinkState = { email: string; error: null | "missing" | "invalid" | "tooMany" | "failed" };
```

- [ ] **Étape 4 : ajouter les messages d'erreur.** Dans `signIn.errors` de `messages/fr.json` :

```json
"tooMany": "Trop de demandes pour cette adresse. Attendez quelques minutes, puis recommencez.",
"failed": "Le lien n'a pas pu être envoyé. Réessayez dans un instant.",
"linkInvalid": "Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau.",
"google": "La connexion avec Google n'a pas abouti. Réessayez, ou recevez un lien par e-mail."
```

Dans `messages/ar.json` :

```json
"tooMany": "طلبات كثيرة لهذا العنوان. انتظر بضع دقائق ثم أعد المحاولة.",
"failed": "تعذّر إرسال الرابط. أعد المحاولة بعد قليل.",
"linkInvalid": "انتهت صلاحية رابط الدخول هذا أو استُعمل من قبل. اطلب رابطًا جديدًا.",
"google": "لم يكتمل الدخول عبر Google. أعد المحاولة، أو استلم رابطًا عبر البريد."
```

Et dans `signIn.verify` (français, puis arabe) : `"devTitle": "Aperçu de développement"`, `"devBody": "Aucun e-mail ne part en développement : le message est dans la boîte locale."`, `"devOpen": "Ouvrir le lien reçu"`. En arabe, garder ces trois textes en français : l'aperçu n'est jamais montré aux utilisateurs, et il reste en `lang="fr"` comme aujourd'hui. Le test de parité exige seulement la présence des clés.

- [ ] **Étape 5 : réécrire les actions de connexion.** Remplacer `src/app/actions/signIn.ts` :

```ts
"use server";

import { cookies, headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getAuth, isGoogleEnabled } from "@/lib/auth/auth";
import { checkEmail, type MagicLinkState } from "@/lib/auth/email";
import { allowMagicLinkRequest } from "@/lib/auth/magicLinkLimit";
import { safeReturnPath, signInHref } from "@/lib/auth/returnPath";
import { MAGIC_LINK_SENT_COOKIE, MAGIC_LINK_SENT_COOKIE_OPTIONS } from "@/lib/auth/signInCookie";
import { clientIp } from "@/lib/ratelimit/clientIp";

/**
 * Demande d'un lien magique (spec §4.1). Adresse refusée ou trop de demandes : l'erreur revient en ligne.
 * Lien parti : « Vérifiez vos e-mails », qui remplace le formulaire dans l'historique. Le lien ramène à
 * `retour` ; un lien expiré ou déjà utilisé ramène au formulaire avec `?error=INVALID_TOKEN`.
 */
export async function requestMagicLink(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const raw = formData.get("email");
  const typed = typeof raw === "string" ? raw : "";
  const check = checkEmail(typed);
  if (!check.ok) return { email: typed, error: check.reason };

  const retour = safeReturnPath(formData.get("retour"));
  const requestHeaders = await headers();
  if (!(await allowMagicLinkRequest(check.email, clientIp(requestHeaders)))) return { email: typed, error: "tooMany" };

  try {
    await getAuth().api.signInMagicLink({
      body: {
        email: check.email,
        callbackURL: retour,
        errorCallbackURL: signInHref(retour),
        metadata: { locale: await getLocale() },
      },
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("requestMagicLink", error);
    return { email: typed, error: "failed" };
  }

  (await cookies()).set(MAGIC_LINK_SENT_COOKIE, check.email, MAGIC_LINK_SENT_COOKIE_OPTIONS);
  redirect(signInHref(retour, "verify"), RedirectType.replace);
}

/** Bouton Google : Better Auth renvoie l'adresse de Google, où l'on part ; le retour ramène à `retour`. */
export async function continueWithGoogle(formData: FormData): Promise<void> {
  const retour = safeReturnPath(formData.get("retour"));
  if (!isGoogleEnabled()) redirect(signInHref(retour), RedirectType.replace);

  const { url } = await getAuth().api.signInSocial({
    body: { provider: "google", callbackURL: retour, errorCallbackURL: `${signInHref(retour)}&error=google` },
    headers: await headers(),
  });
  if (!url) redirect(`${signInHref(retour)}&error=google`, RedirectType.replace);
  redirect(url);
}
```

`errorCallbackURL` : Better Auth ajoute son propre `error=…` à l'adresse. La page lit `error` et ne distingue que `INVALID_TOKEN` (lien) des autres cas (Google). Le `&error=google` donné ici sert quand Better Auth ne le remplace pas.

Dans `src/app/actions/account.ts`, remplacer `becomeVisitor` et `signOut` (la tâche 10 réécrit `deleteAccount`) :

```ts
/** Se déconnecter, puis revenir à l'accueil. `nextCookies()` efface le cookie de session. */
export async function signOut(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  revalidatePath("/", "layout");
  redirect("/", RedirectType.replace);
}
```

En attendant la tâche 10, `deleteAccount` appelle `signOut()` à la place de `becomeVisitor()`. Retirer les imports de `DEMO_SESSION_COOKIE` et `DemoSession`.

- [ ] **Étape 6 : brancher les pages.**

`src/app/connexion/page.tsx` :
- lire aussi `error` dans `searchParams` ;
- avant les boutons, si `error` est présent, afficher un `<p role="alert">` avec `t("errors.linkInvalid")` quand `error === "INVALID_TOKEN"`, et `t("errors.google")` sinon. Le style est celui des erreurs de `MagicLinkForm` (`text-error`, icône `CircleAlert` de lucide) ;
- n'afficher `<GoogleSignInButton>` et le séparateur « ou » que si `isGoogleEnabled()`.

`src/app/connexion/verifier/page.tsx` :
- remplacer `DEMO_MAGIC_LINK_COOKIE` par `MAGIC_LINK_SENT_COOKIE` ;
- remplacer `DemoMagicLink` par cet aperçu, montré seulement quand `mailTransport() === "outbox"` (développement, tests de bout en bout) :

```tsx
/** Boîte locale (développement, tests de bout en bout) : aucun e-mail ne part, on ouvre donc le lien ici. */
async function OutboxLink({ email }: { email: string }) {
  const [entry, t] = await Promise.all([readOutbox(email), getTranslations("signIn.verify")]);
  if (!entry?.link) return null;
  return (
    <aside lang="fr" dir="ltr" className="mt-6 rounded-lg border border-dashed border-line p-5 text-start">
      <p className="text-sm font-medium">{t("devTitle")}</p>
      <p className="mt-1 text-sm text-ink-2">{t("devBody")}</p>
      <a
        href={entry.link}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-medium text-ink hover:bg-well"
      >
        <MailOpen aria-hidden="true" className="size-4" />
        {t("devOpen")}
      </a>
    </aside>
  );
}
```

Appeler `{sent.ok && mailTransport() === "outbox" ? <OutboxLink email={sent.email} /> : null}`. Retirer `openDemoMagicLink`.

- [ ] **Étape 7 : retirer la session de démonstration.**
- supprimer `src/mocks/signIn.ts`, `src/app/apercu/session/page.tsx` et `tests/unit/demoSession.test.ts` ;
- dans `src/app/actions/demo.ts`, supprimer `setDemoSession`. Garder `setDemoLatency` et `triggerRootError` ;
- dans `src/mocks/session.ts`, supprimer `DEMO_SESSION_COOKIE`, `DEMO_SESSIONS`, `DemoSession`, `DemoUser`, les quatre personnes, `demoUserFor` et `isDemoSession`. Garder `clubPlaylistsFor` et `personalPlaylistsFor` jusqu'à la tâche 9, en typant leur paramètre `Pick<CurrentUser, "id" | "clubSlugs">` ;
- dans `src/mocks/account.ts`, remplacer `DemoUser` par `CurrentUser`. Supprimer `tests/unit/account.test.ts`, qui construisait ses utilisateurs avec `demoUserFor` : la règle du dernier animateur est testée en base aux tâches 6 et 10 ;
- dans `src/app/apercu/etats/page.tsx` et `src/app/apercu/reservee/page.tsx`, retirer les liens vers `/apercu/session`. On se connecte désormais par le formulaire, avec n'importe quelle adresse : le lien est dans la boîte locale.

Chercher les restes avec `grep -rn "DemoUser\|DEMO_SESSION\|getDemoSession\|apercu/session" src tests` : il ne doit rien rester.

- [ ] **Étape 8 : vérifier.** Lancer `pnpm test`, `pnpm test:integration`, `pnpm typecheck` et `pnpm lint`. Attendu : PASS. Puis, avec `pnpm dev`, vérifier dans le navigateur :
- `/connexion?retour=/moi` → saisir `leila@example.com` → « Vérifiez vos e-mails » montre l'adresse et « Ouvrir le lien reçu » ;
- le lien ramène à `/moi`, où l'on voit le nom « leila » ;
- « Se déconnecter » ramène à l'accueil en visiteur ;
- rouvrir le même lien ramène à `/connexion` avec « Ce lien de connexion a expiré ou a déjà servi » ;
- sans `GOOGLE_CLIENT_ID`, le bouton Google n'apparaît pas.

- [ ] **Étape 9 : commit.**

```bash
git add -A src tests messages
git commit -m "feat(auth): magic link and Google sign-in screens, sign-out, rate limit"
```

---

### Tâche 5 : attribution des rôles en ligne de commande

**Fichiers :**
- Créer : `src/lib/account/roles.ts`, `scripts/user-role.ts`
- Modifier : `package.json` (script `user:role`), `README.md`
- Test : `tests/integration/roles.test.ts`, `tests/unit/account/roleArgs.test.ts`

**Interfaces :**
- Produit : `parseRoleArgs(argv: string[]): { ok: true; email: string; change: RoleChange } | { ok: false; error: string }`, avec `interface RoleChange { globalRole?: GlobalRole; isAnimator?: boolean }`.
- Produit : `setUserRoles(db: Db, email: string, change: RoleChange): Promise<{ email: string; globalRole: GlobalRole; isAnimator: boolean } | null>`. Renvoie `null` pour une adresse inconnue.

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

`tests/unit/account/roleArgs.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { parseRoleArgs } from "@/lib/account/roles";

describe("parseRoleArgs", () => {
  it("lit l'adresse, le rôle global et le rôle d'animateur", () => {
    expect(parseRoleArgs(["Sami@Example.com", "--animator"])).toEqual({
      ok: true,
      email: "sami@example.com",
      change: { isAnimator: true },
    });
    expect(parseRoleArgs(["rania@example.com", "--role", "moderator", "--no-animator"])).toEqual({
      ok: true,
      email: "rania@example.com",
      change: { globalRole: "moderator", isAnimator: false },
    });
  });

  it("refuse une commande sans changement, un rôle inconnu ou une adresse invalide", () => {
    expect(parseRoleArgs(["sami@example.com"]).ok).toBe(false);
    expect(parseRoleArgs(["sami@example.com", "--role", "root"]).ok).toBe(false);
    expect(parseRoleArgs(["pas-une-adresse", "--animator"]).ok).toBe(false);
    expect(parseRoleArgs([]).ok).toBe(false);
  });
});
```

`tests/integration/roles.test.ts` :

```ts
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { setUserRoles } from "@/lib/account/roles";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("setUserRoles", () => {
  beforeEach(resetDb);

  it("change seulement ce qui est demandé", async () => {
    await insertUser({ email: "sami@example.com", globalRole: "moderator" });
    expect(await setUserRoles(db, "sami@example.com", { isAnimator: true })).toEqual({
      email: "sami@example.com",
      globalRole: "moderator",
      isAnimator: true,
    });
    const [row] = await db.select().from(users).where(eq(users.email, "sami@example.com"));
    expect(row.globalRole).toBe("moderator");
  });

  it("renvoie null pour une adresse inconnue", async () => {
    expect(await setUserRoles(db, "personne@example.com", { isAnimator: true })).toBeNull();
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/account` et `pnpm test:integration -- tests/integration/roles.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter.**

`src/lib/account/roles.ts` :

```ts
import { eq } from "drizzle-orm";
import { checkEmail } from "@/lib/auth/email";
import { GLOBAL_ROLES, type GlobalRole } from "@/lib/auth/types";
import type { Db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/** Rôles attribués par un admin (spec §4.3, écart 5 du plan 2) : rôle global et rôle d'animateur. */
export interface RoleChange {
  globalRole?: GlobalRole;
  isAnimator?: boolean;
}

export type RoleArgs = { ok: true; email: string; change: RoleChange } | { ok: false; error: string };

const USAGE = "Usage : pnpm user:role <email> [--animator | --no-animator] [--role member|moderator|admin]";

export function parseRoleArgs(argv: string[]): RoleArgs {
  const [rawEmail, ...flags] = argv;
  const email = checkEmail(rawEmail);
  if (!email.ok) return { ok: false, error: USAGE };

  const change: RoleChange = {};
  for (let i = 0; i < flags.length; i += 1) {
    const flag = flags[i];
    if (flag === "--animator") change.isAnimator = true;
    else if (flag === "--no-animator") change.isAnimator = false;
    else if (flag === "--role" && GLOBAL_ROLES.includes(flags[i + 1] as GlobalRole)) {
      change.globalRole = flags[i + 1] as GlobalRole;
      i += 1;
    } else return { ok: false, error: USAGE };
  }
  if (change.globalRole === undefined && change.isAnimator === undefined) return { ok: false, error: USAGE };
  return { ok: true, email: email.email, change };
}

export async function setUserRoles(db: Db, email: string, change: RoleChange) {
  const [row] = await db
    .update(users)
    .set({ ...change, updatedAt: new Date() })
    .where(eq(users.email, email))
    .returning({ email: users.email, globalRole: users.globalRole, isAnimator: users.isAnimator });
  return row ?? null;
}
```

`scripts/user-role.ts` :

```ts
// Plan 2, tâche 5 : attribue un rôle à un compte existant (la personne s'est connectée une première fois).
import "dotenv/config";
import { parseRoleArgs, setUserRoles } from "@/lib/account/roles";
import { db, pool } from "@/lib/db/client";

async function main(): Promise<void> {
  const args = parseRoleArgs(process.argv.slice(2));
  if (!args.ok) throw new Error(args.error);
  const user = await setUserRoles(db, args.email, args.change);
  if (!user) throw new Error(`Aucun compte pour ${args.email} : la personne doit d'abord se connecter une fois.`);
  console.log(`${user.email} : rôle ${user.globalRole}, animateur ${user.isAnimator ? "oui" : "non"}.`);
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

Dans `package.json`, ajouter `"user:role": "tsx scripts/user-role.ts"`. Dans le `README.md`, ajouter une section « Rôles » qui donne la commande et rappelle que la personne doit s'être connectée une fois. En production : `DATABASE_URL=<url directe> pnpm user:role …`.

- [ ] **Étape 4 : relancer les tests.** Attendu : PASS.

- [ ] **Étape 5 : commit.**

```bash
git add src/lib/account scripts/user-role.ts package.json README.md tests
git commit -m "feat(account): assign global and animator roles from the command line"
```

---
### Tâche 6 : clubs et adhésions en base

**Fichiers :**
- Créer : `src/lib/clubs/types.ts`, `src/lib/clubs/write.ts`
- Modifier : `src/lib/clubs/queries.ts`, `src/lib/clubs/slug.ts` (exporter la base du slug), `src/lib/auth/permissions.ts`
- Test : `tests/integration/clubs.test.ts`, `tests/unit/auth/permissions.test.ts`, `tests/unit/clubs/slug.test.ts` (s'il existe ; sinon dans `clubFields.test.ts`)

**Interfaces :**
- Consomme : `decideJoin`, `isLastAnimator`, `Membership`, `Joiner`, `ClubRole` (`src/lib/clubs/membership.ts`) ; `newInviteCode` ; `clubSlug` ; `isUniqueViolation`, `inList` (tâche 1) ; `CurrentUser` (tâche 3).
- Produit (`types.ts`) : `interface Club { id: string; slug: string; name: string; inviteCode: string }`, `interface ClubRef { slug: string; name: string }`, `interface ClubSummary extends Club { memberCount: number; role: ClubRole }`, `interface ClubMember { id: string; name: string; role: ClubRole }`.
- Produit (`queries.ts`) : `getClubBySlug(slug): Promise<Club | null>`, `getClubByInvite(code): Promise<Club | null>`, `memberCountOf(clubId): Promise<number>`, `clubsOf(userId): Promise<ClubSummary[]>`, `membersOf(clubId, locale): Promise<ClubMember[]>`, `joinMembershipsOf(userId): Promise<Membership[]>`, `soleAnimatorClubs(userId): Promise<ClubRef[]>`.
- Produit (`write.ts`) : `createClub(db, name, creatorId): Promise<Club>`, `renameClub(db, clubId, name): Promise<void>`, `regenerateInvite(db, clubId): Promise<string>`, `deleteClub(db, clubId): Promise<void>`, `promoteMember(db, clubId, userId): Promise<boolean>`, `joinClub(db, user: Joiner, code: string, confirmed: boolean): Promise<JoinOutcome>`.
- Produit : `type JoinOutcome = { ok: true; club: Club; left: string[] } | { ok: false; reason: "invalid" | "already-member" | "needs-confirm" } | { ok: false; reason: "last-animator"; club: string }`.
- Produit (`permissions.ts`) : `clubRoleOf(user, slug): ClubRole | null`, `canManageClub(user, slug): boolean`, `clubsAnimatedBy(user): ClubRef[]`.
- Produit (`slug.ts`) : `clubSlugBase(name: string): string`. `clubSlug(name, taken)` l'utilise.

- [ ] **Étape 1 : écrire les tests des permissions de club, qui doivent échouer.** Ajouter à `tests/unit/auth/permissions.test.ts` :

```ts
import { canManageClub, clubRoleOf, clubsAnimatedBy } from "@/lib/auth/permissions";

describe("permissions de club", () => {
  const sami = userWith({
    isAnimator: true,
    clubs: [
      { slug: "les-jasmins", name: "Les Jasmins", role: "animator" },
      { slug: "malouf-sfax", name: "Malouf Sfax", role: "member" },
    ],
  });

  it("lit le rôle dans le club, et rien pour un club dont on n'est pas membre", () => {
    expect(clubRoleOf(sami, "les-jasmins")).toBe("animator");
    expect(clubRoleOf(sami, "malouf-sfax")).toBe("member");
    expect(clubRoleOf(sami, "nghanniw")).toBeNull();
    expect(clubRoleOf(null, "les-jasmins")).toBeNull();
  });

  it("gère seulement les clubs qu'on anime, même avec le rôle global d'animateur", () => {
    expect(canManageClub(sami, "les-jasmins")).toBe(true);
    expect(canManageClub(sami, "malouf-sfax")).toBe(false);
  });

  it("un membre promu animateur de son club le gère, sans le rôle global", () => {
    const leila = userWith({ clubs: [{ slug: "les-jasmins", name: "Les Jasmins", role: "animator" }] });
    expect(canManageClub(leila, "les-jasmins")).toBe(true);
  });

  it("liste les clubs animés, pour y créer une playlist", () => {
    expect(clubsAnimatedBy(sami)).toEqual([{ slug: "les-jasmins", name: "Les Jasmins" }]);
    expect(clubsAnimatedBy(null)).toEqual([]);
  });
});
```

- [ ] **Étape 2 : écrire les tests d'intégration des clubs, qui doivent échouer.**

`tests/integration/clubs.test.ts` :

```ts
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { clubsOf, getClubByInvite, joinMembershipsOf, membersOf, memberCountOf, soleAnimatorClubs } from "@/lib/clubs/queries";
import { createClub, deleteClub, joinClub, promoteMember, regenerateInvite, renameClub } from "@/lib/clubs/write";
import { db } from "@/lib/db/client";
import { clubMembers } from "@/lib/db/schema";
import { insertClub, insertUser } from "./factories";
import { resetDb } from "./helpers";

const member = async (name: string) => {
  const u = await insertUser({ name });
  return { id: u.id, isAnimator: false };
};
const animator = async (name: string) => {
  const u = await insertUser({ name, isAnimator: true });
  return { id: u.id, isAnimator: true };
};

describe("création et réglages d'un club", () => {
  beforeEach(resetDb);

  it("crée le club, son slug, un code de 10 caractères, et en fait animer son créateur", async () => {
    const sami = await animator("Sami");
    const club = await createClub(db, "Les Jasmins", sami.id);
    expect(club.slug).toBe("les-jasmins");
    expect(club.inviteCode).toMatch(/^[a-z2-9]{10}$/);
    expect(await clubsOf(sami.id)).toEqual([{ ...club, memberCount: 1, role: "animator" }]);
  });

  it("donne un slug distinct à deux clubs du même nom", async () => {
    const sami = await animator("Sami");
    await createClub(db, "Les Jasmins", sami.id);
    expect((await createClub(db, "Les Jasmins", sami.id)).slug).toBe("les-jasmins-2");
    expect((await createClub(db, "Les  Jasmins", sami.id)).slug).toBe("les-jasmins-3");
  });

  it("ne donne jamais un slug réservé", async () => {
    const sami = await animator("Sami");
    expect((await createClub(db, "Nouveau", sami.id)).slug).toBe("nouveau-2");
  });

  it("renomme sans changer le slug, et invalide l'ancien lien d'invitation", async () => {
    const sami = await animator("Sami");
    const club = await createClub(db, "Les Jasmins", sami.id);
    await renameClub(db, club.id, "Jasmins de Tunis");
    const code = await regenerateInvite(db, club.id);
    expect(code).not.toBe(club.inviteCode);
    expect(await getClubByInvite(club.inviteCode)).toBeNull();
    expect(await getClubByInvite(code.toUpperCase())).toMatchObject({ slug: "les-jasmins", name: "Jasmins de Tunis" });
  });

  it("supprime le club et ses adhésions", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    const club = await insertClub({ name: "Les Jasmins", animatorIds: [sami.id], memberIds: [leila.id] });
    await deleteClub(db, club.id);
    expect(await db.select().from(clubMembers)).toEqual([]);
  });
});

describe("membres", () => {
  beforeEach(resetDb);

  it("liste les animateurs d'abord, puis par ordre alphabétique", async () => {
    const sami = await animator("Sami");
    const [b, a] = [await member("Bilel"), await member("Amira")];
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [b.id, a.id] });
    expect((await membersOf(club.id, "fr")).map((m) => m.name)).toEqual(["Sami", "Amira", "Bilel"]);
    expect(await memberCountOf(club.id)).toBe(3);
  });

  it("promeut un membre, et refuse de promouvoir un inconnu", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [leila.id] });
    expect(await promoteMember(db, club.id, leila.id)).toBe(true);
    expect(await promoteMember(db, club.id, leila.id)).toBe(false); // déjà animatrice
    expect(await promoteMember(db, club.id, (await member("X")).id)).toBe(false);
    expect((await membersOf(club.id, "fr")).find((m) => m.id === leila.id)?.role).toBe("animator");
  });

  it("repère les clubs dont on est le seul animateur", async () => {
    const sami = await animator("Sami");
    const rim = await animator("Rim");
    await insertClub({ name: "Seul", slug: "seul", animatorIds: [sami.id] });
    await insertClub({ name: "À deux", slug: "a-deux", animatorIds: [sami.id, rim.id] });
    expect(await soleAnimatorClubs(sami.id)).toEqual([{ slug: "seul", name: "Seul" }]);
  });
});

describe("rejoindre un club (règle des clubs)", () => {
  beforeEach(resetDb);

  it("un membre sans club rejoint", async () => {
    const sami = await animator("Sami");
    const nour = await member("Nour");
    const club = await insertClub({ name: "Jasmins", animatorIds: [sami.id] });
    expect(await joinClub(db, nour, club.inviteCode, false)).toMatchObject({ ok: true, left: [] });
    expect((await clubsOf(nour.id)).map((c) => c.role)).toEqual(["member"]);
  });

  it("un code inconnu est refusé, et un membre ne rejoint pas deux fois", async () => {
    const sami = await animator("Sami");
    const club = await insertClub({ name: "Jasmins", animatorIds: [sami.id] });
    expect(await joinClub(db, await member("Nour"), "inconnu123", false)).toEqual({ ok: false, reason: "invalid" });
    expect(await joinClub(db, sami, club.inviteCode, false)).toEqual({ ok: false, reason: "already-member" });
  });

  it("un membre d'un autre club doit confirmer, puis quitte le premier", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    const a = await insertClub({ name: "A", slug: "a", animatorIds: [sami.id], memberIds: [leila.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [sami.id] });
    expect(await joinClub(db, leila, b.inviteCode, false)).toEqual({ ok: false, reason: "needs-confirm" });
    expect(await joinClub(db, leila, b.inviteCode, true)).toMatchObject({ ok: true, left: ["a"] });
    expect((await clubsOf(leila.id)).map((c) => c.slug)).toEqual(["b"]);
    expect(await memberCountOf(a.id)).toBe(1);
  });

  it("le dernier animateur d'un club ne peut pas le quitter", async () => {
    const leila = await member("Leïla");
    const a = await insertClub({ name: "A", slug: "a", animatorIds: [leila.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [(await animator("Sami")).id] });
    expect(await joinClub(db, leila, b.inviteCode, true)).toEqual({ ok: false, reason: "last-animator", club: "a" });
    expect(await memberCountOf(a.id)).toBe(1);
  });

  it("un animateur rejoint un club en plus des siens", async () => {
    const sami = await animator("Sami");
    const rim = await animator("Rim");
    await insertClub({ name: "A", slug: "a", animatorIds: [sami.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [rim.id] });
    expect(await joinClub(db, sami, b.inviteCode, false)).toMatchObject({ ok: true, left: [] });
    expect((await clubsOf(sami.id)).map((c) => c.slug)).toEqual(["a", "b"]);
  });

  it("deux animateurs du même club qui partent en même temps : un seul part", async () => {
    const [x, y] = [await member("X"), await member("Y")];
    const a = await insertClub({ name: "A", slug: "a", animatorIds: [x.id, y.id] });
    const b = await insertClub({ name: "B", slug: "b", animatorIds: [(await animator("Sami")).id] });
    const results = await Promise.all([joinClub(db, x, b.inviteCode, true), joinClub(db, y, b.inviteCode, true)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const left = await db.execute<{ n: string }>(
      sql`SELECT count(*) AS n FROM club_members WHERE club_id = ${a.id} AND role = 'animator'`,
    );
    expect(Number(left.rows[0].n)).toBe(1);
  });

  it("donne de quoi décider : ses adhésions et les animateurs de ses clubs", async () => {
    const sami = await animator("Sami");
    const leila = await member("Leïla");
    await insertClub({ name: "A", slug: "a", animatorIds: [sami.id], memberIds: [leila.id] });
    expect(await joinMembershipsOf(leila.id)).toEqual(
      expect.arrayContaining([
        { clubSlug: "a", userId: leila.id, role: "member" },
        { clubSlug: "a", userId: sami.id, role: "animator" },
      ]),
    );
    expect(await db.select().from(clubMembers).where(eq(clubMembers.userId, leila.id))).toHaveLength(1);
  });
});
```

- [ ] **Étape 3 : lancer les tests et constater l'échec.** Lancer `pnpm test -- tests/unit/auth` et `pnpm test:integration -- tests/integration/clubs.test.ts`. Attendu : FAIL, fonctions introuvables.

- [ ] **Étape 4 : exporter la base du slug.** Dans `src/lib/clubs/slug.ts`, extraire le calcul de `base` dans une fonction exportée, sans changer le comportement de `clubSlug` :

```ts
/** Slug avant la gestion des doublons : minuscules, sans accents, mots séparés par des tirets. */
export function clubSlugBase(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .normalize("NFC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_LENGTH)
      .replace(/-+$/, "") || "club"
  );
}
```

`clubSlug` commence alors par `const base = clubSlugBase(name);`. Les tests existants du slug doivent passer sans changement.

- [ ] **Étape 5 : implémenter les permissions de club.** Ajouter à `src/lib/auth/permissions.ts` :

```ts
import type { ClubRole } from "@/lib/clubs/membership";
import type { ClubRef } from "@/lib/clubs/types";

/** Rôle de l'utilisateur dans ce club (`club_members.role`), ou `null` s'il n'en est pas membre. */
export const clubRoleOf = (user: CurrentUser | null, slug: string): ClubRole | null =>
  user?.clubs.find((club) => club.slug === slug)?.role ?? null;

/** Renommer, inviter, promouvoir, supprimer, gérer les playlists du club : ses animateurs (spec §4.3). */
export const canManageClub = (user: CurrentUser | null, slug: string): boolean => clubRoleOf(user, slug) === "animator";

/** Clubs où l'utilisateur peut créer une playlist : ceux qu'il anime. */
export const clubsAnimatedBy = (user: CurrentUser | null): ClubRef[] =>
  (user?.clubs ?? []).filter((club) => club.role === "animator").map(({ slug, name }) => ({ slug, name }));
```

- [ ] **Étape 6 : écrire les types et les lectures.**

`src/lib/clubs/types.ts` :

```ts
import type { ClubRole } from "./membership";

export interface Club {
  id: string;
  slug: string;
  name: string;
  inviteCode: string;
}

export interface ClubRef {
  slug: string;
  name: string;
}

export interface ClubSummary extends Club {
  memberCount: number;
  /** Rôle de l'utilisateur dans ce club. */
  role: ClubRole;
}

export interface ClubMember {
  id: string;
  name: string;
  role: ClubRole;
}
```

Compléter `src/lib/clubs/queries.ts` (garder `membershipsOf`) :

```ts
import type { Membership } from "@/lib/clubs/membership";
import type { Club, ClubMember, ClubRef, ClubSummary } from "@/lib/clubs/types";

type ClubRow = { id: string; slug: string; name: string; invite_code: string };
const toClub = (r: ClubRow): Club => ({ id: r.id, slug: r.slug, name: r.name, inviteCode: r.invite_code });

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const res = await db.execute<ClubRow>(sql`SELECT id, slug, name, invite_code FROM clubs WHERE slug = ${slug}`);
  return res.rows[0] ? toClub(res.rows[0]) : null;
}

/** Club d'un lien d'invitation. Le code est comparé en minuscules (`parseInviteCode` les produit). */
export async function getClubByInvite(code: string): Promise<Club | null> {
  const res = await db.execute<ClubRow>(
    sql`SELECT id, slug, name, invite_code FROM clubs WHERE invite_code = ${code.toLowerCase()}`,
  );
  return res.rows[0] ? toClub(res.rows[0]) : null;
}

export async function memberCountOf(clubId: string): Promise<number> {
  const res = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM club_members WHERE club_id = ${clubId}`);
  return Number(res.rows[0].n);
}

/** Clubs de l'utilisateur, avec le nombre de membres et son rôle, dans l'ordre d'adhésion. */
export async function clubsOf(userId: string): Promise<ClubSummary[]> {
  const res = await db.execute<ClubRow & { role: ClubSummary["role"]; member_count: string }>(sql`
    SELECT c.id, c.slug, c.name, c.invite_code, m.role,
      (SELECT count(*) FROM club_members o WHERE o.club_id = c.id) AS member_count
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId}
    ORDER BY m.created_at, c.slug`);
  return res.rows.map((r) => ({ ...toClub(r), role: r.role, memberCount: Number(r.member_count) }));
}

/** Membres du club : les animateurs d'abord, puis par ordre alphabétique dans la langue de l'interface. */
export async function membersOf(clubId: string, locale: string): Promise<ClubMember[]> {
  const res = await db.execute<ClubMember>(sql`
    SELECT u.id, u.name, m.role
    FROM club_members m JOIN users u ON u.id = m.user_id
    WHERE m.club_id = ${clubId}`);
  const collator = new Intl.Collator(locale);
  return res.rows.sort((a, b) =>
    a.role === b.role ? collator.compare(a.name, b.name) : a.role === "animator" ? -1 : 1,
  );
}

/**
 * Ce que `decideJoin` doit savoir : les adhésions de l'utilisateur, et les animateurs de ses clubs
 * (pour la règle du dernier animateur).
 */
export async function joinMembershipsOf(userId: string): Promise<Membership[]> {
  const res = await db.execute<{ club_slug: string; user_id: string; role: Membership["role"] }>(sql`
    SELECT c.slug AS club_slug, m.user_id, m.role
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId}
      OR (m.role = 'animator' AND m.club_id IN (SELECT club_id FROM club_members WHERE user_id = ${userId}))
    ORDER BY m.created_at`);
  return res.rows.map((r) => ({ clubSlug: r.club_slug, userId: r.user_id, role: r.role }));
}

/** Clubs dont l'utilisateur est le seul animateur (spec §12 : il ne peut pas supprimer son compte). */
export async function soleAnimatorClubs(userId: string): Promise<ClubRef[]> {
  const res = await db.execute<ClubRef>(sql`
    SELECT c.slug, c.name
    FROM club_members m JOIN clubs c ON c.id = m.club_id
    WHERE m.user_id = ${userId} AND m.role = 'animator'
      AND NOT EXISTS (
        SELECT 1 FROM club_members o
        WHERE o.club_id = m.club_id AND o.role = 'animator' AND o.user_id <> ${userId})
    ORDER BY m.created_at`);
  return res.rows;
}
```

`joinMembershipsOf` sert à la page `/rejoindre` (hors transaction). `write.ts` refait la même lecture dans sa transaction, après avoir pris les verrous.

- [ ] **Étape 7 : écrire les écritures.**

`src/lib/clubs/write.ts` :

```ts
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/errors";
import { clubMembers, clubs } from "@/lib/db/schema";
import { inList } from "@/lib/db/sqlList";
import { newInviteCode } from "./invite";
import { decideJoin, type Joiner, type Membership } from "./membership";
import { clubSlug, clubSlugBase } from "./slug";
import type { Club } from "./types";

/**
 * Écritures des clubs (spec §10). L'appelant (Server Action) a déjà vérifié les droits avec
 * `lib/auth/permissions`. La règle des clubs est appliquée ici, sous verrou, dans la transaction d'adhésion.
 */

const ATTEMPTS = 5;

/** Rejoue `fn` quand une contrainte d'unicité refuse un slug ou un code tiré au même moment par un autre. */
async function retryOnConflict<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === ATTEMPTS) throw error;
    }
  }
}

export function createClub(db: Db, name: string, creatorId: string): Promise<Club> {
  return retryOnConflict(() =>
    db.transaction(async (tx) => {
      // Les slugs ne contiennent que des lettres, des chiffres et des tirets : pas de % ni de _ à échapper.
      const base = clubSlugBase(name);
      const taken = await tx.execute<{ slug: string }>(
        sql`SELECT slug FROM clubs WHERE slug = ${base} OR slug LIKE ${`${base}-%`}`,
      );
      const [club] = await tx
        .insert(clubs)
        .values({ name, slug: clubSlug(name, taken.rows.map((r) => r.slug)), inviteCode: newInviteCode(), createdBy: creatorId })
        .returning({ id: clubs.id, slug: clubs.slug, name: clubs.name, inviteCode: clubs.inviteCode });
      await tx.insert(clubMembers).values({ clubId: club.id, userId: creatorId, role: "animator" });
      return club;
    }),
  );
}

/** Le slug ne change pas, pour que les liens déjà partagés restent valides. */
export async function renameClub(db: Db, clubId: string, name: string): Promise<void> {
  await db.update(clubs).set({ name, updatedAt: new Date() }).where(eq(clubs.id, clubId));
}

/** Nouveau code d'invitation : l'ancien lien ne fonctionne plus. */
export function regenerateInvite(db: Db, clubId: string): Promise<string> {
  return retryOnConflict(async () => {
    const inviteCode = newInviteCode();
    await db.update(clubs).set({ inviteCode, updatedAt: new Date() }).where(eq(clubs.id, clubId));
    return inviteCode;
  });
}

/** Supprime le club, ses adhésions et ses playlists. Les copies personnelles des membres restent. */
export async function deleteClub(db: Db, clubId: string): Promise<void> {
  await db.delete(clubs).where(eq(clubs.id, clubId));
}

/** Donne le rôle d'animateur du club à l'un de ses membres. `false` s'il n'est pas un simple membre. */
export async function promoteMember(db: Db, clubId: string, userId: string): Promise<boolean> {
  const rows = await db
    .update(clubMembers)
    .set({ role: "animator", updatedAt: new Date() })
    .where(and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId), eq(clubMembers.role, "member")))
    .returning({ userId: clubMembers.userId });
  return rows.length === 1;
}

export type JoinOutcome =
  | { ok: true; club: Club; left: string[] }
  | { ok: false; reason: "invalid" | "already-member" | "needs-confirm" }
  | { ok: false; reason: "last-animator"; club: string };

/**
 * Rejoint le club du code d'invitation (spec §10). Verrous, toujours dans le même ordre pour éviter les
 * interblocages : la ligne de l'utilisateur (deux adhésions du même compte se suivent), puis le club visé et
 * ses clubs actuels, par identifiant (deux animateurs d'un club ne peuvent pas le quitter en même temps).
 */
export function joinClub(db: Db, user: Joiner, code: string, confirmed: boolean): Promise<JoinOutcome> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`);

    const target = await tx.execute<{ id: string }>(sql`SELECT id FROM clubs WHERE invite_code = ${code.toLowerCase()}`);
    const targetId = target.rows[0]?.id;
    if (!targetId) return { ok: false, reason: "invalid" };

    const own = await tx.execute<{ club_id: string }>(sql`SELECT club_id FROM club_members WHERE user_id = ${user.id}`);
    const ids = [...new Set([targetId, ...own.rows.map((r) => r.club_id)])];
    await tx.execute(sql`SELECT id FROM clubs WHERE id IN (${inList(ids)}) ORDER BY id FOR UPDATE`);

    // Relu sous verrou : le code a pu être régénéré entre-temps.
    const locked = await tx.execute<{ id: string; slug: string; name: string; invite_code: string }>(
      sql`SELECT id, slug, name, invite_code FROM clubs WHERE id = ${targetId} AND invite_code = ${code.toLowerCase()}`,
    );
    const row = locked.rows[0];
    if (!row) return { ok: false, reason: "invalid" };
    const club: Club = { id: row.id, slug: row.slug, name: row.name, inviteCode: row.invite_code };

    const memberships = await tx.execute<{ club_slug: string; user_id: string; role: Membership["role"] }>(sql`
      SELECT c.slug AS club_slug, m.user_id, m.role
      FROM club_members m JOIN clubs c ON c.id = m.club_id
      WHERE m.user_id = ${user.id}
        OR (m.role = 'animator' AND m.club_id IN (SELECT club_id FROM club_members WHERE user_id = ${user.id}))`);
    const decision = decideJoin(
      memberships.rows.map((r) => ({ clubSlug: r.club_slug, userId: r.user_id, role: r.role })),
      user,
      club.slug,
    );

    if (decision.kind === "already-member") return { ok: false, reason: "already-member" };
    if (decision.kind === "blocked") return { ok: false, reason: "last-animator", club: decision.club };
    if (decision.kind === "switch" && !confirmed) return { ok: false, reason: "needs-confirm" };

    const left = decision.kind === "switch" ? decision.leaving : [];
    if (left.length > 0) {
      await tx.execute(sql`
        DELETE FROM club_members
        WHERE user_id = ${user.id} AND club_id IN (SELECT id FROM clubs WHERE slug IN (${inList(left)}))`);
    }
    await tx.insert(clubMembers).values({ clubId: club.id, userId: user.id, role: "member" });
    return { ok: true, club, left };
  });
}
```

`Joiner.isAnimator` vient de la session. Un admin qui retire le rôle d'animateur pendant la session : la prochaine requête relit le rôle, puisque la session est lue en base à chaque requête (pas de cache de cookie).

- [ ] **Étape 8 : relancer les tests.** Lancer `pnpm test -- tests/unit` et `pnpm test:integration -- tests/integration/clubs.test.ts`. Attendu : PASS. Si le test des deux départs simultanés échoue par interblocage (`deadlock detected`), vérifier l'ordre des verrous avant tout autre changement.

- [ ] **Étape 9 : commit.**

```bash
git add src/lib/clubs src/lib/auth/permissions.ts tests
git commit -m "feat(clubs): clubs and memberships in the database, with the one-club rule under lock"
```

---

### Tâche 7 : playlists en base

**Fichiers :**
- Créer : `src/lib/playlist/queries.ts`, `src/lib/playlist/write.ts`
- Modifier : `src/lib/auth/permissions.ts` (droits des playlists), `src/lib/playlist/addToPlaylist.ts`, `src/lib/playlist/edit.ts`, `src/lib/playlist/rows.ts`, `src/lib/catalog/queries.ts` (`songLabelsOf`)
- Supprimer : `src/lib/playlist/rights.ts`, `tests/unit/playlist/rights.test.ts`
- Test : `tests/integration/playlists.test.ts`, `tests/unit/auth/permissions.test.ts`, `tests/unit/playlist/addToPlaylist.test.ts`, `tests/unit/playlist/rows.test.ts`, `tests/unit/playlist/edit.test.ts`

**Interfaces :**
- Consomme : `Playlist`, `PlaylistItem` (`src/types/catalog.ts`, inchangés) ; `CurrentUser`, `clubRoleOf` ; `inList`.
- Produit (`permissions.ts`) : `type PlaylistAccess = Pick<Playlist, "club" | "ownerId">`, `canViewPlaylist(user, playlist)`, `canEditPlaylist(user, playlist)`, `canCopyPlaylist(user, playlist)`. Mêmes noms qu'avant ; le droit de modifier une playlist de club vient désormais du rôle **dans ce club**.
- Produit (`queries.ts`) : `getPlaylist(id): Promise<Playlist | null>`, `personalPlaylistsOf(userId): Promise<Playlist[]>`, `clubPlaylistsOf(slugs: readonly string[]): Promise<Playlist[]>`, `editablePlaylistsOf(user: CurrentUser): Promise<Playlist[]>`. Toutes triées de la plus récemment modifiée à la plus ancienne.
- Produit (`write.ts`) : `type PlaylistOwner = { userId: string } | { clubId: string }`, `createPlaylist(db, { name, owner, createdBy, songId? }): Promise<string>`, `appendSong(db, playlistId, songId): Promise<"added" | "duplicate">`, `editItems(db, playlistId, edit: (items: PlaylistItem[]) => PlaylistItem[]): Promise<void>`, `renamePlaylist(db, playlistId, name): Promise<void>`, `copyPlaylist(db, sourceId, ownerId): Promise<string | null>`, `deletePlaylist(db, playlistId): Promise<void>`.
- Produit (`catalog/queries.ts`) : `songLabelsOf(ids: readonly string[]): Promise<Map<string, { song: SongLabel; removed: boolean }>>` avec `type SongLabel = Pick<Song, "id" | "titleAr" | "titleLatin" | "artists">`.
- Retiré : `editablePlaylists`, `appendSong` et `PlaylistEditor` de `addToPlaylist.ts` ; `copyPlaylist` de `rows.ts`. Ils sont remplacés par les requêtes en base. `parsePlaylistName`, `AddTarget`, `toAddTarget` et `readablePositions` restent.

- [ ] **Étape 1 : déplacer les droits des playlists et leurs tests.** Ajouter à `src/lib/auth/permissions.ts` :

```ts
import type { Playlist } from "@/types/catalog";

/**
 * Droits sur une playlist (spec §10) :
 *  - un club est privé : seuls ses membres voient ses playlists ;
 *  - une playlist personnelle est privée : seul son propriétaire la voit ;
 *  - les playlists d'un club se modifient par les animateurs de ce club ; ses membres les lisent et les copient.
 */
export type PlaylistAccess = Pick<Playlist, "club" | "ownerId">;

export function canViewPlaylist(user: CurrentUser | null, playlist: PlaylistAccess): boolean {
  if (!user) return false;
  return playlist.club ? user.clubSlugs.includes(playlist.club.slug) : playlist.ownerId === user.id;
}

export function canEditPlaylist(user: CurrentUser | null, playlist: PlaylistAccess): boolean {
  if (!canViewPlaylist(user, playlist)) return false;
  return playlist.club ? canManageClub(user, playlist.club.slug) : true;
}

/** « Copier dans mes playlists » : pour un membre qui lit la playlist de son club sans pouvoir la modifier. */
export function canCopyPlaylist(user: CurrentUser | null, playlist: PlaylistAccess): boolean {
  return playlist.club !== null && canViewPlaylist(user, playlist) && !canEditPlaylist(user, playlist);
}
```

Reprendre les cas de `tests/unit/playlist/rights.test.ts` dans `tests/unit/auth/permissions.test.ts`, en construisant les utilisateurs avec `userWith`. Ajouter ce cas, qui est nouveau :

```ts
it("un animateur global ne modifie pas la playlist d'un club où il est simple membre", () => {
  const sami = userWith({ isAnimator: true, clubs: [{ slug: "malouf-sfax", name: "Malouf Sfax", role: "member" }] });
  const playlist = { club: { slug: "malouf-sfax", name: "Malouf Sfax" }, ownerId: null };
  expect(canViewPlaylist(sami, playlist)).toBe(true);
  expect(canEditPlaylist(sami, playlist)).toBe(false);
  expect(canCopyPlaylist(sami, playlist)).toBe(true);
});
```

Supprimer `src/lib/playlist/rights.ts` et son test. Remplacer partout l'import `@/lib/playlist/rights` par `@/lib/auth/permissions` (`grep -rn "playlist/rights" src`).

- [ ] **Étape 2 : simplifier les fonctions pures.**
- `src/lib/playlist/addToPlaylist.ts` : supprimer `PlaylistEditor`, `editablePlaylists`, `AppendResult` et `appendSong`, et leurs `describe` dans `tests/unit/playlist/addToPlaylist.test.ts`. Garder `parsePlaylistName`, `PLAYLIST_NAME_MAX_LENGTH`, `AddTarget` et `toAddTarget`.
- `src/lib/playlist/rows.ts` : supprimer `copyPlaylist` et son `describe` dans `rows.test.ts`. Garder `readablePositions`.
- `src/lib/playlist/edit.ts` : `NAME_MAX_LENGTH` vaut désormais `PLAYLIST_NAME_MAX_LENGTH` (60, écart 7). Écrire `export { PLAYLIST_NAME_MAX_LENGTH as NAME_MAX_LENGTH } from "./addToPlaylist";` à la place de la constante, et vérifier que `edit.test.ts` passe toujours (il compare à la constante).

- [ ] **Étape 3 : écrire les tests d'intégration, qui doivent échouer.**

`tests/integration/playlists.test.ts` :

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { songLabelsOf } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { toCurrentUser } from "@/lib/auth/types";
import { clubPlaylistsOf, editablePlaylistsOf, getPlaylist, personalPlaylistsOf } from "@/lib/playlist/queries";
import { appendSong, copyPlaylist, createPlaylist, deletePlaylist, editItems, renamePlaylist } from "@/lib/playlist/write";
import { moveItem, removeItem, setItemNote } from "@/lib/playlist/edit";
import { eq } from "drizzle-orm";
import { insertClub, insertSong, insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("playlists en base", () => {
  beforeEach(resetDb);

  it("crée une playlist personnelle avec sa première chanson", async () => {
    const leila = await insertUser({ name: "Leïla" });
    const song = await insertSong("Habaytak");
    const id = await createPlaylist(db, { name: "À apprendre", owner: { userId: leila.id }, createdBy: leila.id, songId: song });
    expect(await getPlaylist(id)).toMatchObject({
      id,
      name: "À apprendre",
      club: null,
      ownerId: leila.id,
      items: [{ position: 1, songId: song, note: null }],
    });
  });

  it("ajoute en fin de liste, sans doublon", async () => {
    const leila = await insertUser();
    const [a, b] = [await insertSong("A"), await insertSong("B")];
    const id = await createPlaylist(db, { name: "P", owner: { userId: leila.id }, createdBy: leila.id });
    expect(await appendSong(db, id, a)).toBe("added");
    expect(await appendSong(db, id, b)).toBe("added");
    expect(await appendSong(db, id, a)).toBe("duplicate");
    expect((await getPlaylist(id))?.items.map((i) => [i.position, i.songId])).toEqual([[1, a], [2, b]]);
  });

  it("donne des positions distinctes à des ajouts simultanés", async () => {
    const leila = await insertUser();
    const ids = await Promise.all(["A", "B", "C", "D", "E"].map(insertSong));
    const id = await createPlaylist(db, { name: "P", owner: { userId: leila.id }, createdBy: leila.id });
    await Promise.all(ids.map((songId) => appendSong(db, id, songId)));
    expect((await getPlaylist(id))?.items.map((i) => i.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it("réordonne, retire et annote en gardant des positions sans trou", async () => {
    const leila = await insertUser();
    const [a, b, c] = [await insertSong("A"), await insertSong("B"), await insertSong("C")];
    const id = await createPlaylist(db, { name: "P", owner: { userId: leila.id }, createdBy: leila.id });
    for (const s of [a, b, c]) await appendSong(db, id, s);

    await editItems(db, id, (items) => moveItem(items, c, "up"));
    await editItems(db, id, (items) => removeItem(items, a));
    await editItems(db, id, (items) => setItemNote(items, b, "  tonalité   Ré "));

    expect((await getPlaylist(id))?.items).toEqual([
      { position: 1, songId: c, note: null },
      { position: 2, songId: b, note: "tonalité Ré" },
    ]);
  });

  it("trie par dernière modification, renomme et supprime", async () => {
    const leila = await insertUser();
    const song = await insertSong("A");
    const first = await createPlaylist(db, { name: "Première", owner: { userId: leila.id }, createdBy: leila.id });
    const second = await createPlaylist(db, { name: "Seconde", owner: { userId: leila.id }, createdBy: leila.id });
    await appendSong(db, first, song); // la première redevient la plus récente
    expect((await personalPlaylistsOf(leila.id)).map((p) => p.name)).toEqual(["Première", "Seconde"]);

    await renamePlaylist(db, second, "Renommée");
    await deletePlaylist(db, first);
    expect((await personalPlaylistsOf(leila.id)).map((p) => p.name)).toEqual(["Renommée"]);
  });

  it("lit les playlists d'un club avec son nom, et seulement celles-là", async () => {
    const sami = await insertUser({ isAnimator: true });
    const club = await insertClub({ name: "Les Jasmins", slug: "les-jasmins", animatorIds: [sami.id] });
    const other = await insertClub({ name: "Autre", slug: "autre", animatorIds: [sami.id] });
    await createPlaylist(db, { name: "Séance du jeudi", owner: { clubId: club.id }, createdBy: sami.id });
    await createPlaylist(db, { name: "Ailleurs", owner: { clubId: other.id }, createdBy: sami.id });
    const list = await clubPlaylistsOf(["les-jasmins"]);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: "Séance du jeudi", club: { slug: "les-jasmins", name: "Les Jasmins" }, ownerId: null });
    expect(await clubPlaylistsOf([])).toEqual([]);
  });

  it("propose à l'ajout ses playlists et celles des clubs qu'on anime, pas celles des autres clubs", async () => {
    const leila = await insertUser();
    const sami = await insertUser({ isAnimator: true });
    const jasmins = await insertClub({ name: "Les Jasmins", slug: "les-jasmins", animatorIds: [sami.id], memberIds: [leila.id] });
    await createPlaylist(db, { name: "Séance", owner: { clubId: jasmins.id }, createdBy: sami.id });
    await createPlaylist(db, { name: "Mes préférées", owner: { userId: leila.id }, createdBy: leila.id });

    const asLeila = toCurrentUser({ ...leila }, [{ slug: "les-jasmins", name: "Les Jasmins", role: "member" }]);
    const asSami = toCurrentUser({ ...sami, isAnimator: true }, [{ slug: "les-jasmins", name: "Les Jasmins", role: "animator" }]);
    expect((await editablePlaylistsOf(asLeila)).map((p) => p.name)).toEqual(["Mes préférées"]);
    expect((await editablePlaylistsOf(asSami)).map((p) => p.name)).toEqual(["Séance"]);
  });

  it("copie une playlist de club dans les playlists personnelles, avec ses notes", async () => {
    const sami = await insertUser({ isAnimator: true });
    const leila = await insertUser();
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [leila.id] });
    const [a, b] = [await insertSong("A"), await insertSong("B")];
    const source = await createPlaylist(db, { name: "Séance", owner: { clubId: club.id }, createdBy: sami.id });
    await appendSong(db, source, a);
    await appendSong(db, source, b);
    await editItems(db, source, (items) => setItemNote(items, b, "Lentement"));

    const copy = await copyPlaylist(db, source, leila.id);
    expect(await getPlaylist(copy!)).toMatchObject({
      name: "Séance",
      club: null,
      ownerId: leila.id,
      items: [
        { position: 1, songId: a, note: null },
        { position: 2, songId: b, note: "Lentement" },
      ],
    });
    expect(await copyPlaylist(db, "00000000-0000-4000-8000-000000000000", leila.id)).toBeNull();
  });

  it("renvoie null pour un identifiant inconnu ou qui n'est pas un UUID", async () => {
    expect(await getPlaylist("seance-du-jeudi")).toBeNull();
    expect(await getPlaylist("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("donne le titre des chansons d'une playlist, retirées comprises", async () => {
    const [a, b] = [await insertSong("Publiée"), await insertSong("Retirée")];
    await db.update(songs).set({ status: "removed" }).where(eq(songs.id, b));
    const labels = await songLabelsOf([a, b, "s-sidi-mansour"]);
    expect(labels.get(a)).toMatchObject({ song: { titleLatin: "Publiée" }, removed: false });
    expect(labels.get(b)).toMatchObject({ song: { titleLatin: "Retirée" }, removed: true });
    expect(labels.has("s-sidi-mansour")).toBe(false);
  });
});
```

- [ ] **Étape 4 : lancer les tests et constater l'échec.** Lancer `pnpm test:integration -- tests/integration/playlists.test.ts`. Attendu : FAIL, modules introuvables.

- [ ] **Étape 5 : écrire `songLabelsOf`.** Ajouter à `src/lib/catalog/queries.ts` :

```ts
export type SongLabel = Pick<Song, "id" | "titleAr" | "titleLatin" | "artists">;

/** Titre et artistes des chansons `ids`, publiées ou retirées (liste d'une playlist). Une requête. */
export async function songLabelsOf(ids: readonly string[]): Promise<Map<string, { song: SongLabel; removed: boolean }>> {
  const uuids = ids.filter(isUuid);
  if (uuids.length === 0) return new Map();
  const list = sql.join(
    uuids.map((id) => sql`${id}`),
    sql`, `,
  );
  const res = await db.execute<{
    id: string;
    title_ar: string | null;
    title_latin: string | null;
    status: "published" | "removed";
    artists: ArtistRef[];
  }>(sql`SELECT s.id, s.title_ar, s.title_latin, s.status, ${ARTISTS_OF("s")} AS artists FROM songs s WHERE s.id IN (${list})`);
  return new Map(
    res.rows.map((r) => [
      r.id,
      { song: { id: r.id, titleAr: r.title_ar, titleLatin: r.title_latin, artists: r.artists }, removed: r.status === "removed" },
    ]),
  );
}
```

- [ ] **Étape 6 : écrire les lectures.**

`src/lib/playlist/queries.ts` :

```ts
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import type { CurrentUser } from "@/lib/auth/types";
import { isUuid } from "@/lib/catalog/queries";
import { db } from "@/lib/db/client";
import { inList } from "@/lib/db/sqlList";
import type { Playlist, PlaylistItem } from "@/types/catalog";

type Row = {
  id: string;
  name: string;
  owner_user_id: string | null;
  updated_at: Date | string;
  club_slug: string | null;
  club_name: string | null;
  items: PlaylistItem[];
};

const toPlaylist = (r: Row): Playlist => ({
  id: r.id,
  name: r.name,
  club: r.club_slug && r.club_name ? { slug: r.club_slug, name: r.club_name } : null,
  ownerId: r.owner_user_id,
  items: r.items,
  updatedAt: new Date(r.updated_at).toISOString(),
});

/** Playlists qui répondent à `where`, avec leurs chansons dans l'ordre, de la plus récemment modifiée à la plus ancienne. */
async function playlistsWhere(where: SQL): Promise<Playlist[]> {
  const res = await db.execute<Row>(sql`
    SELECT p.id, p.name, p.owner_user_id, p.updated_at, c.slug AS club_slug, c.name AS club_name,
      COALESCE((
        SELECT json_agg(json_build_object('position', i.position, 'songId', i.song_id, 'note', i.note) ORDER BY i.position)
        FROM playlist_items i WHERE i.playlist_id = p.id
      ), '[]'::json) AS items
    FROM playlists p LEFT JOIN clubs c ON c.id = p.club_id
    WHERE ${where}
    ORDER BY p.updated_at DESC, p.id`);
  return res.rows.map(toPlaylist);
}

/** Une playlist, sans contrôle d'accès : l'appelant vérifie `canViewPlaylist`. */
export async function getPlaylist(id: string): Promise<Playlist | null> {
  if (!isUuid(id)) return null;
  const [playlist] = await playlistsWhere(sql`p.id = ${id}`);
  return playlist ?? null;
}

export const personalPlaylistsOf = (userId: string): Promise<Playlist[]> =>
  playlistsWhere(sql`p.owner_user_id = ${userId}`);

export async function clubPlaylistsOf(slugs: readonly string[]): Promise<Playlist[]> {
  if (slugs.length === 0) return [];
  return playlistsWhere(sql`c.slug IN (${inList(slugs)})`);
}

/** Playlists où l'utilisateur peut ajouter une chanson : les siennes, et celles des clubs qu'il anime. */
export async function editablePlaylistsOf(user: CurrentUser): Promise<Playlist[]> {
  const animated = user.clubs.filter((club) => club.role === "animator").map((club) => club.slug);
  const clubClause = animated.length > 0 ? sql` OR c.slug IN (${inList(animated)})` : sql``;
  return playlistsWhere(sql`(p.owner_user_id = ${user.id}${clubClause})`);
}
```

Un `PlaylistItem` renvoyé par `json_build_object` a ses clés en camelCase (`songId`). `position` arrive en nombre, et `note` en `null` ou en texte.

- [ ] **Étape 7 : écrire les écritures.**

`src/lib/playlist/write.ts` :

```ts
import "server-only";
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { playlistItems, playlists } from "@/lib/db/schema";
import type { PlaylistItem } from "@/types/catalog";

/**
 * Écritures des playlists (spec §10). L'appelant (Server Action) a vérifié les droits avec
 * `lib/auth/permissions` et l'existence de la chanson. Chaque modification verrouille la playlist
 * (`FOR UPDATE`) : deux ajouts simultanés reçoivent des positions distinctes.
 */

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type PlaylistOwner = { userId: string } | { clubId: string };

const lock = (tx: Tx, playlistId: string) => tx.execute(sql`SELECT id FROM playlists WHERE id = ${playlistId} FOR UPDATE`);
const touch = (tx: Tx, playlistId: string) =>
  tx.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));

export function createPlaylist(
  db: Db,
  input: { name: string; owner: PlaylistOwner; createdBy: string; songId?: string },
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(playlists)
      .values({
        name: input.name,
        ownerUserId: "userId" in input.owner ? input.owner.userId : null,
        clubId: "clubId" in input.owner ? input.owner.clubId : null,
        createdBy: input.createdBy,
      })
      .returning({ id: playlists.id });
    if (input.songId) await tx.insert(playlistItems).values({ playlistId: row.id, songId: input.songId, position: 1 });
    return row.id;
  });
}

/** Ajoute la chanson en fin de playlist. `duplicate` si elle y est déjà (« Déjà dans … »). */
export function appendSong(db: Db, playlistId: string, songId: string): Promise<"added" | "duplicate"> {
  return db.transaction(async (tx) => {
    await lock(tx, playlistId);
    const res = await tx.execute(sql`
      INSERT INTO playlist_items (playlist_id, song_id, position)
      SELECT ${playlistId}, ${songId}, COALESCE(MAX(position), 0) + 1 FROM playlist_items WHERE playlist_id = ${playlistId}
      ON CONFLICT (playlist_id, song_id) DO NOTHING
      RETURNING id`);
    if (res.rows.length === 0) return "duplicate";
    await touch(tx, playlistId);
    return "added";
  });
}

/**
 * Applique une modification pure de `lib/playlist/edit` (monter, descendre, retirer, remettre, annoter)
 * aux chansons lues sous verrou, puis réécrit la liste, positions 1 à n (écart 8).
 */
export function editItems(db: Db, playlistId: string, edit: (items: PlaylistItem[]) => PlaylistItem[]): Promise<void> {
  return db.transaction(async (tx) => {
    await lock(tx, playlistId);
    const current = await tx
      .select({ position: playlistItems.position, songId: playlistItems.songId, note: playlistItems.note })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(playlistItems.position);
    const next = [...edit(current)].sort((a, b) => a.position - b.position);
    if (JSON.stringify(next) === JSON.stringify(current)) return;

    await tx.delete(playlistItems).where(eq(playlistItems.playlistId, playlistId));
    if (next.length > 0) {
      await tx
        .insert(playlistItems)
        .values(next.map((item, i) => ({ playlistId, songId: item.songId, position: i + 1, note: item.note })));
    }
    await touch(tx, playlistId);
  });
}

export async function renamePlaylist(db: Db, playlistId: string, name: string): Promise<void> {
  await db.update(playlists).set({ name, updatedAt: new Date() }).where(eq(playlists.id, playlistId));
}

/** Copie personnelle d'une playlist (« Copier dans mes playlists ») : mêmes chansons, même ordre, mêmes notes. */
export function copyPlaylist(db: Db, sourceId: string, ownerId: string): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [source] = await tx.select({ name: playlists.name }).from(playlists).where(eq(playlists.id, sourceId));
    if (!source) return null;
    const [copy] = await tx
      .insert(playlists)
      .values({ name: source.name, ownerUserId: ownerId, createdBy: ownerId })
      .returning({ id: playlists.id });
    await tx.execute(sql`
      INSERT INTO playlist_items (playlist_id, song_id, position, note)
      SELECT ${copy.id}, song_id, position, note FROM playlist_items WHERE playlist_id = ${sourceId}`);
    return copy.id;
  });
}

export async function deletePlaylist(db: Db, playlistId: string): Promise<void> {
  await db.delete(playlists).where(eq(playlists.id, playlistId));
}
```

`copyPlaylist` reçoit l'identifiant d'une playlist dont l'appelant a vérifié l'accès. Si `sourceId` n'est pas un UUID, PostgreSQL lève une erreur : l'action le vérifie avant (`getPlaylist` renvoie `null`).

- [ ] **Étape 8 : relancer les tests.** Lancer `pnpm test` et `pnpm test:integration`. Attendu : PASS. `pnpm typecheck` signale les écrans qui importent encore `editablePlaylists`, `appendSong` ou `copyPlaylist` de la maquette : `mocks/playlistMemory.ts` et `actions/playlist.ts`. Les tâches 8 et 9 les réécrivent. Pour garder ce commit compilable, remplacer dès maintenant, dans ces deux fichiers, l'import supprimé par une copie locale de l'ancienne fonction pure, marquée `// MAQUETTE : retiré à la tâche 9`.

- [ ] **Étape 9 : commit.**

```bash
git add src/lib tests src/mocks src/app/actions
git commit -m "feat(playlists): playlists in the database, rights from the club role"
```

---

### Tâche 8 : brancher les écrans des clubs

**Fichiers :**
- Modifier : `src/app/actions/clubs.ts`, `src/app/clubs/(liste)/page.tsx`, `src/app/clubs/[slug]/loadClub.ts`, `src/app/clubs/[slug]/layout.tsx`, `src/app/clubs/[slug]/page.tsx`, `src/app/clubs/[slug]/membres/page.tsx`, `src/app/clubs/nouveau/page.tsx`, `src/app/rejoindre/[code]/page.tsx`, `src/app/moi/page.tsx`, `src/app/moi/compte/page.tsx`, `src/mocks/account.ts`
- Créer : `scripts/demo/demoData.ts` (données de démonstration reprises de la maquette)
- Supprimer : `src/mocks/clubStore.ts`, `tests/unit/clubs/clubStore.test.ts`

**Interfaces :**
- Consomme : `lib/clubs/queries`, `lib/clubs/write`, `lib/auth/permissions` (tâches 6 et 7), `clubPlaylistsOf`, `createPlaylist` (tâche 7).
- Produit (`scripts/demo/demoData.ts`) : `DEMO_PEOPLE: { key: string; name: string; email: string; isAnimator?: boolean; globalRole?: GlobalRole }[]`, `DEMO_CLUBS: { slug: string; name: string; inviteCode: string }[]`, `DEMO_MEMBERSHIPS: { club: string; person: string; role: ClubRole }[]`. La tâche 9 y ajoute `DEMO_PLAYLISTS`, la tâche 11 s'en sert.

- [ ] **Étape 1 : garder les données de démonstration.** Avant de supprimer `src/mocks/clubStore.ts`, reprendre dans `scripts/demo/demoData.ts` :
- `PEOPLE`, en ajoutant à chacun une adresse `<clé>@example.com` (`u-leila` → `leila@example.com`) ;
- les quatre sessions de démonstration : Leïla (membre), Sami (`isAnimator: true`), Nour (membre sans club), Rania (`globalRole: "moderator"`). Ajouter `isAnimator: true` pour Rim et Mohamed, qui animent un club ;
- `SEED_CLUBS` et `SEED_MEMBERSHIPS`, avec les mêmes codes d'invitation. `/rejoindre/nghw5ntz7a` reste ainsi l'exemple d'un club où aucune session de démonstration n'est.

Ce fichier est importé par un script, jamais par l'application.

- [ ] **Étape 2 : réécrire les actions.** Remplacer le corps de `src/app/actions/clubs.ts`, en gardant `FormState`, `JoinState`, `NameError`, `revalidateAll`, `text` et `openInviteLinkAction` :

```ts
import { isUuid } from "@/lib/catalog/queries";
import { canCreateClub, canManageClub } from "@/lib/auth/permissions";
import { getClubBySlug } from "@/lib/clubs/queries";
import { createClub, deleteClub, joinClub, promoteMember, regenerateInvite, renameClub } from "@/lib/clubs/write";
import { db } from "@/lib/db/client";
import { createPlaylist } from "@/lib/playlist/write";

/** L'utilisateur courant et le club, s'il anime ce club ; sinon l'action est refusée. */
async function requireClubAnimator(slug: string) {
  const user = await getCurrentUser();
  const club = typeof slug === "string" ? await getClubBySlug(slug) : null;
  if (!user || !club || !canManageClub(user, club.slug)) throw new Error("Réservé aux animateurs du club.");
  return { user, club };
}

export async function createClubAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/clubs/nouveau"));
  if (!canCreateClub(user)) throw new Error("Réservé aux animateurs.");

  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };

  const club = await createClub(db, check.name, user.id);
  revalidateAll();
  redirect(`${clubHref(club.slug)}?statut=cree`);
}

export async function renameClubAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };
  await renameClub(db, club.id, check.name);
  revalidateAll();
  return { done: check.name };
}

export async function regenerateInviteAction(slug: string): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  await regenerateInvite(db, club.id);
  revalidateAll();
  return { done: "regenerated" };
}

export async function deleteClubAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  if (!confirmsClubName(text(formData, "confirmName"), club.name)) return { error: "mismatch" };
  await deleteClub(db, club.id);
  revalidateAll();
  redirect("/clubs?statut=supprime");
}

export async function promoteMemberAction(slug: string, userId: string): Promise<FormState> {
  const { club } = await requireClubAnimator(slug);
  if (typeof userId !== "string" || !isUuid(userId)) return null;
  if (!(await promoteMember(db, club.id, userId))) return null;
  revalidateAll();
  return { done: userId };
}

export async function createClubPlaylistAction(slug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, club } = await requireClubAnimator(slug);
  // Mêmes règles qu'un nom de club : obligatoire, 60 caractères au plus.
  const check = validateClubName(text(formData, "name"));
  if (!check.ok) return { error: check.error };
  await createPlaylist(db, { name: check.name, owner: { clubId: club.id }, createdBy: user.id });
  revalidateAll();
  return { done: check.name };
}

export async function joinClubAction(code: string, _prev: JoinState, formData: FormData): Promise<JoinState> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref(`/rejoindre/${code}`));

  const result = await joinClub(db, user, code, text(formData, "confirm") === "1");
  if (!result.ok) {
    // La situation a pu changer depuis l'affichage (autre club rejoint, rôle changé, lien régénéré) :
    // on réaffiche la page, qui montre le bon cas.
    refresh();
    return { error: result.reason };
  }
  revalidateAll();
  redirect(`${clubHref(result.club.slug)}?statut=rejoint`);
}
```

Supprimer `resetDemoClubsAction` et l'import de `@/mocks/clubStore`. `JoinState.error` accepte déjà `"invalid" | "needs-confirm" | "already-member" | "last-animator"`.

- [ ] **Étape 3 : brancher les pages des clubs.**
- `clubs/(liste)/page.tsx` : `clubsOf(user.id)` vient de `@/lib/clubs/queries`, et devient `await clubsOf(user.id)`. La redirection d'un membre vers son club (`user.clubSlugs[0]`) ne change pas.
- `clubs/[slug]/loadClub.ts` : `const club = await getClubBySlug(slug); const role = club ? clubRoleOf(user, club.slug) : null;`.
- `clubs/[slug]/layout.tsx` : `const count = await memberCountOf(club.id);` à la place du filtre sur `memberships()`.
- `clubs/[slug]/page.tsx` : `const playlists = await clubPlaylistsOf([club.slug]);`.
- `clubs/[slug]/membres/page.tsx` : `const members = await membersOf(club.id, locale);`.
- `clubs/nouveau/page.tsx` : remplacer le test `user.isAnimator` par `canCreateClub(user)`.
- `rejoindre/[code]/page.tsx` : `getClubByInvite(code)`, `memberCountOf(club.id)`, `decideJoin(await joinMembershipsOf(user.id), user, club.slug)`, et `nameOf(slug)` lit `user.clubs.find((c) => c.slug === slug)?.name ?? slug`.

Chercher les restes avec `grep -rn "clubStore" src tests` : il ne doit rien rester. Puis supprimer `src/mocks/clubStore.ts` et `tests/unit/clubs/clubStore.test.ts`.

- [ ] **Étape 4 : brancher « Moi » et « Compte ».**
- `src/mocks/account.ts` ne garde que le nombre fictif de contributions en attente (plan 3) :

```ts
/** MAQUETTE (plan 3) : propositions en attente de l'utilisateur, en attendant la table `song_revisions`. */
export const pendingContributionsOf = (_userId: string): number => 0;
```

- `src/app/moi/page.tsx` : `clubsOf(user)` devient `user.clubs`, `accountFor(user).pendingContributions` devient `pendingContributionsOf(user.id)`, et `ClubRef` vient de `@/lib/clubs/types` ;
- `src/app/moi/compte/page.tsx` : l'e-mail vient de `user.email`, et `soleAnimatorClubs(user)` devient `await soleAnimatorClubs(user.id)` de `@/lib/clubs/queries`.

- [ ] **Étape 5 : vérifier.** Lancer `pnpm test`, `pnpm test:integration`, `pnpm typecheck` et `pnpm lint`. Attendu : PASS. Puis, avec `pnpm dev` et deux navigateurs (ou une fenêtre privée) :
- se connecter avec `sami@example.com`, puis lui donner le rôle : `pnpm user:role sami@example.com --animator`. Recharger : l'onglet devient « Clubs » ;
- créer « Les Jasmins », copier le lien d'invitation dans « Membres » ;
- dans l'autre navigateur, ouvrir ce lien, se connecter avec `leila@example.com`, rejoindre. Leïla voit « Mon club » ;
- Sami promeut Leïla, renomme le club, régénère le lien : l'ancien lien affiche « Ce lien n'est plus valide » ;
- Sami crée une playlist de club : elle apparaît chez Leïla.

- [ ] **Étape 6 : commit.**

```bash
git add -A src scripts/demo tests
git commit -m "feat(clubs): wire club, members, settings and invitation screens to the database"
```

---

### Tâche 9 : brancher les playlists, la feuille d'ajout, l'accueil et le lecteur

**Fichiers :**
- Modifier : `src/app/actions/playlist.ts`, `src/app/actions/addToPlaylist.ts`, `src/components/playlist/AddToPlaylistScope.tsx`, `src/app/page.tsx`, `src/app/playlists/(liste)/page.tsx`, `src/app/playlists/[id]/page.tsx`, `src/app/lecture/[playlistId]/[position]/page.tsx`, `src/lib/catalog/read.ts`, `src/components/playlist/PlaylistEditor.tsx`, `src/mocks/catalog.ts`, `scripts/demo/demoData.ts`, `messages/fr.json`, `messages/ar.json`
- Créer : `src/components/playlist/DeletePlaylistForm.tsx`
- Supprimer : `src/mocks/playlistStore.ts`, `src/mocks/playlistMemory.ts`, `src/mocks/session.ts`

**Interfaces :**
- Consomme : `getPlaylist`, `personalPlaylistsOf`, `clubPlaylistsOf`, `editablePlaylistsOf`, `createPlaylist`, `appendSong`, `editItems`, `renamePlaylist`, `copyPlaylist`, `deletePlaylist`, `songLabelsOf` (tâche 7) ; `canViewPlaylist`, `canEditPlaylist`, `canCopyPlaylist`, `clubsAnimatedBy` (tâches 6 et 7) ; `getClubBySlug` (tâche 6).
- Produit : `deletePlaylistAction(playlistId: string, _prev: DeleteState, formData: FormData): Promise<DeleteState>` avec `type DeleteState = { error?: "forbidden" } | null`.
- Produit (`scripts/demo/demoData.ts`) : `DEMO_PLAYLISTS: { name: string; club: string | null; owner: string | null; updatedAt: string; items: { songId: string; note: string | null }[] }[]`. `club` est un slug, `owner` une clé de `DEMO_PEOPLE`, et `songId` un identifiant fictif (`s-sidi-mansour`).
- `readerPositionsOf(playlist)` garde sa signature, mais ne lit plus que la base.

- [ ] **Étape 1 : garder les playlists de démonstration.** Copier `SEED_PLAYLISTS` de `src/mocks/catalog.ts` dans `DEMO_PLAYLISTS` (`scripts/demo/demoData.ts`), au format ci-dessus. Puis retirer de `src/mocks/catalog.ts` : `CLUBS`, `SEED_PLAYLISTS`, `PLAYLISTS`, `getPlaylist`, les constantes de clubs, et l'import du type `Playlist` s'il ne sert plus. `SONGS`, `REMOVED_SONGS`, `getSong` et `getRemovedSong` restent pour le plan 3.

- [ ] **Étape 2 : réécrire les actions des playlists.** `src/app/actions/playlist.ts` :

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canCopyPlaylist, canEditPlaylist } from "@/lib/auth/permissions";
import { isUuid } from "@/lib/catalog/queries";
import { songExists } from "@/lib/catalog/read";
import { db } from "@/lib/db/client";
import {
  insertItem,
  moveItem,
  normalizeNote,
  normalizePlaylistName,
  removeItem,
  setItemNote,
  type Direction,
} from "@/lib/playlist/edit";
import { getPlaylist } from "@/lib/playlist/queries";
import { copyPlaylist, deletePlaylist, editItems, renamePlaylist } from "@/lib/playlist/write";
import { getCurrentUser } from "@/lib/session";

/**
 * Actions du mode édition d'une playlist et de « Copier dans mes playlists ». Une action serveur est
 * joignable directement par POST : chacune vérifie les droits et la forme de ses arguments, et une
 * demande refusée ou périmée ne change rien.
 */

const isText = (value: unknown): value is string => typeof value === "string";

async function editablePlaylist(playlistId: unknown) {
  if (!isText(playlistId)) return null;
  const [playlist, user] = await Promise.all([getPlaylist(playlistId), getCurrentUser()]);
  return playlist && canEditPlaylist(user, playlist) ? playlist : null;
}

/** Les playlists apparaissent aussi sur l'accueil, dans le lecteur et dans les clubs. */
const refreshPages = () => revalidatePath("/", "layout");

export async function movePlaylistSong(playlistId: string, songId: string, direction: Direction): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId) || (direction !== "up" && direction !== "down")) return;
  await editItems(db, playlist.id, (items) => moveItem(items, songId, direction));
  refreshPages();
}

export async function removePlaylistSong(playlistId: string, songId: string): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId)) return;
  await editItems(db, playlist.id, (items) => removeItem(items, songId));
  refreshPages();
}

/** « Annuler » après un retrait : la chanson revient à sa position, avec sa note. */
export async function restorePlaylistSong(
  playlistId: string,
  item: { songId: string; position: number; note: string | null },
): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !item || !isText(item.songId) || !isUuid(item.songId) || !Number.isInteger(item.position)) return;
  if (!(await songExists(item.songId))) return;
  const note = isText(item.note) ? normalizeNote(item.note) : null;
  await editItems(db, playlist.id, (items) => insertItem(items, { songId: item.songId, position: item.position, note }));
  refreshPages();
}

export async function savePlaylistNote(playlistId: string, songId: string, note: string): Promise<void> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(songId) || !isText(note)) return;
  await editItems(db, playlist.id, (items) => setItemNote(items, songId, note));
  refreshPages();
}

export type RenameResult = { ok: true; name: string } | { ok: false; error: "empty" | "forbidden" };

export async function renamePlaylistAction(playlistId: string, rawName: string): Promise<RenameResult> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist || !isText(rawName)) return { ok: false, error: "forbidden" };
  const name = normalizePlaylistName(rawName);
  if (!name) return { ok: false, error: "empty" };
  await renamePlaylist(db, playlist.id, name);
  refreshPages();
  return { ok: true, name };
}

export type CopyResult = { ok: true; id: string } | { ok: false };

/** « Copier dans mes playlists » : une copie personnelle de la playlist d'un club, mêmes chansons et notes. */
export async function copyPlaylistToMine(playlistId: string): Promise<CopyResult> {
  if (!isText(playlistId)) return { ok: false };
  const [user, playlist] = await Promise.all([getCurrentUser(), getPlaylist(playlistId)]);
  if (!user || !playlist || !canCopyPlaylist(user, playlist)) return { ok: false };
  const id = await copyPlaylist(db, playlist.id, user.id);
  if (!id) return { ok: false };
  refreshPages();
  return { ok: true, id };
}

export type DeleteState = { error?: "forbidden" } | null;

/** Supprimer la playlist (spec §10), puis revenir à son club ou à « Mes playlists ». */
export async function deletePlaylistAction(playlistId: string, _prev: DeleteState, _formData: FormData): Promise<DeleteState> {
  const playlist = await editablePlaylist(playlistId);
  if (!playlist) return { error: "forbidden" };
  await deletePlaylist(db, playlist.id);
  refreshPages();
  redirect(playlist.club ? `/clubs/${encodeURIComponent(playlist.club.slug)}` : "/playlists");
}
```

L'ancienne action s'appelait `renamePlaylist`. Elle devient `renamePlaylistAction`, pour ne pas masquer la fonction de `write.ts`. Mettre à jour son import dans `PlaylistEditor.tsx`.

- [ ] **Étape 3 : réécrire l'ajout à une playlist.** Dans `src/app/actions/addToPlaylist.ts`, supprimer `simulateLatency` et les imports de la maquette, puis :

```ts
import { canEditPlaylist, clubsAnimatedBy } from "@/lib/auth/permissions";
import { isUuid } from "@/lib/catalog/queries";
import { getSong } from "@/lib/catalog/read";
import { getClubBySlug } from "@/lib/clubs/queries";
import { db } from "@/lib/db/client";
import { getPlaylist } from "@/lib/playlist/queries";
import { appendSong, createPlaylist } from "@/lib/playlist/write";

/** Seules les chansons de la base vont dans une playlist (clé étrangère) : une chanson fictive est introuvable. */
const findSong = async (songId: unknown) =>
  typeof songId === "string" && isUuid(songId) ? getSong(songId) : undefined;

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<AddToPlaylistResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "signedOut" };

  const playlist = typeof playlistId === "string" ? await getPlaylist(playlistId) : null;
  if (!playlist || !(await findSong(songId))) return { status: "notFound" };
  if (!canEditPlaylist(user, playlist)) return { status: "forbidden" };

  const status = await appendSong(db, playlist.id, songId);
  const updated = (await getPlaylist(playlist.id)) ?? playlist;
  return { status, target: toAddTarget(updated) };
}

export async function createPlaylistWithSong(input: {
  name: string;
  clubSlug: string | null;
  songId: string;
}): Promise<CreatePlaylistResult> {
  const user = await getCurrentUser();
  if (!user) return { status: "signedOut" };

  const parsed = parsePlaylistName(input?.name);
  if (!parsed.ok) return { status: "invalid", error: parsed.error };
  if (!(await findSong(input.songId))) return { status: "notFound" };

  let owner: { userId: string } | { clubId: string } = { userId: user.id };
  if (input.clubSlug != null) {
    const allowed = clubsAnimatedBy(user).some((club) => club.slug === input.clubSlug);
    const club = allowed ? await getClubBySlug(input.clubSlug) : null;
    if (!club) return { status: "forbidden" };
    owner = { clubId: club.id };
  }

  const id = await createPlaylist(db, { name: parsed.name, owner, createdBy: user.id, songId: input.songId });
  const playlist = await getPlaylist(id);
  return playlist ? { status: "created", target: toAddTarget(playlist) } : { status: "notFound" };
}
```

Les types `AddToPlaylistResult`, `CreatePlaylistResult` et `Failure` ne changent pas.

`src/components/playlist/AddToPlaylistScope.tsx` : `targets={(await editablePlaylistsOf(user)).map(toAddTarget)}` et `clubs={clubsAnimatedBy(user)}`.

- [ ] **Étape 4 : brancher l'accueil, « Mes playlists », la playlist et le lecteur.**
- `src/app/page.tsx` : `const [sessions, personal] = await Promise.all([clubPlaylistsOf(user.clubSlugs), personalPlaylistsOf(user.id)]);`.
- `src/app/playlists/(liste)/page.tsx` : `const playlists = user ? await personalPlaylistsOf(user.id) : [];`.
- `src/app/playlists/[id]/page.tsx` :
  - `findVisiblePlaylist(id)` : un visiteur est renvoyé vers la connexion (`redirect(signInHref(\`/playlists/${id}\`))`), comme le prévoyait le commentaire de la tâche 16 de la maquette. Sinon, `getPlaylist(id)` puis `canViewPlaylist` ;
  - les lignes : `const labels = await songLabelsOf(items.map((i) => i.songId));`, puis `song: labels.get(item.songId)?.song ?? null` ;
  - retirer `getSong`, `getRemovedSong` et l'import de `@/mocks/catalog`.
- `src/app/lecture/[playlistId]/[position]/page.tsx` : `getPlaylist` vient de `@/lib/playlist/queries` (`await`) ; un visiteur est renvoyé vers la connexion avec `retour` = la page du lecteur. Le reste (sauter les chansons retirées, `notFound` hors des bornes) ne change pas.
- `src/lib/catalog/read.ts` : `readerPositionsOf` ne lit plus que la base :

```ts
/** Numéros du lecteur pour les chansons lisibles de la playlist (les chansons retirées n'en ont pas). */
export async function readerPositionsOf(playlist: Pick<Playlist, "items">): Promise<Map<string, number>> {
  const published = await publishedSongIds(playlist.items.map((item) => item.songId));
  return readablePositions(playlist.items, (id) => published.has(id));
}
```

Mettre à jour le commentaire de tête de `read.ts` : seules les propositions, la modération et les signalements citent encore des chansons fictives (plan 3).

- [ ] **Étape 5 : supprimer une playlist.** Ajouter les messages (`playlistPage.editor`, en français puis en arabe) :

```json
"deleteTitle": "Supprimer la playlist",
"deleteBody": "Ses chansons et ses notes seront perdues. Les copies faites par les membres restent.",
"deleteStart": "Supprimer la playlist",
"deleteConfirm": "Supprimer définitivement",
"deleteCancel": "Annuler"
```

```json
"deleteTitle": "حذف القائمة",
"deleteBody": "ستُحذف أغانيها وملاحظاتها. تبقى النسخ التي صنعها الأعضاء.",
"deleteStart": "حذف القائمة",
"deleteConfirm": "حذف نهائي",
"deleteCancel": "إلغاء"
```

`src/components/playlist/DeletePlaylistForm.tsx`, sur le modèle de `DeleteClubForm` (`SettingsForms.tsx`), sans le nom à retaper : une playlist se refait plus facilement qu'un club.

```tsx
"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { deletePlaylistAction } from "@/app/actions/playlist";
import { useActionGuard } from "@/components/system/useActionGuard";
import { BUTTON_DANGER, BUTTON_DANGER_OUTLINE, BUTTON_SECONDARY } from "@/components/ui/styles";

/** Supprimer la playlist, en deux temps : le bouton ouvre une confirmation. */
export function DeletePlaylistForm({ playlistId }: { playlistId: string }) {
  const t = useTranslations("playlistPage.editor");
  const [open, setOpen] = useState(false);
  const { guardState } = useActionGuard();
  const [, action, pending] = useActionState(guardState(deletePlaylistAction.bind(null, playlistId)), null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${BUTTON_DANGER_OUTLINE} self-start`}>
        <Trash2 aria-hidden="true" className="size-4" />
        {t("deleteStart")}
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md bg-error-soft p-4">
      <p>{t("deleteBody")}</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={BUTTON_DANGER}>
          <Trash2 aria-hidden="true" className="size-4" />
          {t("deleteConfirm")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={BUTTON_SECONDARY}>
          {t("deleteCancel")}
        </button>
      </div>
    </form>
  );
}
```

Vérifier que `BUTTON_DANGER`, `BUTTON_DANGER_OUTLINE` et `BUTTON_SECONDARY` sont bien exportés par `@/components/ui/styles`, ou reprendre les classes que `SettingsForms.tsx` utilise. Dans `PlaylistEditor.tsx`, sous la liste et au-dessus de « Terminer », ajouter une section `aria-labelledby` titrée `t("deleteTitle")` qui contient `<DeletePlaylistForm playlistId={playlistId} />`. Le style est celui de la zone de suppression des réglages d'un club : bordure `border-error`.

- [ ] **Étape 6 : supprimer la maquette des playlists.** Supprimer `src/mocks/playlistStore.ts`, `src/mocks/playlistMemory.ts` et `src/mocks/session.ts`. `grep -rn "playlistStore\|playlistMemory\|mocks/session\|PLAYLISTS\|MAQUETTE : retiré à la tâche 9" src tests` ne doit plus rien trouver.

- [ ] **Étape 7 : vérifier.** Lancer `pnpm test`, `pnpm test:integration`, `pnpm typecheck` et `pnpm lint`. Attendu : PASS. Le 6e parcours de bout en bout (`search.spec.ts`) échoue : il utilise la playlist fictive `a-apprendre`. La tâche 12 le réécrit. Puis, avec `pnpm dev`, en Sami (animateur des Jasmins) :
- chercher « habaytak », « Ajouter à une playlist », créer « Séance du jeudi » dans Les Jasmins ;
- ajouter deux autres chansons, monter la dernière, annoter la première, retirer puis « Annuler » ;
- « Lire depuis le début », passer à la chanson suivante, vérifier « 2 / 3 » ;
- en Leïla (membre des Jasmins) : la playlist est sur l'accueil, en lecture seule ; « Copier dans mes playlists » la met dans « Mes playlists » ;
- en Sami, supprimer la playlist de club : la copie de Leïla reste.

- [ ] **Étape 8 : commit.**

```bash
git add -A src scripts/demo messages tests
git commit -m "feat(playlists): wire playlists, add-to-playlist sheet, home and reader to the database"
```

---
### Tâche 10 : compte (nom, langue, suppression)

**Fichiers :**
- Créer : `src/lib/account/write.ts`, `src/components/me/NameForm.tsx`
- Modifier : `src/app/actions/account.ts`, `src/app/actions/locale.ts`, `src/app/moi/compte/page.tsx`, `messages/fr.json`, `messages/ar.json`
- Test : `tests/integration/account.test.ts`

**Interfaces :**
- Consomme : `normalizeUserName`, `USER_NAME_MAX` (tâche 3), `soleAnimatorClubs` (tâche 6), `getAuth` (tâche 3).
- Produit : `updateUserName(db, userId, name): Promise<void>`, `setUserLocale(db, userId, locale: "fr" | "ar"): Promise<void>`, `deleteUserAccount(db, userId): Promise<DeleteAccountResult>` avec `type DeleteAccountResult = { ok: true } | { ok: false; reason: "last-animator"; clubs: ClubRef[] }`.
- Produit : `renameUserAction(_prev: NameState, formData: FormData): Promise<NameState>` avec `type NameState = { error?: "required" | "tooLong"; done?: string } | null`. `deleteAccount()` garde son nom (le composant `DeleteAccount` l'importe).

- [ ] **Étape 1 : écrire les tests, qui doivent échouer.**

`tests/integration/account.test.ts` :

```ts
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteUserAccount, setUserLocale, updateUserName } from "@/lib/account/write";
import { db } from "@/lib/db/client";
import { playlists, sessions, users } from "@/lib/db/schema";
import { insertClub, insertUser } from "./factories";
import { resetDb } from "./helpers";

describe("compte", () => {
  beforeEach(resetDb);

  it("change le nom et la langue", async () => {
    const leila = await insertUser({ name: "leila" });
    await updateUserName(db, leila.id, "Leïla Ben Salah");
    await setUserLocale(db, leila.id, "ar");
    const [row] = await db.select().from(users).where(eq(users.id, leila.id));
    expect(row).toMatchObject({ name: "Leïla Ben Salah", locale: "ar" });
  });

  it("refuse la suppression du seul animateur d'un club", async () => {
    const sami = await insertUser({ isAnimator: true });
    await insertClub({ name: "Les Jasmins", slug: "les-jasmins", animatorIds: [sami.id] });
    expect(await deleteUserAccount(db, sami.id)).toEqual({
      ok: false,
      reason: "last-animator",
      clubs: [{ slug: "les-jasmins", name: "Les Jasmins" }],
    });
    expect(await db.select().from(users).where(eq(users.id, sami.id))).toHaveLength(1);
  });

  it("supprime le compte, ses sessions, ses playlists et ses adhésions ; les playlists du club restent", async () => {
    const sami = await insertUser({ isAnimator: true });
    const leila = await insertUser();
    const club = await insertClub({ name: "C", animatorIds: [sami.id], memberIds: [leila.id] });
    await db.insert(playlists).values({ name: "Mes préférées", ownerUserId: leila.id });
    await db.insert(playlists).values({ name: "Séance", clubId: club.id, createdBy: leila.id });
    await db.insert(sessions).values({ userId: leila.id, token: "t", expiresAt: new Date(Date.now() + 3600_000) });

    expect(await deleteUserAccount(db, leila.id)).toEqual({ ok: true });

    const count = async (table: string) =>
      Number((await db.execute<{ n: string }>(sql.raw(`SELECT count(*) AS n FROM ${table}`))).rows[0].n);
    expect(await count("users")).toBe(1);
    expect(await count("sessions")).toBe(0);
    expect(await count("club_members")).toBe(1);
    const left = await db.select().from(playlists);
    expect(left.map((p) => [p.name, p.createdBy])).toEqual([["Séance", null]]);
  });

  it("un animateur qui n'est pas le seul de son club peut supprimer son compte", async () => {
    const [sami, rim] = [await insertUser({ isAnimator: true }), await insertUser({ isAnimator: true })];
    await insertClub({ name: "C", animatorIds: [sami.id, rim.id] });
    expect(await deleteUserAccount(db, sami.id)).toEqual({ ok: true });
  });
});
```

- [ ] **Étape 2 : lancer les tests et constater l'échec.** Lancer `pnpm test:integration -- tests/integration/account.test.ts`. Attendu : FAIL, module introuvable.

- [ ] **Étape 3 : implémenter.**

`src/lib/account/write.ts` :

```ts
import "server-only";
import { eq, sql } from "drizzle-orm";
import type { ClubRef } from "@/lib/clubs/types";
import type { Db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function updateUserName(db: Db, userId: string, name: string): Promise<void> {
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId));
}

/** Langue de l'interface, gardée avec le compte (spec §5). Le cookie `locale` reste la source de l'affichage. */
export async function setUserLocale(db: Db, userId: string, locale: "fr" | "ar"): Promise<void> {
  await db.update(users).set({ locale, updatedAt: new Date() }).where(eq(users.id, userId));
}

export type DeleteAccountResult = { ok: true } | { ok: false; reason: "last-animator"; clubs: ClubRef[] };

/**
 * Supprime le compte (spec §12) : ses sessions, ses playlists personnelles et ses adhésions partent avec lui
 * (clés étrangères en cascade). Refusé tant qu'il est le seul animateur d'un club. Verrous : l'utilisateur,
 * puis ses clubs par identifiant, comme l'adhésion (`lib/clubs/write`). Plan 3 : rattacher ses révisions
 * au compte « compte supprimé » dans la même transaction.
 */
export function deleteUserAccount(db: Db, userId: string): Promise<DeleteAccountResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);
    await tx.execute(sql`
      SELECT id FROM clubs WHERE id IN (SELECT club_id FROM club_members WHERE user_id = ${userId})
      ORDER BY id FOR UPDATE`);
    const sole = await tx.execute<ClubRef>(sql`
      SELECT c.slug, c.name
      FROM club_members m JOIN clubs c ON c.id = m.club_id
      WHERE m.user_id = ${userId} AND m.role = 'animator'
        AND NOT EXISTS (
          SELECT 1 FROM club_members o
          WHERE o.club_id = m.club_id AND o.role = 'animator' AND o.user_id <> ${userId})
      ORDER BY m.created_at`);
    if (sole.rows.length > 0) return { ok: false, reason: "last-animator", clubs: sole.rows };
    await tx.delete(users).where(eq(users.id, userId));
    return { ok: true };
  });
}
```

Dans `src/app/actions/account.ts`, remplacer `deleteAccount` et ajouter `renameUserAction` :

```ts
/**
 * Supprimer son compte (spec §12). La règle du dernier animateur est revérifiée ici, puis dans la
 * transaction de suppression. La déconnexion vient d'abord, car elle a besoin de la session ; si la
 * suppression échoue ensuite (un club a perdu son autre animateur entre-temps), on est seulement déconnecté.
 */
export async function deleteAccount(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/moi/compte"));
  if ((await soleAnimatorClubs(user.id)).length > 0) redirect("/moi/compte", RedirectType.replace);

  await getAuth().api.signOut({ headers: await headers() });
  const result = await deleteUserAccount(db, user.id);
  revalidatePath("/", "layout");
  redirect(result.ok ? "/moi?compte=supprime" : "/moi/compte", RedirectType.replace);
}

export type NameState = { error?: "required" | "tooLong"; done?: string } | null;

/** Changer son nom, affiché aux autres membres de ses clubs. */
export async function renameUserAction(_prev: NameState, formData: FormData): Promise<NameState> {
  const user = await getCurrentUser();
  if (!user) redirect(signInHref("/moi/compte"));
  const check = normalizeUserName(formData.get("name"));
  if (!check.ok) return { error: check.error };
  await updateUserName(db, user.id, check.name);
  revalidatePath("/", "layout");
  return { done: check.name };
}
```

Dans `src/app/actions/locale.ts`, après l'écriture du cookie :

```ts
  const user = await getCurrentUser();
  if (user) await setUserLocale(db, user.id, value);
```

- [ ] **Étape 4 : le formulaire du nom.** Ajouter à `account` dans `messages/fr.json` : `"editName": "Modifier"`, `"nameSave": "Enregistrer"`, `"nameCancel": "Annuler"`, `"nameRequired": "Saisissez votre nom."`, `"nameTooLong": "60 caractères au plus."`, `"nameHint": "Les membres de vos clubs voient ce nom."`, `"nameSaved": "Nom enregistré."`. Et dans `messages/ar.json` : `"editName": "تعديل"`, `"nameSave": "حفظ"`, `"nameCancel": "إلغاء"`, `"nameRequired": "اكتب اسمك."`, `"nameTooLong": "60 حرفًا على الأكثر."`, `"nameHint": "يرى أعضاء ناديك هذا الاسم."`, `"nameSaved": "حُفظ الاسم."`.

`src/components/me/NameForm.tsx` :

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { renameUserAction, type NameState } from "@/app/actions/account";
import { useActionGuard } from "@/components/system/useActionGuard";
import { Bidi } from "@/components/ui/Bidi";
import { USER_NAME_MAX } from "@/lib/auth/name";

/** Ligne « Nom » du compte : le nom, et « Modifier » qui ouvre le champ en place. */
export function NameForm({ name }: { name: string }) {
  const t = useTranslations("account");
  const [editing, setEditing] = useState(false);
  const { guardState } = useActionGuard();
  const [state, action, pending] = useActionState<NameState, FormData>(
    guardState(async (prev: NameState, formData: FormData) => {
      const next = await renameUserAction(prev, formData);
      if (next?.done) setEditing(false);
      return next;
    }),
    null,
  );
  const shown = state?.done ?? name;

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">
          <Bidi>{shown}</Bidi>
          {state?.done ? <span role="status" className="sr-only"> {t("nameSaved")}</span> : null}
        </span>
        <button type="button" onClick={() => setEditing(true)} className="min-h-11 rounded-md px-3 font-medium text-link">
          {t("editName")}
        </button>
      </div>
    );
  }

  const error = state?.error === "required" ? t("nameRequired") : state?.error === "tooLong" ? t("nameTooLong") : null;
  return (
    <form action={action} className="flex flex-col gap-2">
      <input
        name="name"
        defaultValue={shown}
        dir="auto"
        autoComplete="name"
        maxLength={USER_NAME_MAX + 10}
        aria-label={t("name")}
        aria-invalid={error ? true : undefined}
        aria-describedby="name-hint"
        className="h-12 w-full rounded-md border border-line bg-card px-3 text-base aria-invalid:border-error"
      />
      <p id="name-hint" className={error ? "text-sm text-error" : "text-sm text-ink-2"}>
        {error ?? t("nameHint")}
      </p>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-accent px-4 font-medium text-accent-ink">
          {t("nameSave")}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-md border border-line px-4 font-medium">
          {t("nameCancel")}
        </button>
      </div>
    </form>
  );
}
```

Vérifier la signature de `guardState` dans `src/components/system/useActionGuard.ts` avant d'écrire ce composant : il faut l'utiliser comme `RenameClubForm` (`SettingsForms.tsx`) le fait. Si `guardState` ne prend que l'action brute, passer `renameUserAction` et fermer le champ dans un `useEffect` qui suit `state?.done`. Reprendre aussi les classes de bouton de `@/components/ui/styles` plutôt que celles écrites ici, si elles existent.

Dans `src/app/moi/compte/page.tsx`, remplacer le `<dd>` du nom par `<dd><NameForm name={user.name} /></dd>`.

- [ ] **Étape 5 : relancer les tests et vérifier.** Lancer `pnpm test`, `pnpm test:integration` et `pnpm typecheck`. Attendu : PASS. Avec `pnpm dev` :
- changer son nom sur `/moi/compte` : il apparaît dans « Membres » de son club ;
- un animateur seul de son club voit l'encadré « désignez un autre animateur », et non le bouton de suppression ;
- un membre supprime son compte, se retrouve en visiteur sur `/moi?compte=supprime`, et se reconnecter avec la même adresse crée un compte neuf.

- [ ] **Étape 6 : commit.**

```bash
git add src tests messages
git commit -m "feat(account): edit the display name, store the locale, delete the account"
```

---

### Tâche 11 : données de démonstration en base

**Fichiers :**
- Créer : `scripts/seed-demo.ts`
- Modifier : `package.json` (script `seed:demo`), `README.md`, `src/app/apercu/etats/page.tsx` (si un texte renvoie encore aux sessions de démonstration)

**Interfaces :**
- Consomme : `DEMO_PEOPLE`, `DEMO_CLUBS`, `DEMO_MEMBERSHIPS`, `DEMO_PLAYLISTS` (tâches 8 et 9) ; `seedFixtures(db)` (plan 1), qui renvoie la correspondance entre identifiant fictif et UUID.
- Produit : `pnpm seed:demo`. Il est idempotent : il remplace les comptes et les clubs de démonstration, sans toucher aux autres données.

- [ ] **Étape 1 : écrire le script.**

`scripts/seed-demo.ts` :

```ts
// Plan 2, tâche 11 : comptes, clubs et playlists de démonstration (ceux de la maquette) dans la base locale.
// On se connecte ensuite avec leila@example.com, sami@example.com… : le lien est dans la boîte locale.
// Refusé hors de localhost. Idempotent : les comptes et les clubs de démonstration sont recréés.
import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db, pool } from "@/lib/db/client";
import { clubMembers, clubs, playlistItems, playlists, users } from "@/lib/db/schema";
import { seedFixtures } from "../tests/fixtures/seed";
import { DEMO_CLUBS, DEMO_MEMBERSHIPS, DEMO_PEOPLE, DEMO_PLAYLISTS } from "./demo/demoData";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) throw new Error("seed-demo : refusé hors de localhost.");

  const songIds = await seedFixtures(db);

  await db.transaction(async (tx) => {
    await tx.delete(clubs).where(inArray(clubs.slug, DEMO_CLUBS.map((c) => c.slug)));
    await tx.delete(users).where(inArray(users.email, DEMO_PEOPLE.map((p) => p.email)));

    const people = new Map<string, string>();
    for (const p of DEMO_PEOPLE) {
      const [row] = await tx
        .insert(users)
        .values({ name: p.name, email: p.email, emailVerified: true, isAnimator: p.isAnimator ?? false, globalRole: p.globalRole ?? "member" })
        .returning({ id: users.id });
      people.set(p.key, row.id);
    }

    const clubIds = new Map<string, string>();
    for (const c of DEMO_CLUBS) {
      const creator = DEMO_MEMBERSHIPS.find((m) => m.club === c.slug && m.role === "animator");
      const [row] = await tx
        .insert(clubs)
        .values({ name: c.name, slug: c.slug, inviteCode: c.inviteCode, createdBy: creator ? people.get(creator.person) : null })
        .returning({ id: clubs.id });
      clubIds.set(c.slug, row.id);
    }
    // Une adhésion par seconde, dans l'ordre du fichier : l'ordre d'adhésion (et donc des clubs de Sami) est stable.
    const start = Date.now() - DEMO_MEMBERSHIPS.length * 1000;
    await tx.insert(clubMembers).values(
      DEMO_MEMBERSHIPS.map((m, i) => ({
        clubId: clubIds.get(m.club)!,
        userId: people.get(m.person)!,
        role: m.role,
        createdAt: new Date(start + i * 1000),
      })),
    );

    for (const p of DEMO_PLAYLISTS) {
      const updatedAt = new Date(p.updatedAt);
      const [row] = await tx
        .insert(playlists)
        .values({
          name: p.name,
          clubId: p.club ? clubIds.get(p.club)! : null,
          ownerUserId: p.owner ? people.get(p.owner)! : null,
          updatedAt,
        })
        .returning({ id: playlists.id });
      const items = p.items.flatMap((item) => {
        const songId = songIds.get(item.songId);
        return songId ? [{ songId, note: item.note }] : [];
      });
      if (items.length > 0) {
        await tx.insert(playlistItems).values(items.map((item, i) => ({ playlistId: row.id, position: i + 1, ...item })));
      }
    }
  });

  console.log(`${DEMO_PEOPLE.length} comptes, ${DEMO_CLUBS.length} clubs et ${DEMO_PLAYLISTS.length} playlists de démonstration.`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

Ajouter `"seed:demo": "tsx scripts/seed-demo.ts"` dans `package.json`.

- [ ] **Étape 2 : documenter.** Dans le `README.md`, section « Développement » :
- `pnpm seed:demo` : comptes de démonstration (Leïla, membre des Jasmins ; Sami, animateur de trois clubs ; Nour, sans club ; Rania, modératrice), leurs clubs et leurs playlists ;
- se connecter : `/connexion`, saisir l'adresse, puis « Ouvrir le lien reçu » ;
- tester sur un téléphone du même Wi-Fi : régler `BETTER_AUTH_URL` sur l'adresse du poste (`http://192.168.x.y:3000`), sinon le lien du message pointe vers `localhost`.

- [ ] **Étape 3 : vérifier.** Lancer `pnpm seed:demo` deux fois de suite, sans erreur. Se connecter avec `sami@example.com` : l'accueil montre « Séance du jeudi » et les autres playlists de ses clubs. `/rejoindre/nghw5ntz7a` invite dans Nghanniw. Lancer `pnpm typecheck`.

- [ ] **Étape 4 : commit.**

```bash
git add scripts package.json README.md src/app/apercu
git commit -m "chore(dev): demo accounts, clubs and playlists in the local database"
```

---

### Tâche 12 : tests de bout en bout et CI

**Fichiers :**
- Créer : `tests/e2e/support/signIn.ts`, `tests/e2e/auth.spec.ts`, `tests/e2e/clubs.spec.ts`, `tests/e2e/playlists.spec.ts`
- Modifier : `tests/e2e/search.spec.ts` (retirer le 6e parcours), `tests/e2e/globalSetup.ts`, `playwright.config.ts`, `src/lib/auth/auth.ts` (limite de Better Auth désactivable), `.github/workflows/ci.yml`

**Interfaces :**
- Consomme : la boîte locale (tâche 2), l'aperçu « Ouvrir le lien reçu » (tâche 4), `pnpm seed:demo` (tâche 11).
- Produit : `signIn(page: Page, email: string, retour?: string): Promise<void>`.

- [ ] **Étape 1 : préparer le serveur de test.**
- `playwright.config.ts`, `webServer.env` :

```ts
env: {
  DATABASE_URL,
  BETTER_AUTH_SECRET: "secret-de-bout-en-bout-0123456789abcdef",
  BETTER_AUTH_URL: "http://localhost:3100",
  MAIL_TRANSPORT: "outbox",
  OUTBOX_DIR: ".outbox-e2e",
  // Les parcours ouvrent plus de 5 liens par minute depuis la même adresse.
  BETTER_AUTH_RATE_LIMIT: "off",
},
```

- `src/lib/auth/auth.ts`, dans les options passées à `betterAuth` (dans `createAuth`) : `...(process.env.BETTER_AUTH_RATE_LIMIT === "off" ? { rateLimit: { enabled: false } } : {}),`. Commenter : « tests de bout en bout seulement ».
- `tests/e2e/globalSetup.ts` : vider `.outbox-e2e`, puis enchaîner `pnpm db:migrate && pnpm seed:fixtures && pnpm seed:demo` avec la même `DATABASE_URL`. `seed:fixtures` vide aussi `rate_limits` : chaque lancement repart sous les limites des liens magiques.

```ts
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

/** Migre la base de test, la vide, y écrit le catalogue fictif et les comptes de démonstration (refusé hors de localhost). */
export default function globalSetup(): void {
  const DATABASE_URL = process.env.DATABASE_URL_TEST ?? "postgres://ghanni:ghanni@localhost:5433/ghanni_test";
  rmSync(".outbox-e2e", { recursive: true, force: true });
  execSync("pnpm db:migrate && pnpm seed:fixtures && pnpm seed:demo", { stdio: "inherit", env: { ...process.env, DATABASE_URL } });
}
```

Ajouter `.outbox-e2e/` au `.gitignore`.

- [ ] **Étape 2 : écrire l'aide de connexion.**

`tests/e2e/support/signIn.ts` :

```ts
import { expect, type Page } from "@playwright/test";

/**
 * Connexion par lien magique, comme un utilisateur : le formulaire, « Vérifiez vos e-mails », puis le lien,
 * ouvert depuis l'aperçu de la boîte locale. Revient à `retour`.
 */
export async function signIn(page: Page, email: string, retour = "/"): Promise<void> {
  await page.goto(`/connexion?retour=${encodeURIComponent(retour)}`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
  await expect(page.getByRole("heading", { name: "Vérifiez vos e-mails" })).toBeVisible();
  await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
  await page.waitForURL((url) => `${url.pathname}${url.search}` === retour);
}
```

- [ ] **Étape 3 : écrire les parcours.**

`tests/e2e/auth.spec.ts` :

```ts
import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("se connecter par lien magique, se déconnecter, et un lien ne sert qu'une fois", async ({ page }) => {
  await page.goto("/connexion?retour=/moi");
  await page.getByLabel("Adresse e-mail").fill("nouvelle@example.com");
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
  const link = await page.getByRole("link", { name: "Ouvrir le lien reçu" }).getAttribute("href");
  await page.goto(link!);
  await expect(page).toHaveURL(/\/moi$/);
  await expect(page.getByRole("heading", { level: 1, name: "nouvelle" })).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto(link!);
  await expect(page.getByRole("alert")).toContainText("a expiré ou a déjà servi");
});

test("une page réservée renvoie un visiteur à la connexion, puis le ramène", async ({ page }) => {
  await page.goto("/playlists/00000000-0000-4000-8000-000000000000");
  await expect(page).toHaveURL(/\/connexion\?retour=/);
  await signIn(page, "leila@example.com", "/moi");
  await expect(page.getByRole("heading", { level: 1, name: "Leïla" })).toBeVisible();
});
```

`tests/e2e/clubs.spec.ts` :

```ts
import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("rejoindre un club par son lien d'invitation (spec §13, parcours c)", async ({ page }) => {
  await page.goto("/rejoindre/nghw5ntz7a");
  await expect(page.getByRole("heading", { level: 1, name: "Nghanniw" })).toBeVisible();
  await page.getByRole("link", { name: "Se connecter pour rejoindre" }).click();

  await page.getByLabel("Adresse e-mail").fill("nour@example.com");
  await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
  await page.getByRole("link", { name: "Ouvrir le lien reçu" }).click();
  await expect(page).toHaveURL(/\/rejoindre\/nghw5ntz7a$/);

  await page.getByRole("button", { name: "Rejoindre" }).click();
  await expect(page).toHaveURL(/\/clubs\/nghanniw\?statut=rejoint$/);
  await expect(page.getByRole("heading", { level: 1, name: "Nghanniw" })).toBeVisible();
});

test("un membre qui change de club doit confirmer, et quitte le premier", async ({ page }) => {
  await signIn(page, "leila@example.com", "/rejoindre/h4ttzr8wpc");
  await expect(page.getByText(/Rejoindre .*Malouf Sfax.* vous fera quitter .*Les Jasmins/)).toBeVisible();
  await page.getByRole("button", { name: "Changer de club" }).click();
  await expect(page).toHaveURL(/\/clubs\/malouf-sfax\?statut=rejoint$/);

  await page.goto("/clubs/les-jasmins");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});
```

Vérifier les textes exacts dans `messages/fr.json` (`clubs.join.switchBody`, la page 404 des clubs) et les reprendre tels quels. Les deux tests de clubs modifient les données de démonstration : ils doivent tourner après `playlists.spec.ts`, ou se resservir de comptes distincts. Les tests tournent dans l'ordre alphabétique des fichiers, avec un seul travailleur : `auth`, `clubs`, `playlists`, `search`. Le parcours des playlists n'utilise donc ni Leïla ni Nour.

`tests/e2e/playlists.spec.ts` :

```ts
import { expect, test } from "@playwright/test";
import { signIn } from "./support/signIn";

test("ajouter une chanson à une playlist de club, ouvrir le lecteur et naviguer (spec §13, parcours a)", async ({ page }) => {
  await signIn(page, "sami@example.com", "/recherche?q=habaytak");
  await page.getByRole("button", { name: /Ajouter .*Habaytak Bel Saif.* à une playlist/ }).click();
  await page.getByRole("button", { name: /Classiques égyptiens/ }).click();
  await expect(page.getByText(/Ajoutée à «\s.*Classiques égyptiens.*\s»/)).toBeVisible();

  await page.goto("/clubs/malouf-sfax");
  await page.getByRole("link", { name: /Classiques égyptiens/ }).first().click();
  await expect(page.getByText(/Malouf Sfax · 5 chansons/)).toBeVisible();
  await page.getByRole("link", { name: /Habaytak/ }).click();
  await expect(page.getByText("5 / 5")).toBeVisible();
  await expect(page.getByTestId("lyrics")).toContainText("على البحر كنا نغنّي");

  await page.getByRole("button", { name: "Chanson précédente" }).click();
  await expect(page.getByText("4 / 5")).toBeVisible();
});

test("un membre lit la playlist de son club et la copie dans ses playlists", async ({ page }) => {
  await signIn(page, "rania@example.com", "/");
  await page.getByRole("link", { name: /Séance du jeudi/ }).first().click();
  await expect(page.getByRole("link", { name: "Modifier" })).toHaveCount(0);
  await page.getByRole("button", { name: "Copier dans mes playlists" }).click();
  await page.goto("/playlists");
  await expect(page.getByRole("link", { name: /Séance du jeudi/ })).toBeVisible();
});
```

Les libellés « Modifier » et « Copier dans mes playlists » sont à vérifier dans `messages/fr.json` (`playlistPage.edit`, et le bouton de `CopyPlaylistButton`). Rania est modératrice et membre des Jasmins : la tâche 11 garde son adhésion.

Dans `tests/e2e/search.spec.ts`, supprimer le 6e parcours (« une chanson trouvée en base s'ajoute à une playlist… ») : `playlists.spec.ts` le remplace.

- [ ] **Étape 4 : CI.** Dans `.github/workflows/ci.yml`, job `test`, ajouter à `env` : `BETTER_AUTH_SECRET: ci-secret-ci-secret-ci-secret-0123` et `BETTER_AUTH_URL: http://localhost:3100`. Les tests d'intégration ont leurs propres valeurs (tâche 3), et Playwright passe les siennes au serveur. Le job `docker` ne change pas : sans cookie de session, l'accueil ne démarre pas Better Auth (voir `getCurrentUser`), et il est donc servi sans secret.

- [ ] **Étape 5 : lancer les tests de bout en bout.** Lancer `CI=true pnpm test:e2e`. Attendu : PASS, soit les 5 parcours de recherche restants et les 6 nouveaux. Puis lancer toute la suite (`pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration`).

- [ ] **Étape 6 : commit.**

```bash
git add tests/e2e playwright.config.ts src/lib/auth/auth.ts .github/workflows/ci.yml .gitignore
git commit -m "test(e2e): sign-in, club invitation, club playlist and reader journeys"
```

---

### Tâche 13 : déploiement, documentation et état du plan

**Fichiers :**
- Modifier : `README.md`, `docs/superpowers/specs/2026-11-18-plateforme-paroles-design.md`, ce plan

- [ ] **Étape 1 : README, section « Déploiement (Vercel + Neon) ».** Ajouter les étapes des comptes :
1. **Secret** : `openssl rand -base64 32` → `BETTER_AUTH_SECRET` dans Vercel ; `BETTER_AUTH_URL` = l'adresse publique (`https://…`).
2. **E-mails** : un fournisseur SMTP transactionnel (Resend, Brevo, Mailjet ou Postmark, tous en SMTP). `SMTP_URL=smtps://utilisateur:motdepasse@smtp.fournisseur:465` et `MAIL_FROM="Ghnaya <connexion@domaine>"`. Vérifier le domaine d'envoi (SPF, DKIM) chez le fournisseur, sinon les liens arrivent en courrier indésirable. Ne jamais définir `MAIL_TRANSPORT` en production.
3. **Google** (facultatif) : dans Google Cloud Console, créer un identifiant OAuth « Application Web ». URI de redirection autorisée : `https://<domaine>/api/auth/callback/google`, plus `http://localhost:3000/api/auth/callback/google` pour le développement. Reporter `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`.
4. **Premier admin** : se connecter une fois, puis `DATABASE_URL=<url directe> pnpm user:role <adresse> --role admin --animator`.

- [ ] **Étape 2 : mettre la spec à jour.** Dans la spec :
- §4.1 : « Auth.js » devient « Better Auth », avec la raison (écart 1) ;
- §5 : `users(... email_verified boolean ...)` et les tables `sessions`, `accounts`, `verifications` gérées par Better Auth ;
- §4.3 : l'attribution des rôles se fait par `pnpm user:role`.

Chaque changement est daté du jour de la tâche et renvoie à ce plan.

- [ ] **Étape 3 : état du plan.** Ajouter en tête de ce plan une section « État des tâches », sur le modèle du plan 1 : pour chaque tâche, la date, ce qui a été vérifié, et les écarts constatés pendant l'exécution.

- [ ] **Étape 4 : commit.**

```bash
git add README.md docs/superpowers
git commit -m "docs(plan-2): accounts deployment, spec updates and task status"
```

---

## Couverture de la spec par ce plan

| Spec | Tâches |
|---|---|
| §4.1 Auth (lien magique, Google), PWA inchangée | 2, 3, 4 |
| §4.2 `lib/auth`, `permissions.ts` seul juge des droits | 3, 6, 7 |
| §4.3 Rôles : visiteur, membre, animateur, modérateur, admin | 3, 5, 6, 7 |
| §4.4 Pages `/playlists`, `/playlists/[id]`, `/clubs`, `/clubs/[slug]`, `/rejoindre/[code]`, `/lecture/[playlistId]/[position]` | 8, 9 |
| §5 `users`, `clubs`, `club_members`, `playlists`, `playlist_items`, contrainte de propriété | 1 |
| §5 Règles : dernier animateur, un seul club par membre | 6, 10 |
| §10 Création, invitation, changement de club, suppression d'un club, droits des playlists, copie, lecteur | 6, 7, 8, 9 |
| §12 Validation des entrées, permissions côté serveur, suppression de compte | 4, 6, 7, 8, 9, 10 |
| §13 Intégration : contrainte de propriété, dernier animateur, matrice des permissions | 1, 3, 6, 7, 10 |
| §13 Bout en bout : parcours (a) et (c) | 12 |

**Hors de ce plan** :

| Sujet de la spec | Plan |
|---|---|
| §8 contributions, §9 signalements, écrans de modération, anonymisation des révisions d'un compte supprimé, §13 parcours (b) | Plan 3 |
| §7 translittération (bouton du lecteur et de la fiche) | Plan 4 |
