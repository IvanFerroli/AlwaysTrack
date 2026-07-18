import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

const databases: DatabaseSync[] = [];

afterEach(() => {
  databases.splice(0).forEach((database) => database.close());
});

describe("support performance integrity migration", () => {
  it("makes values nullable and backfills explicit competence metadata", () => {
    const database = new DatabaseSync(":memory:");
    databases.push(database);
    database.exec(`
      CREATE TABLE "SupportKpiEntry" (
        "id" TEXT PRIMARY KEY, "organizationId" TEXT NOT NULL, "metric" TEXT NOT NULL,
        "definitionVersion" INTEGER NOT NULL, "unit" TEXT NOT NULL, "value" REAL NOT NULL,
        "numerator" REAL, "denominator" REAL, "channel" TEXT, "granularity" TEXT NOT NULL,
        "observationType" TEXT NOT NULL, "rawValue" TEXT, "dataState" TEXT NOT NULL,
        "scopeType" TEXT NOT NULL, "userId" TEXT, "teamLabel" TEXT, "teamId" TEXT,
        "periodStart" DATETIME NOT NULL, "periodEnd" DATETIME NOT NULL, "source" TEXT, "note" TEXT,
        "createdById" TEXT NOT NULL, "updatedById" TEXT NOT NULL, "status" TEXT NOT NULL,
        "revision" INTEGER NOT NULL, "supersedesId" TEXT, "submittedAt" DATETIME,
        "reviewedAt" DATETIME, "reviewedById" TEXT, "reviewNote" TEXT, "archivedAt" DATETIME,
        "createdAt" DATETIME NOT NULL, "updatedAt" DATETIME NOT NULL
      );
      INSERT INTO "SupportKpiEntry" (
        "id", "organizationId", "metric", "definitionVersion", "unit", "value", "granularity",
        "observationType", "rawValue", "dataState", "scopeType", "periodStart", "periodEnd", "source",
        "createdById", "updatedById", "status", "revision", "createdAt", "updatedAt"
      ) VALUES
      (
        'kpi-text', 'org-1', 'CSAT_SCORE', 2, 'SCORE_1_5', 4.4, 'REPORTED_INTERVAL',
        'ACTUAL', '4,4', 'AVAILABLE', 'ORGANIZATION', '2026-07-01T03:00:00.000Z',
        '2026-07-07T02:59:59.999Z', 'planilha', 'admin-1', 'admin-1', 'APPROVED', 1,
        '2026-07-07T03:00:00.000Z', '2026-07-07T03:00:00.000Z'
      ),
      (
        'kpi-epoch', 'org-1', 'SLA_DURATION', 2, 'DURATION_SECONDS', 778, 'REPORTED_INTERVAL',
        'ACTUAL', '12min58s', 'AVAILABLE', 'ORGANIZATION', unixepoch('2026-07-01T03:00:00') * 1000,
        unixepoch('2026-07-07T02:59:59') * 1000, 'planilha', 'admin-1', 'admin-1', 'APPROVED', 1,
        unixepoch('2026-07-07T03:00:00') * 1000, unixepoch('2026-07-07T03:00:00') * 1000
      );
    `);

    const migration = readFileSync(new URL(
      "../../../prisma/migrations/20260718180000_task_at_373_376_support_performance_integrity/migration.sql",
      import.meta.url
    ), "utf8");
    database.exec(migration);

    const migrated = database.prepare(`
      SELECT "value", "dataStateVersion", "timezone", "referenceYear", "membershipId", "externalReference"
      FROM "SupportKpiEntry" ORDER BY "id"
    `).all();
    const valueColumn = database.prepare("PRAGMA table_info('SupportKpiEntry')").all()
      .find((column) => column.name === "value");

    expect(migrated).toEqual([
      {
        value: 778,
        dataStateVersion: 1,
        timezone: "America/Sao_Paulo",
        referenceYear: 2026,
        membershipId: null,
        externalReference: null
      },
      {
        value: 4.4,
        dataStateVersion: 1,
        timezone: "America/Sao_Paulo",
        referenceYear: 2026,
        membershipId: null,
        externalReference: null
      }
    ]);
    expect(valueColumn).toMatchObject({ notnull: 0 });
  });
});
