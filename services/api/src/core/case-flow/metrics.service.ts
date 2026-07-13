import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { humanOverrideMetadata, humanOverrideKinds, type CorrectionCause, type HumanOverrideKind } from "./overrides.service.js";

export const caseFlowSloTargetsMs = {
  sidePanelInteractive: 500,
  intakeVisible: 2_000,
  firstPartialSummary: 3_000,
  firstActionableFlow: 5_000,
  slowConnector: 10_000,
  connectorTimeout: 30_000
} as const;
export type CaseFlowSloMilestone = keyof typeof caseFlowSloTargetsMs;

export const caseFlowSuccessCounters = ["clicks", "typedCharacters", "manualTabs", "correctedFlows", "reeditedMessages", "copiedMessages", "draftUses"] as const;
export type CaseFlowSuccessCounter = (typeof caseFlowSuccessCounters)[number];

export interface CaseFlowMetricInput {
  caseId: string;
  milestone?: CaseFlowSloMilestone;
  durationMs?: number;
  counter?: CaseFlowSuccessCounter;
  value?: number;
  connectorId?: string;
  connectorOutcome?: "SUCCESS" | "FAILED" | "CAPTCHA" | "LOGIN" | "SELECTOR_DRIFT" | "CACHE_HIT";
  resolvedWithoutChatGpt?: boolean;
}

export function sanitizeCaseFlowMetric(input: CaseFlowMetricInput) {
  if (!input.caseId.trim()) throw new Error("INVALID_INPUT");
  if (input.milestone !== undefined && !(input.milestone in caseFlowSloTargetsMs)) throw new Error("INVALID_INPUT");
  if (input.counter !== undefined && !(caseFlowSuccessCounters as readonly string[]).includes(input.counter)) throw new Error("INVALID_INPUT");
  if (input.connectorOutcome !== undefined && !["SUCCESS", "FAILED", "CAPTCHA", "LOGIN", "SELECTOR_DRIFT", "CACHE_HIT"].includes(input.connectorOutcome)) throw new Error("INVALID_INPUT");
  const durationMs = input.durationMs === undefined ? undefined : Math.max(0, Math.round(input.durationMs));
  const value = input.value === undefined ? undefined : Math.max(0, Math.round(input.value));
  return {
    milestone: input.milestone,
    durationMs,
    sloMet: input.milestone === undefined || durationMs === undefined ? undefined : durationMs <= caseFlowSloTargetsMs[input.milestone],
    counter: input.counter,
    value,
    connectorId: input.connectorId?.trim() || undefined,
    connectorOutcome: input.connectorOutcome,
    resolvedWithoutChatGpt: input.resolvedWithoutChatGpt
  };
}

export async function recordCaseFlowMetric(prisma: PrismaClient, actor: CurrentUser, input: CaseFlowMetricInput, now = new Date()) {
  const serviceCase = await prisma.serviceCase.findFirst({ where: { id: input.caseId, organizationId: actor.organizationId }, select: { id: true } });
  if (!serviceCase) throw new Error("NOT_FOUND");
  return prisma.auditLog.create({ data: {
    organizationId: actor.organizationId,
    actorId: actor.id,
    action: "case_flow.metric.recorded",
    entityType: "CaseFlowMetric",
    entityId: serviceCase.id,
    metadataJson: JSON.stringify(sanitizeCaseFlowMetric(input)),
    createdAt: now
  } });
}

const terminalSuccess = new Set(["COMPLETE", "PARTIAL", "NOT_APPLICABLE", "NOT_FOUND"]);
const percentile = (values: number[], ratio: number) => values.length ? values[Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1)] : null;
const metadata = (value: string | null) => { try { return JSON.parse(value ?? "{}") as Record<string, unknown>; } catch { return {}; } };

