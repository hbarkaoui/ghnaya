// Plan 2, tâche 11 : comptes, clubs et playlists de démonstration (ceux de la maquette) dans la base locale.
// On se connecte ensuite avec leila@example.com, sami@example.com… : le lien est dans la boîte locale.
// Refusé hors de localhost. Idempotent : les comptes et les clubs de démonstration sont recréés.
import "dotenv/config";
import { inArray, or } from "drizzle-orm";
import { db, pool } from "@/lib/db/client";
import { clubMembers, clubs, playlistItems, playlists, reports, songRevisions, users } from "@/lib/db/schema";
import { seedFixtures } from "../tests/fixtures/seed";
import { DEMO_CLUBS, DEMO_MEMBERSHIPS, DEMO_PEOPLE, DEMO_PLAYLISTS } from "./demo/demoData";
import { DEMO_REPORTS } from "./demo/demoReports";
import { demoRevisions } from "./demo/demoRevisions";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) throw new Error("seed-demo : refusé hors de localhost.");

  const songIds = await seedFixtures(db);
  const revisions = await demoRevisions(songIds);

  await db.transaction(async (tx) => {
    await tx.delete(clubs).where(inArray(clubs.slug, DEMO_CLUBS.map((c) => c.slug)));
    const previous = await tx
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.email, DEMO_PEOPLE.map((p) => p.email)));
    if (previous.length > 0) {
      await tx.delete(songRevisions).where(inArray(songRevisions.authorId, previous.map((u) => u.id)));
    }
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
    await tx.delete(users).where(inArray(users.email, DEMO_PEOPLE.map((p) => p.email)));

    const people = new Map<string, string>();
    for (const p of DEMO_PEOPLE) {
      const [row] = await tx
        .insert(users)
        .values({ name: p.name, email: p.email, emailVerified: true, isAnimator: p.isAnimator ?? false, globalRole: p.globalRole ?? "member" })
        .returning({ id: users.id });
      people.set(p.key, row.id);
    }

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

  console.log(`${DEMO_PEOPLE.length} comptes, ${DEMO_CLUBS.length} clubs, ${DEMO_PLAYLISTS.length} playlists, ${revisions.length} propositions et ${DEMO_REPORTS.length} signalements de démonstration.`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
