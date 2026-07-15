import { createHash } from "node:crypto";
import type { CurrentUser } from "@alwaystrack/shared";
import type { PrismaClient } from "@prisma/client";
import { recordAuditLog } from "../audit/audit.service.js";

const DEFAULT_CONVERSATION_DAYS = 30;
const DEFAULT_DIAGNOSTIC_DAYS = 7;
const DEFAULT_CACHE_MINUTES = 15;
const MAX_ERROR_CODE_LENGTH = 80;
const RETENTION_PURGED_VALUE = JSON.stringify("[retention-purged]");
const SAFE_EVENT_VALUE = /^[A-Za-z][A-Za-z0-9_.:-]*$/;
const SAFE_VERSION = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;

export interface CaseFlowRetentionPolicy {
  conversationDays: number;
  diagnosticDays: number;
  cacheMinutes: number;
  screenshotsEnabled: boolean;
}

export interface CaseFlowAuditEvent {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: "ServiceCase" | "ConnectorRun" | "EvidenceConflict" | "CompanionInstallation" | "PrivacyLifecycle" | "PrivacyDeletionRequest";
  entityId: string;
  status?: string;
  durationMs?: number;
  connectorId?: string;
  errorCode?: string;
  version?: string;
  reference?: string;
}

export type CaseFlowRetentionPurgeTarget = "conversationFacts" | "connectorRuns" | "healthEvents";

export interface CaseFlowRetentionPurgeResult {
  cutoffs: { conversation: Date; diagnostics: Date };
  dryRun: boolean;
  conversationFacts: number;
  connectorRuns: number;
  healthEvents: number;
  failures: Array<{ target: CaseFlowRetentionPurgeTarget; code: "PURGE_TARGET_FAILED" }>;
}

export interface PrivacyAuditEvent {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: "PrivacyLifecycle" | "PrivacyDeletionRequest";
  entityId: string;
  status: "started" | "completed" | "failed" | "denied" | "not_found" | "dry_run";
  dryRun: boolean;
  target?: CaseFlowRetentionPurgeTarget | "serviceCase";
  affectedRows?: number;
  failureCode?: "PURGE_TARGET_FAILED" | "DELETE_FAILED" | "FORBIDDEN";
  requestHash?: string;
}

export class PrivacyAuthorizationError extends Error {
  readonly code = "FORBIDDEN";

  constructor() {
    super("The authenticated actor is not authorized to delete this data.");
    this.name = "PrivacyAuthorizationError";
  }
}

type RetentionEnvironment = Partial<Record<
  | "CASE_FLOW_CONVERSATION_RETENTION_DAYS"
  | "CASE_FLOW_DIAGNOSTIC_RETENTION_DAYS"
  | "CASE_FLOW_CACHE_RETENTION_MINUTES"
  | "CASE_FLOW_SCREENSHOTS_ENABLED",
  string | undefined
>>;

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function safeEventValue(value: string | undefined, pattern = SAFE_EVENT_VALUE): string | undefined {
  const normalized = value?.trim();
  if (!normalized || !pattern.test(normalized)) return undefined;
  return normalized.slice(0, MAX_ERROR_CODE_LENGTH);
}

