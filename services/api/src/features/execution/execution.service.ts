import type {
  ApiResult,
  ApproveExecutionInput,
  ApproveExecutionResult,
  ApplicationRecord,
  ApprovalRequest,
  RejectExecutionInput,
  RejectExecutionResult,
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
    const existingApplication = this.store.findSubmittedApplication(
      approval.jobPostingId,
      approval.resumeProfileId
    );
    if (existingApplication) {
      this.store.rejectRequest(
        approval.id,
        input.approvedBy,
        `Duplicate approval ignored: application ${existingApplication.id} already submitted`
      );
      this.store.createMemoryEntry({
        type: "APPROVAL_RESULT",
        key: `${approval.jobPostingId}:${approval.resumeProfileId}`,
        value: `Approval ${approval.id} auto-rejected: application ${existingApplication.id} already submitted`,
        tags: ["execution", "approval", "rejected", "duplicate"]
      });
      this.store.createDecisionLog(
        agentRun.id,
        "Approval auto-rejected as duplicate",
        `Approval ${approval.id} was auto-rejected because application ${existingApplication.id} already exists`
      );
      this.store.createSkillExecution(
        agentRun.id,
        "application-submit-v1",
        "failure",
        `approval=${approval.id};existingApplication=${existingApplication.id};reason=duplicate`
      );
      this.store.completeAgentRun(agentRun.id, "failed");
      return fail(
        "APPLICATION_ALREADY_SUBMITTED",
        `Application ${existingApplication.id} already exists for approval pair`
      );
    }

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
    this.store.createMemoryEntry({
      type: "APPLICATION_RESULT",
      key: `${application.jobPostingId}:${application.resumeProfileId}`,
      value: `Application ${application.id} submitted after approval ${approved.id}`,
      tags: ["execution", "application", "approved"]
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

  reject(input: RejectExecutionInput): ApiResult<RejectExecutionResult> {
    const approval = this.store.findApprovalRequestById(input.approvalRequestId);
    if (!approval) {
      return fail("APPROVAL_NOT_FOUND", `Approval request ${input.approvalRequestId} not found`);
    }
    if (approval.status !== "pending") {
      return fail("APPROVAL_NOT_PENDING", `Approval request ${approval.id} is already ${approval.status}`);
    }

    const agentRun = this.store.createAgentRun("Execution Agent", "Execution");
    const rejected = this.store.rejectRequest(approval.id, input.rejectedBy, input.reason);
    if (!rejected) {
      this.store.completeAgentRun(agentRun.id, "failed");
      return fail("APPROVAL_TRANSITION_FAILED", `Approval request ${approval.id} could not be rejected`);
    }

    this.store.createMemoryEntry({
      type: "APPROVAL_RESULT",
      key: `${rejected.jobPostingId}:${rejected.resumeProfileId}`,
      value: `Approval ${rejected.id} rejected by ${input.rejectedBy}: ${input.reason}`,
      tags: ["execution", "approval", "rejected"]
    });

    this.store.createDecisionLog(
      agentRun.id,
      "Application rejected",
      `Approval ${rejected.id} was rejected by ${input.rejectedBy} with reason: ${input.reason}`
    );
    this.store.createSkillExecution(
      agentRun.id,
      "application-reject-v1",
      "success",
      `approval=${rejected.id};rejectedBy=${input.rejectedBy}`
    );
    this.store.completeAgentRun(agentRun.id, "completed");

    return ok({
      approvalRequest: rejected
    });
  }

  failValidation(): ApiResult<never> {
    return fail("INVALID_EXECUTION_PAYLOAD", "Payload must include approvalRequestId and approvedBy");
  }

  failRejectValidation(): ApiResult<never> {
    return fail(
      "INVALID_EXECUTION_REJECT_PAYLOAD",
      "Payload must include approvalRequestId, rejectedBy and reason"
    );
  }
}
