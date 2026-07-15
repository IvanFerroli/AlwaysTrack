import type { PrismaClient } from "@prisma/client";
import {
  hashAuditIdentifier,
  purgeExpiredCaseFlowData,
  recordPrivacyAuditEvent,
  type CaseFlowRetentionPolicy
} from "../case-flow/audit.js";
import { enqueueJob, getQueueJobStatus } from "./queue.js";

export const privacyLifecycleQueueName = "privacy-lifecycle";
export const privacyLifecycleJobName = "privacy-lifecycle.purge-expired";

export interface PrivacyLifecycleJobData {
  organizationId: string;
  dryRun: boolean;
  scheduledFor: string;
  policy?: CaseFlowRetentionPolicy;
}

export class PrivacyLifecyclePartialFailureError extends Error {
  readonly code = "PRIVACY_LIFECYCLE_PARTIAL_FAILURE";

  constructor() {
    super("One or more privacy lifecycle targets failed; retry with the same job data.");
    this.name = "PrivacyLifecyclePartialFailureError";
  }
}

function scheduledWindow(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("scheduledFor must be a valid ISO date.");
  return date.toISOString().slice(0, 10);
}

export function privacyLifecycleDedupeKey(data: PrivacyLifecycleJobData) {
  const mode = data.dryRun ? "dry-run" : "execute";
  return `${privacyLifecycleJobName}:${data.organizationId}:${scheduledWindow(data.scheduledFor)}:${mode}`;
}

export async function processPrivacyLifecycleJob(prisma: PrismaClient, data: PrivacyLifecycleJobData) {
  const dedupeKey = privacyLifecycleDedupeKey(data);
  const entityId = hashAuditIdentifier(dedupeKey);
  const auditBase = {
    organizationId: data.organizationId,
    actorId: null,
    entityType: "PrivacyLifecycle" as const,
    entityId,
    dryRun: data.dryRun
  };

  // A durable start marker is written before mutation so failed or interrupted runs remain reconcilable.
  await recordPrivacyAuditEvent(prisma, {
    ...auditBase,
    action: "privacy.lifecycle.started",
    status: "started"
  });

  const result = await purgeExpiredCaseFlowData(
    prisma,
    { organizationId: data.organizationId },
    { policy: data.policy, now: new Date(data.scheduledFor), dryRun: data.dryRun }
  );

  for (const target of ["conversationFacts", "connectorRuns", "healthEvents"] as const) {
    const failure = result.failures.find((item) => item.target === target);
    await recordPrivacyAuditEvent(prisma, {
      ...auditBase,
      action: failure ? "privacy.lifecycle.target_failed" : "privacy.lifecycle.target_completed",
      status: failure ? "failed" : data.dryRun ? "dry_run" : "completed",
      target,
      affectedRows: result[target],
      failureCode: failure?.code
    });
  }

  await recordPrivacyAuditEvent(prisma, {
    ...auditBase,
    action: result.failures.length > 0 ? "privacy.lifecycle.failed" : "privacy.lifecycle.completed",
    status: result.failures.length > 0 ? "failed" : data.dryRun ? "dry_run" : "completed"
  });

  if (result.failures.length > 0) throw new PrivacyLifecyclePartialFailureError();
  return result;
}

export function enqueuePrivacyLifecycleJob(
  prisma: PrismaClient,
  data: PrivacyLifecycleJobData,
  authorization: { confirmation?: string } = {}
) {
  if (!data.dryRun && authorization.confirmation !== `${data.organizationId}:PURGE_EXPIRED_DIAGNOSTICS`) {
    throw new Error("Execute mode requires tenant-bound privacy lifecycle confirmation.");
  }
  return enqueueJob({
    queueName: privacyLifecycleQueueName,
    jobName: privacyLifecycleJobName,
    dedupeKey: privacyLifecycleDedupeKey(data),
    data,
    processor: (payload) => processPrivacyLifecycleJob(prisma, payload)
  });
}

export function getPrivacyLifecycleJobStatus(data: PrivacyLifecycleJobData) {
  return getQueueJobStatus(privacyLifecycleQueueName, privacyLifecycleJobName, privacyLifecycleDedupeKey(data));
}