export async function getConnectorHealthMetrics(prisma: PrismaClient, actor: CurrentUser, now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const definitions = await prisma.connectorDefinition.findMany({ where: { organizationId: actor.organizationId, enabled: true }, orderBy: { displayName: "asc" } });
  const [runs, events] = await Promise.all([
    prisma.connectorRun.findMany({ where: { organizationId: actor.organizationId, startedAt: { gte: since } }, orderBy: { startedAt: "desc" } }),
    prisma.connectorHealthEvent.findMany({ where: { organizationId: actor.organizationId }, orderBy: { checkedAt: "desc" } })
  ]);
  return definitions.map((definition) => {
    const ownRuns = runs.filter((run) => run.connectorDefinitionId === definition.id);
    const durations = ownRuns.flatMap((run) => run.finishedAt ? [run.finishedAt.getTime() - run.startedAt.getTime()] : []).sort((a, b) => a - b);
    const ownEvents = events.filter((event) => event.connectorDefinitionId === definition.id);
    const latest = ownEvents[0];
    const lastCode = (code: string) => ownEvents.find((event) => event.eventCode === code)?.checkedAt.toISOString() ?? null;
    return {
      connectorDefinitionId: definition.id,
      connectorId: definition.connectorId,
      displayName: definition.displayName,
      state: latest?.state ?? "UNKNOWN",
      lastRunAt: ownRuns[0]?.startedAt.toISOString() ?? null,
      successRate24h: ownRuns.length ? ownRuns.filter((run) => terminalSuccess.has(run.status)).length / ownRuns.length : null,
      medianMs: percentile(durations, 0.5), p95Ms: percentile(durations, 0.95),
      version: definition.version,
      lastSelectorDriftAt: lastCode("SELECTOR_DRIFT"),
      lastLoginAt: lastCode("LOGIN"),
      lastCaptchaAt: lastCode("CAPTCHA")
    };
  });
}

export async function getCaseFlowSuccessMetrics(prisma: PrismaClient, actor: CurrentUser, now = new Date()) {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
  const events = await prisma.auditLog.findMany({ where: { organizationId: actor.organizationId, entityType: "CaseFlowMetric", createdAt: { gte: since } }, orderBy: { createdAt: "asc" } });
  const rows = events.map((event) => metadata(event.metadataJson));
  const sum = (counter: CaseFlowSuccessCounter) => rows.filter((row) => row.counter === counter).reduce((total, row) => total + (typeof row.value === "number" ? row.value : 0), 0);
  const cases = new Set(events.map((event) => event.entityId));
  const ready = rows.filter((row) => row.milestone === "firstActionableFlow" && typeof row.durationMs === "number").map((row) => row.durationMs as number).sort((a, b) => a - b);
  const connectorRows = rows.filter((row) => typeof row.connectorId === "string");
  const connectors = [...new Set(connectorRows.map((row) => row.connectorId as string))].map((connectorId) => {
    const own = connectorRows.filter((row) => row.connectorId === connectorId);
    return { connectorId, total: own.length, successRate: own.length ? own.filter((row) => row.connectorOutcome === "SUCCESS").length / own.length : 0 };
  });
  const typed = sum("typedCharacters");
  const copied = sum("copiedMessages") + sum("draftUses");
  return {
    windowHours: 24, dailyCases: cases.size, medianReadyMs: percentile(ready, 0.5), clicks: sum("clicks"), typedCharacters: typed,
    manualTabs: sum("manualTabs"), correctedFlows: sum("correctedFlows"), reeditedMessages: sum("reeditedMessages"),
    copiedMessages: sum("copiedMessages"), draftUses: sum("draftUses"),
    resolvedWithoutChatGpt: new Set(events.filter((event, index) => rows[index]?.resolvedWithoutChatGpt === true).map((event) => event.entityId)).size,
    estimatedTypingAvoided: copied * 120, estimatedMinutesSaved: Math.round((copied * 45 + Math.max(0, cases.size * 80 - typed / 4)) / 60), connectors
  };
}

export interface HumanOverrideMetrics {
  total: number;
  active: number;
  undone: number;
  byKind: Record<HumanOverrideKind, number>;
  byCause: Record<CorrectionCause, number>;
}

export async function getHumanOverrideMetrics(prisma: PrismaClient, actor: CurrentUser): Promise<HumanOverrideMetrics> {
  const events = await prisma.auditLog.findMany({ where: { organizationId: actor.organizationId, entityType: "CaseFlowHumanOverride" }, orderBy: { createdAt: "asc" } });
  const created = events.filter((event) => event.action.endsWith(".created"));
  const undoneIds = new Set(events.filter((event) => event.action === "case_flow.override.undone").map((event) => String(humanOverrideMetadata(event.metadataJson).targetOverrideId ?? "")));
  const byKind = Object.fromEntries(humanOverrideKinds.map((kind) => [kind, 0])) as Record<HumanOverrideKind, number>;
  const byCause: Record<CorrectionCause, number> = { CONNECTOR_GAP: 0, RULE_ERROR: 0, HUMAN_DECISION: 0 };
  for (const event of created) {
    const metadata = humanOverrideMetadata(event.metadataJson);
    if (humanOverrideKinds.includes(metadata.kind as HumanOverrideKind)) byKind[metadata.kind as HumanOverrideKind] += 1;
    if (typeof metadata.cause === "string" && metadata.cause in byCause) byCause[metadata.cause as CorrectionCause] += 1;
  }
  return { total: created.length, active: created.filter((event) => !undoneIds.has(event.entityId)).length, undone: undoneIds.size, byKind, byCause };
}
