import { pathToFileURL } from "node:url";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../config/env.js";
import { parseScopeIds } from "../core/auth/scope.js";
import { prisma } from "../core/db/prisma.js";
import { logEvent } from "../core/diagnostics/logger.js";
import {
  addSupportLocalDays,
  materializeSupportShiftOccurrences,
  supportLocalDateForInstant
} from "../core/support-scheduling/support-scheduling.service.js";

const dayMs = 24 * 60 * 60_000;

export type SupportScheduleHorizonFailureCode =
  | "NO_ACTIVE_ADMIN"
  | "NO_RULE_FOR_HORIZON"
  | "MATERIALIZATION_FAILED"
  | string;

export interface SupportScheduleHorizonFailure {
  organizationId: string;
  teamId: string;
  code: SupportScheduleHorizonFailureCode;
}

export interface SupportScheduleHorizonResult {
  horizonDays: number;
  teams: number;
  succeeded: number;
  failed: number;
  createdCount: number;
  updatedCount: number;
  reusedCount: number;
  preservedCount: number;
  conflictCount: number;
  failures: SupportScheduleHorizonFailure[];
}

function assertHorizonDays(horizonDays: number) {
  if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 61) {
    throw new Error("SUPPORT_SCHEDULE_HORIZON_DAYS must be an integer between 1 and 61.");
  }
}

function currentUser(admin: {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  unitScopeJson: string | null;
  sectorScopeJson: string | null;
}): CurrentUser {
  return {
    id: admin.id,
    organizationId: admin.organizationId,
    name: admin.name,
    email: admin.email,
    role: "ADMIN",
    unitScopeIds: parseScopeIds(admin.unitScopeJson),
    sectorScopeIds: parseScopeIds(admin.sectorScopeJson)
  };
}

function operationalFailureCode(error: unknown): SupportScheduleHorizonFailureCode {
  const code = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(code)
    ? code
    : "MATERIALIZATION_FAILED";
}

function emptyResult(horizonDays: number, teams: number): SupportScheduleHorizonResult {
  return {
    horizonDays,
    teams,
    succeeded: 0,
    failed: 0,
    createdCount: 0,
    updatedCount: 0,
    reusedCount: 0,
    preservedCount: 0,
    conflictCount: 0,
    failures: []
  };
}

export async function runSupportScheduleHorizonWorker(
  database: PrismaClient,
  horizonDays: number,
  now = new Date()
): Promise<SupportScheduleHorizonResult> {
  assertHorizonDays(horizonDays);
  const teams = await database.supportTeam.findMany({
    where: {
      active: true,
      organization: { active: true },
      shiftAssignments: { some: { active: true } }
    },
    select: { id: true, organizationId: true },
    orderBy: [{ organizationId: "asc" }, { id: "asc" }]
  });
  const result = emptyResult(horizonDays, teams.length);
  if (teams.length === 0) return result;

  const organizationIds = [...new Set(teams.map((team) => team.organizationId))];
  const admins = await database.user.findMany({
    where: {
      organizationId: { in: organizationIds },
      role: "ADMIN",
      active: true,
      organization: { active: true }
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      email: true,
      unitScopeJson: true,
      sectorScopeJson: true
    },
    orderBy: [{ organizationId: "asc" }, { createdAt: "asc" }, { id: "asc" }]
  });
  const firstAdminByOrganization = new Map<string, CurrentUser>();
  for (const admin of admins) {
    if (!firstAdminByOrganization.has(admin.organizationId)) {
      firstAdminByOrganization.set(admin.organizationId, currentUser(admin));
    }
  }

  // The timezone is only known after rule lookup, so pad the UTC end for local-date extremes.
  const ruleWindowEnd = new Date(now.getTime() + (horizonDays + 2) * dayMs);
  for (const team of teams) {
    const actor = firstAdminByOrganization.get(team.organizationId);
    if (!actor) {
      result.failures.push({
        organizationId: team.organizationId,
        teamId: team.id,
        code: "NO_ACTIVE_ADMIN"
      });
      continue;
    }

    try {
      const rules = await database.supportScheduleRuleVersion.findMany({
        where: {
          organizationId: team.organizationId,
          teamId: team.id,
          active: true,
          effectiveFrom: { lt: ruleWindowEnd },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }]
        },
        select: {
          timezone: true,
          effectiveFrom: true,
          effectiveTo: true,
          version: true
        },
        orderBy: [{ effectiveFrom: "asc" }, { version: "asc" }]
      });
      const currentRule = rules
        .filter((rule) => rule.effectiveFrom <= now && (!rule.effectiveTo || rule.effectiveTo > now))
        .at(-1);
      const rule = currentRule ?? rules[0];
      if (!rule) {
        result.failures.push({
          organizationId: team.organizationId,
          teamId: team.id,
          code: "NO_RULE_FOR_HORIZON"
        });
        continue;
      }

      const from = supportLocalDateForInstant(now, rule.timezone);
      const to = addSupportLocalDays(from, horizonDays);
      const materialized = await materializeSupportShiftOccurrences(database, actor, {
        teamId: team.id,
        from,
        to
      });
      result.succeeded += 1;
      result.createdCount += materialized.createdCount;
      result.updatedCount += materialized.updatedCount;
      result.reusedCount += materialized.reusedCount;
      result.preservedCount += materialized.preservedCount;
      result.conflictCount += materialized.conflicts.length;
    } catch (error) {
      result.failures.push({
        organizationId: team.organizationId,
        teamId: team.id,
        code: operationalFailureCode(error)
      });
    }
  }

  result.failed = result.failures.length;
  return result;
}

export function supportScheduleHorizonLogMetadata(result: SupportScheduleHorizonResult, durationMs: number) {
  const failureCodes = result.failures.reduce<Record<string, number>>((counts, failure) => {
    counts[failure.code] = (counts[failure.code] ?? 0) + 1;
    return counts;
  }, {});
  return {
    durationMs,
    horizonDays: result.horizonDays,
    teams: result.teams,
    succeeded: result.succeeded,
    failed: result.failed,
    created: result.createdCount,
    updated: result.updatedCount,
    reused: result.reusedCount,
    preserved: result.preservedCount,
    conflicts: result.conflictCount,
    failureCodes
  };
}

async function main() {
  const startedAt = Date.now();
  const env = loadEnv();
  const result = await runSupportScheduleHorizonWorker(
    prisma,
    env.supportScheduleHorizonDays ?? 30,
    new Date(startedAt)
  );
  logEvent(
    result.failed > 0 ? "warn" : "info",
    "support_schedule.horizon.completed",
    supportScheduleHorizonLogMetadata(result, Date.now() - startedAt)
  );
  if (result.failed > 0) process.exitCode = 1;
}

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isMainModule) {
  main()
    .catch(() => {
      logEvent("error", "support_schedule.horizon.failed", { errorCode: "WORKER_FAILED" });
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
