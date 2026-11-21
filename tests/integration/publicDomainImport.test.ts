import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { runPublicDomainImport } from "../../scripts/import/runPublicDomainImport";
import { resetDb } from "./helpers";

const FILE = `
- key: chebbi-test
  title_ar: إرادة الحياة
  artists: [{ name_ar: أبو القاسم الشابي, name_latin: Abou el Kacem Chebbi }]
  lyricist: أبو القاسم الشابي
  author_death_year: 1934
  dialect: msa
  lyrics: |
    إذا الشعب يوما أراد الحياة
    فلا بد أن يستجيب القدر
- key: protected-test
  title_ar: أغنية محمية
  artists: [{ name_ar: فنان }]
  lyricist: شاعر
  author_death_year: 1990
  dialect: tn
  lyrics: |
    سطر أول للأغنية المحمية
- key: malouf-test
  title_ar: نوبة تجريبية
  artists: [{ name_ar: مالوف تونسي, name_latin: Malouf Tounsi }]
  lyricist: تراث
  traditional: true
  dialect: tn
  lyrics: |
    سطر أول من النوبة
    سطر ثاني من النوبة
  lyrics_translit: |
    str awel min ennouba
    str thani min ennouba
`;

describe("runPublicDomainImport", () => {
  beforeEach(resetDb);

  it("importe les œuvres libres, refuse les autres, reste idempotent", async () => {
    const files = [{ path: "data/public-domain/test.yaml", content: FILE }];
    const first = await runPublicDomainImport({ db, files, currentYear: 2026, dryRun: false });
    expect(first).toMatchObject({ songs: 3, inserted: 2, updated: 0 });
    expect(first.rejected).toEqual([{ key: "protected-test", reason: "not_public_domain" }]);

    const malouf = await db.execute<{ translit_status: string; source: string; source_ref: string }>(
      sql`SELECT translit_status, source, source_ref FROM songs WHERE source_ref = 'malouf-test'`,
    );
    expect(malouf.rows[0]).toEqual({ translit_status: "reviewed", source: "public_domain", source_ref: "malouf-test" });

    const second = await runPublicDomainImport({ db, files, currentYear: 2026, dryRun: false });
    expect(second).toMatchObject({ inserted: 0, updated: 2 });
  });

  it("dry-run n'écrit rien", async () => {
    const files = [{ path: "x.yaml", content: FILE }];
    const report = await runPublicDomainImport({ db, files, currentYear: 2026, dryRun: true });
    expect(report).toMatchObject({ songs: 3, inserted: 0 });
    const n = await db.execute<{ n: string }>(sql`SELECT count(*) AS n FROM songs`);
    expect(Number(n.rows[0].n)).toBe(0);
  });

  it("interrompt sur un fichier invalide ou une clé en double, en nommant le fichier", async () => {
    await expect(
      runPublicDomainImport({ db, files: [{ path: "bad.yaml", content: "- key: X" }], currentYear: 2026, dryRun: true }),
    ).rejects.toThrow(/bad\.yaml/);
    await expect(
      runPublicDomainImport({
        db,
        currentYear: 2026,
        dryRun: true,
        files: [
          { path: "a.yaml", content: FILE },
          { path: "b.yaml", content: FILE },
        ],
      }),
    ).rejects.toThrow(/chebbi-test/);
  });
});
