import type {
  ApiResult,
  ApproveExecutionInput,
  ApproveExecutionResult,
  ApplicationRecord,
  ApprovalRequest,
  ListPayload
} from "@olympus/shared-types";
import { InMemoryStateStore } from "../../domain/state/store.js";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export class ExecutionService {
  constructor(private readonly store: InMemoryStateStore) {}

  listApprovalQueue(): ApiResult<ListPayload<ApprovalRequest>> {
    const pending = this.store.listApprovalRequests().filter((item) => item.status === "pending");
    return ok({ items: pending });
  }

  listApplications(): ApiResult<ListPayload<ApplicationRecord>> {
    return ok({ items: this.store.listApplications() });
  }

  approve(input: ApproveExecutionInput): ApiResult<ApproveExecutionResult> {
    const approval = this.store.findApprovalRequestById(input.approvalRequestId);
    if (!approval) {
      return fail("APPROVAL_NOT_FOUND", `Approval request ${input.approvalRequestId} not found`);
    }
    if (approval.status !== "pending") {
      return fail("APPROVAL_NOT_PENDING", `Approval request ${approval.id} is already ${approval.status}`);
    }

    const agentRun = this.store.createAgentRun("Execution Agent", "Execution");
    const approved = this.store.approveRequest(approval.id, input.approvedBy);
    if (!approved) {
      this.store.completeAgentRun(agentRun.id, "failed");
      return fail("APPROVAL_TRANSITION_FAILED", `Approval request ${approval.id} could not be approved`);
    }

    const application = this.store.createApplication({
      jobPostingId: approved.jobPostingId,
      resumeProfileId: approved.resumeProfileId,
      approvalRequestId: approved.id,
      evidence: `Application submitted by Execution Agent with human approval from ${input.approvedBy}`
    });

    this.store.createDecisionLog(
      agentRun.id,
      "Application submitted",
      `Approval ${approved.id} was accepted by ${input.approvedBy} and produced application ${application.id}`
    );
    this.store.createSkillExecution(
      agentRun.id,
      "application-submit-v1",
      "success",
      `approval=${approved.id};application=${application.id}`
    );
    this.store.completeAgentRun(agentRun.id, "completed");

    return ok({
      approvalRequest: approved,
      application
    });
  }

  failValidation(): ApiResult<never> {
    return fail("INVALID_EXECUTION_PAYLOAD", "Payload must include approvalRequestId and approvedBy");
  }
}
