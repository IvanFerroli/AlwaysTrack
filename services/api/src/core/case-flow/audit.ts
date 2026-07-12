import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { recordAuditLog } from "../audit/audit.service.js";

const DEFAULT_CONVERSATION_DAYS = 30;
const DEFAULT_DIAGNOSTIC_DAYS = 7;
const DEFAULT_CACHE_MINUTES = 15;
const MAX_ERROR_CODE_LENGTH = 80;
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
  entityType: "ServiceCase" | "ConnectorRun" | "EvidenceConflict" | "CompanionInstallation";
  entityId: string;
  status?: string;
  durationMs?: number;
  connectorId?: string;
  errorCode?: string;
  version?: string;
  reference?: string;
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

export async function purgeExpiredCaseFlowDiagnostics(
  prisma: PrismaClient,
  scope: { organizationId: string },
  options: { policy?: CaseFlowRetentionPolicy; now?: Date } = {}
) {
  const cutoff = caseFlowRetentionCutoffs(options.policy ?? caseFlowRetentionPolicy(), options.now).diagnostics;
  const [connectorRuns, healthEvents] = await prisma.$transaction([
    prisma.connectorRun.updateMany({
      where: { organizationId: scope.organizationId, finishedAt: { lt: cutoff }, diagnosticsJson: { not: null } },
      data: { diagnosticsJson: null }
    }),
    prisma.connectorHealthEvent.updateMany({
      where: { organizationId: scope.organizationId, checkedAt: { lt: cutoff }, diagnosticsJson: { not: null } },
      data: { diagnosticsJson: null }
    })
  ]);
  return { cutoff, connectorRuns: connectorRuns.count, healthEvents: healthEvents.count };
}

export async function deleteServiceCaseData(prisma: PrismaClient, scope: { organizationId: string }, caseId: string) {
  const serviceCase = await prisma.serviceCase.findFirst({
    where: { id: caseId, organizationId: scope.organizationId },
    select: { id: true }
  });
  if (!serviceCase) return false;

  await prisma.$transaction(async (transaction) => {
    await transaction.evidenceConflict.deleteMany({ where: { caseId: serviceCase.id, organizationId: scope.organizationId } });
    await transaction.evidenceFact.deleteMany({ where: { caseId: serviceCase.id, organizationId: scope.organizationId } });
    await transaction.connectorRun.deleteMany({ where: { caseId: serviceCase.id, organizationId: scope.organizationId } });
    await transaction.serviceCaseSource.deleteMany({ where: { caseId: serviceCase.id, organizationId: scope.organizationId } });
    await transaction.serviceCase.deleteMany({ where: { id: serviceCase.id, organizationId: scope.organizationId } });
  });
  return true;
}
