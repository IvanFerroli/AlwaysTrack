import type {
  ApiResult,
  ApproveExecutionInput,
  ApproveExecutionResult,
  ApplicationRecord,
  ApprovalRequest,
  RejectExecutionInput,
  RejectExecutionResult,
  UpdateApplicationStatusInput,
  UpdateApplicationStatusResult,
  ListPayload
} from "@olympus/shared-types";
import type { StateStore } from "../../domain/state/store.js";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export class ExecutionService {
  constructor(private readonly store: StateStore) {}

  async listApprovalQueue(): Promise<ApiResult<ListPayload<ApprovalRequest>>> {
    const pending = (await this.store.listApprovalRequests()).filter((item) => item.status === "pending");
    return ok({ items: pending });
  }

  async listApplications(): Promise<ApiResult<ListPayload<ApplicationRecord>>> {
    return ok({ items: await this.store.listApplications() });
  }

  async approve(input: ApproveExecutionInput): Promise<ApiResult<ApproveExecutionResult>> {
    const approval = await this.store.findApprovalRequestById(input.approvalRequestId);
    if (!approval) {
      return fail("APPROVAL_NOT_FOUND", `Approval request ${input.approvalRequestId} not found`);
    }
    if (approval.status !== "pending") {
      return fail("APPROVAL_NOT_PENDING", `Approval request ${approval.id} is already ${approval.status}`);
    }

    const agentRun = await this.store.createAgentRun("Execution Agent", "Execution");
    const existingApplication = await this.store.findSubmittedApplication(
      approval.jobPostingId,
      approval.resumeProfileId
    );
    if (existingApplication) {
      await this.store.rejectRequest(
        approval.id,
        input.approvedBy,
        `Duplicate approval ignored: application ${existingApplication.id} already submitted`
      );
      await this.store.createMemoryEntry({
        type: "APPROVAL_RESULT",
        key: `${approval.jobPostingId}:${approval.resumeProfileId}`,
        value: `Approval ${approval.id} auto-rejected: application ${existingApplication.id} already submitted`,
        tags: ["execution", "approval", "rejected", "duplicate"]
      });
      await this.store.createDecisionLog(
        agentRun.id,
        "Approval auto-rejected as duplicate",
        `Approval ${approval.id} was auto-rejected because application ${existingApplication.id} already exists`
      );
      await this.store.createSkillExecution(
        agentRun.id,
        "application-submit-v1",
        "failure",
        `approval=${approval.id};existingApplication=${existingApplication.id};reason=duplicate`
      );
      await this.store.completeAgentRun(agentRun.id, "failed");
      return fail(
        "APPLICATION_ALREADY_SUBMITTED",
        `Application ${existingApplication.id} already exists for approval pair`
      );
    }

    const approved = await this.store.approveRequest(approval.id, input.approvedBy);
    if (!approved) {
      await this.store.completeAgentRun(agentRun.id, "failed");
      return fail("APPROVAL_TRANSITION_FAILED", `Approval request ${approval.id} could not be approved`);
    }

    const application = await this.store.createApplication({
      jobPostingId: approved.jobPostingId,
      resumeProfileId: approved.resumeProfileId,
      approvalRequestId: approved.id,
      evidence: `Application submitted by Execution Agent with human approval from ${input.approvedBy}`
    });
    await this.store.createMemoryEntry({
      type: "APPLICATION_RESULT",
      key: `${application.jobPostingId}:${application.resumeProfileId}`,
      value: `Application ${application.id} submitted after approval ${approved.id}`,
      tags: ["execution", "application", "approved"]
    });

    await this.store.createDecisionLog(
      agentRun.id,
      "Application submitted",
      `Approval ${approved.id} was accepted by ${input.approvedBy} and produced application ${application.id}`
    );
    await this.store.createSkillExecution(
      agentRun.id,
      "application-submit-v1",
      "success",
      `approval=${approved.id};application=${application.id}`
    );
    await this.store.completeAgentRun(agentRun.id, "completed");

    return ok({
      approvalRequest: approved,
      application
    });
  }

  async reject(input: RejectExecutionInput): Promise<ApiResult<RejectExecutionResult>> {
    const approval = await this.store.findApprovalRequestById(input.approvalRequestId);
    if (!approval) {
      return fail("APPROVAL_NOT_FOUND", `Approval request ${input.approvalRequestId} not found`);
    }
    if (approval.status !== "pending") {
      return fail("APPROVAL_NOT_PENDING", `Approval request ${approval.id} is already ${approval.status}`);
    }

    const agentRun = await this.store.createAgentRun("Execution Agent", "Execution");
    const rejected = await this.store.rejectRequest(approval.id, input.rejectedBy, input.reason);
    if (!rejected) {
      await this.store.completeAgentRun(agentRun.id, "failed");
      return fail("APPROVAL_TRANSITION_FAILED", `Approval request ${approval.id} could not be rejected`);
    }

    await this.store.createMemoryEntry({
      type: "APPROVAL_RESULT",
      key: `${rejected.jobPostingId}:${rejected.resumeProfileId}`,
      value: `Approval ${rejected.id} rejected by ${input.rejectedBy}: ${input.reason}`,
      tags: ["execution", "approval", "rejected"]
    });

    await this.store.createDecisionLog(
      agentRun.id,
      "Application rejected",
      `Approval ${rejected.id} was rejected by ${input.rejectedBy} with reason: ${input.reason}`
    );
    await this.store.createSkillExecution(
      agentRun.id,
      "application-reject-v1",
      "success",
      `approval=${rejected.id};rejectedBy=${input.rejectedBy}`
    );
    await this.store.completeAgentRun(agentRun.id, "completed");

    return ok({
      approvalRequest: rejected
    });
  }

  async updateApplicationStatus(
    input: UpdateApplicationStatusInput
  ): Promise<ApiResult<UpdateApplicationStatusResult>> {
    const application = await this.store.findApplicationById(input.applicationId);
    if (!application) {
      return fail("APPLICATION_NOT_FOUND", `Application ${input.applicationId} not found`);
    }
    if (application.status === input.status) {
      return fail(
        "APPLICATION_STATUS_ALREADY_SET",
        `Application ${application.id} is already in status ${application.status}`
      );
    }

    const agentRun = await this.store.createAgentRun("Execution Agent", "Execution");
    const updated = await this.store.updateApplicationStatus(
      application.id,
      input.status,
      input.updatedBy,
      input.reason
    );
    if (!updated) {
      await this.store.completeAgentRun(agentRun.id, "failed");
      return fail("APPLICATION_STATUS_TRANSITION_FAILED", `Application ${application.id} could not be updated`);
    }

    await this.store.createMemoryEntry({
      type: "APPLICATION_RESULT",
      key: `${updated.jobPostingId}:${updated.resumeProfileId}`,
      value: `Application ${updated.id} moved to ${updated.status} by ${input.updatedBy}: ${input.reason}`,
      tags: ["execution", "application", updated.status]
    });

    await this.store.createDecisionLog(
      agentRun.id,
      "Application status updated",
      `Application ${updated.id} moved to ${updated.status} by ${input.updatedBy} with reason: ${input.reason}`
    );
    await this.store.createSkillExecution(
      agentRun.id,
      "application-status-update-v1",
      "success",
      `application=${updated.id};status=${updated.status};updatedBy=${input.updatedBy}`
    );
    await this.store.completeAgentRun(agentRun.id, "completed");

    return ok({ application: updated });
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

  failUpdateApplicationValidation(): ApiResult<never> {
    return fail(
      "INVALID_APPLICATION_STATUS_PAYLOAD",
      "Payload must include applicationId, status(interview|rejected), updatedBy and reason"
    );
  }
}