export function hashAuditIdentifier(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function maskAuditIdentifier(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "[redacted]";
  if (normalized.length < 5) return `${normalized[0]}***`;
  return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`;
}

export function caseFlowRetentionPolicy(source: RetentionEnvironment = process.env): CaseFlowRetentionPolicy {
  return {
    conversationDays: positiveInteger(source.CASE_FLOW_CONVERSATION_RETENTION_DAYS, DEFAULT_CONVERSATION_DAYS),
    diagnosticDays: positiveInteger(source.CASE_FLOW_DIAGNOSTIC_RETENTION_DAYS, DEFAULT_DIAGNOSTIC_DAYS),
    cacheMinutes: positiveInteger(source.CASE_FLOW_CACHE_RETENTION_MINUTES, DEFAULT_CACHE_MINUTES),
    screenshotsEnabled: source.CASE_FLOW_SCREENSHOTS_ENABLED === "true"
  };
}

export function caseFlowRetentionCutoffs(policy: CaseFlowRetentionPolicy, now = new Date()) {
  return {
    conversation: new Date(now.getTime() - policy.conversationDays * 86_400_000),
    diagnostics: new Date(now.getTime() - policy.diagnosticDays * 86_400_000),
    cache: new Date(now.getTime() - policy.cacheMinutes * 60_000)
  };
}

export async function recordCaseFlowAuditEvent(prisma: PrismaClient, event: CaseFlowAuditEvent) {
  const reference = event.reference?.trim();
  const metadata = {
    status: safeEventValue(event.status),
    durationMs: Number.isSafeInteger(event.durationMs) && (event.durationMs ?? -1) >= 0 ? event.durationMs : undefined,
    connectorId: safeEventValue(event.connectorId),
    errorCode: safeEventValue(event.errorCode),
    version: safeEventValue(event.version, SAFE_VERSION),
    referenceHash: reference ? hashAuditIdentifier(reference) : undefined,
    referenceMasked: reference ? maskAuditIdentifier(reference) : undefined
  };

  return recordAuditLog(prisma, {
    organizationId: event.organizationId,
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined))
  });
}

export function recordPrivacyAuditEvent(prisma: PrismaClient, event: PrivacyAuditEvent) {
  return recordAuditLog(prisma, {
    organizationId: event.organizationId,
    actorId: event.actorId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    metadata: {
      status: event.status,
      dryRun: event.dryRun,
      target: event.target,
      affectedRows: event.affectedRows,
      failureCode: event.failureCode,
      requestHash: event.requestHash
    }
  });
}

export async function purgeExpiredCaseFlowData(
  prisma: PrismaClient,
  scope: { organizationId: string },
  options: { policy?: CaseFlowRetentionPolicy; now?: Date; dryRun?: boolean } = {}
): Promise<CaseFlowRetentionPurgeResult> {
  const allCutoffs = caseFlowRetentionCutoffs(options.policy ?? caseFlowRetentionPolicy(), options.now);
  const cutoffs = { conversation: allCutoffs.conversation, diagnostics: allCutoffs.diagnostics };
  const dryRun = options.dryRun ?? true;
  const result: CaseFlowRetentionPurgeResult = {
    cutoffs, dryRun, conversationFacts: 0, connectorRuns: 0, healthEvents: 0, failures: []
  };
  const targets: Array<{
    name: CaseFlowRetentionPurgeTarget;
    count: () => Promise<number>;
    purge: () => Promise<number>;
  }> = [
    {
      name: "conversationFacts",
      count: () => prisma.evidenceFact.count({
        where: {
          organizationId: scope.organizationId,
          collectedAt: { lt: cutoffs.conversation },
          key: { startsWith: "conversation." },
          valueJson: { not: RETENTION_PURGED_VALUE }
        }
      }),
      purge: async () => (await prisma.evidenceFact.updateMany({
        where: {
          organizationId: scope.organizationId,
          collectedAt: { lt: cutoffs.conversation },
          key: { startsWith: "conversation." },
          valueJson: { not: RETENTION_PURGED_VALUE }
        },
        data: { valueJson: RETENTION_PURGED_VALUE, normalizedValueJson: RETENTION_PURGED_VALUE }
      })).count
    },
    {
      name: "connectorRuns",
      count: () => prisma.connectorRun.count({
        where: { organizationId: scope.organizationId, finishedAt: { lt: cutoffs.diagnostics }, diagnosticsJson: { not: null } }
      }),
      purge: async () => (await prisma.connectorRun.updateMany({
        where: { organizationId: scope.organizationId, finishedAt: { lt: cutoffs.diagnostics }, diagnosticsJson: { not: null } },
        data: { diagnosticsJson: null }
      })).count
    },
    {
      name: "healthEvents",
      count: () => prisma.connectorHealthEvent.count({
        where: { organizationId: scope.organizationId, checkedAt: { lt: cutoffs.diagnostics }, diagnosticsJson: { not: null } }
      }),
      purge: async () => (await prisma.connectorHealthEvent.updateMany({
        where: { organizationId: scope.organizationId, checkedAt: { lt: cutoffs.diagnostics }, diagnosticsJson: { not: null } },
        data: { diagnosticsJson: null }
      })).count
    }
  ];

  for (const target of targets) {
    try {
      result[target.name] = dryRun ? await target.count() : await target.purge();
    } catch {
      result.failures.push({ target: target.name, code: "PURGE_TARGET_FAILED" });
    }
  }
  return result;
}

export async function deleteServiceCaseData(
  prisma: PrismaClient,
  actor: CurrentUser,
  caseId: string,
  options: { dryRun?: boolean; authorization?: { requestId: string; approvedById: string } } = {}
) {
  const dryRun = options.dryRun ?? true;
  const entityId = hashAuditIdentifier(caseId);
  const requestId = options.authorization?.requestId.trim();
  const requestHash = requestId ? hashAuditIdentifier(requestId) : undefined;
  if (actor.role !== "ADMIN") {
    await recordPrivacyAuditEvent(prisma, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "privacy.deletion.denied",
      entityType: "PrivacyDeletionRequest",
      entityId,
      requestHash,
      status: "denied",
      dryRun,
      target: "serviceCase",
      failureCode: "FORBIDDEN"
    });
    throw new PrivacyAuthorizationError();
  }

  if (!dryRun) {
    const authorization = options.authorization;
    const approver = authorization?.requestId.trim() && authorization.approvedById !== actor.id
      ? await prisma.user.findFirst({
          where: {
            id: authorization.approvedById,
            organizationId: actor.organizationId,
            role: "ADMIN",
            active: true
          },
          select: { id: true }
        })
      : null;
    if (!approver) {
      await recordPrivacyAuditEvent(prisma, {
        organizationId: actor.organizationId,
        actorId: actor.id,
        action: "privacy.deletion.denied",
        entityType: "PrivacyDeletionRequest",
        entityId,
        requestHash,
        status: "denied",
        dryRun,
        target: "serviceCase",
        failureCode: "FORBIDDEN"
      });
      throw new PrivacyAuthorizationError();
    }
  }

  const serviceCase = await prisma.serviceCase.findFirst({
    where: { id: caseId, organizationId: actor.organizationId },
    select: { id: true }
  });
  if (!serviceCase) {
    await recordPrivacyAuditEvent(prisma, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "privacy.deletion.completed",
      entityType: "PrivacyDeletionRequest",
      entityId,
      requestHash,
      status: "not_found",
      dryRun,
      target: "serviceCase",
      affectedRows: 0
    });
    return { status: "not_found" as const, dryRun, deleted: false };
  }

  await recordPrivacyAuditEvent(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "privacy.deletion.started",
    entityType: "PrivacyDeletionRequest",
    entityId,
    requestHash,
    status: "started",
    dryRun,
    target: "serviceCase"
  });

  if (dryRun) {
    await recordPrivacyAuditEvent(prisma, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "privacy.deletion.completed",
      entityType: "PrivacyDeletionRequest",
      entityId,
      requestHash,
      status: "dry_run",
      dryRun,
      target: "serviceCase",
      affectedRows: 1
    });
    return { status: "dry_run" as const, dryRun, deleted: false };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const where = { caseId: serviceCase.id, organizationId: actor.organizationId };
      await transaction.evidenceConflict.deleteMany({ where });
      await transaction.evidenceFact.deleteMany({ where });
      await transaction.connectorRun.deleteMany({ where });
      await transaction.serviceCase.updateMany({
        where: { id: serviceCase.id, organizationId: actor.organizationId },
        data: { primarySourceId: null }
      });
      await transaction.serviceCaseSource.deleteMany({ where });
      await transaction.serviceCase.deleteMany({ where: { id: serviceCase.id, organizationId: actor.organizationId } });
    });
  } catch (error) {
    await recordPrivacyAuditEvent(prisma, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "privacy.deletion.failed",
      entityType: "PrivacyDeletionRequest",
      entityId,
      requestHash,
      status: "failed",
      dryRun,
      target: "serviceCase",
      failureCode: "DELETE_FAILED"
    });
    throw error;
  }

  await recordPrivacyAuditEvent(prisma, {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "privacy.deletion.completed",
    entityType: "PrivacyDeletionRequest",
    entityId,
    requestHash,
    status: "completed",
    dryRun,
    target: "serviceCase",
    affectedRows: 1
  });
  return { status: "completed" as const, dryRun, deleted: true };
}
