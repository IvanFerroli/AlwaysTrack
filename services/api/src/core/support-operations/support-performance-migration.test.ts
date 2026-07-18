import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

const databases: DatabaseSync[] = [];

afterEach(() => {
  databases.splice(0).forEach((database) => database.close());
});

describe("support performance model migration", () => {
  it("moves old CSAT and SLA percentages to legacy keys without converting values", () => {
    const database = new DatabaseSync(":memory:");
    databases.push(database);
    database.exec(`
      CREATE TABLE "SupportKpiEntry" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL,
        "metric" TEXT NOT NULL,
        "value" REAL NOT NULL,
        "numerator" REAL,
        "denominator" REAL,
        "periodStart" DATETIME NOT NULL
      );
      CREATE TABLE "SupportCampaign" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL,
        "metric" TEXT NOT NULL
      );
      INSERT INTO "SupportKpiEntry" VALUES
        ('csat-legacy', 'org-1', 'CSAT', 94.5, 37.8, 40, '2026-07-01T00:00:00.000Z'),
        ('sla-legacy', 'org-1', 'SLA', 92, 46, 50, '2026-07-01T00:00:00.000Z');
      INSERT INTO "SupportCampaign" VALUES
        ('campaign-csat', 'org-1', 'CSAT'),
        ('campaign-sla', 'org-1', 'SLA');
    `);

    const migration = readFileSync(new URL(
      "../../../prisma/migrations/20260718170000_task_at_373_376_support_performance_model/migration.sql",
      import.meta.url
    ), "utf8");
    database.exec(migration);

    const entries = database.prepare(`
      SELECT "metric", "definitionVersion", "unit", "value", "numerator", "denominator"
      FROM "SupportKpiEntry"
      ORDER BY "id"
    `).all();
    const campaigns = database.prepare(`
      SELECT "metric", "definitionVersion", "unit"
      FROM "SupportCampaign"
      ORDER BY "id"
    `).all();

    expect(entries).toEqual([
      { metric: "CSAT_LEGACY_PERCENT", definitionVersion: 1, unit: "PERCENT", value: 94.5, numerator: 37.8, denominator: 40 },
      { metric: "SLA_LEGACY_PERCENT", definitionVersion: 1, unit: "PERCENT", value: 92, numerator: 46, denominator: 50 }
    ]);
    expect(campaigns).toEqual([
      { metric: "CSAT_LEGACY_PERCENT", definitionVersion: 1, unit: "PERCENT" },
      { metric: "SLA_LEGACY_PERCENT", definitionVersion: 1, unit: "PERCENT" }
    ]);
  });
});
