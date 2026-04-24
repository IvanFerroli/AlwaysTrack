import type { ApproveExecutionInput } from "@olympus/shared-types";

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateExecutionPayload(payload: unknown): payload is ApproveExecutionInput {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return hasValue(candidate.approvalRequestId) && hasValue(candidate.approvedBy);
}

export function validateRejectExecutionPayload(payload: unknown): payload is {
  approvalRequestId: string;
  rejectedBy: string;
  reason: string;
} {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  return hasValue(candidate.approvalRequestId) && hasValue(candidate.rejectedBy) && hasValue(candidate.reason);
}
