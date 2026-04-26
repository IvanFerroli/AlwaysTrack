import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { ExecutionService } from "./execution.service.js";
import { StrategyService } from "../strategy/strategy.service.js";

test("execution approves pending request and creates submitted application", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = await ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/execution-1",
    description: "Node TypeScript observability",
    location: "remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const proposal = await strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Backend Engineer",
      skills: ["node", "typescript"],
      createdAt: new Date().toISOString()
    },
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(proposal.ok, true);
  if (!proposal.ok || !proposal.data.approvalRequest) {
    throw new Error("expected strategy approval request");
  }

  const approval = await execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });

  assert.equal(approval.ok, true);
  if (!approval.ok) {
    throw new Error("expected execution approval to succeed");
  }
  assert.equal(approval.data.approvalRequest.status, "approved");
  assert.equal(approval.data.application.status, "submitted");

  const memory = await store.listMemoryEntries();
  assert.equal(memory.length > 0, true);
  assert.equal(memory[0]?.type, "APPLICATION_RESULT");
});

test("execution rejects pending request and stores rejection evidence", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = await ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/execution-2",
    description: "Node TypeScript observability",
    location: "remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const proposal = await strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Backend Engineer",
      skills: ["node", "typescript"],
      createdAt: new Date().toISOString()
    },
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(proposal.ok, true);
  if (!proposal.ok || !proposal.data.approvalRequest) {
    throw new Error("expected strategy approval request");
  }

  const rejection = await execution.reject({
    approvalRequestId: proposal.data.approvalRequest.id,
    rejectedBy: "human-reviewer",
    reason: "Not a strategic fit now"
  });
  assert.equal(rejection.ok, true);
  if (!rejection.ok) {
    throw new Error("expected execution rejection to succeed");
  }

  assert.equal(rejection.data.approvalRequest.status, "rejected");
  assert.equal(rejection.data.approvalRequest.rejectionReason, "Not a strategic fit now");

  const memory = await store.listMemoryEntries();
  assert.equal(memory.length > 0, true);
  assert.equal(memory[0]?.type, "APPROVAL_RESULT");
});

test("execution cannot approve already rejected request", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = await ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/execution-3",
    description: "Node TypeScript observability",
    location: "remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const proposal = await strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Backend Engineer",
      skills: ["node", "typescript"],
      createdAt: new Date().toISOString()
    },
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(proposal.ok, true);
  if (!proposal.ok || !proposal.data.approvalRequest) {
    throw new Error("expected strategy approval request");
  }

  const rejection = await execution.reject({
    approvalRequestId: proposal.data.approvalRequest.id,
    rejectedBy: "human-reviewer",
    reason: "Not aligned"
  });
  assert.equal(rejection.ok, true);

  const approval = await execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(approval.ok, false);
  if (approval.ok) {
    throw new Error("expected approval to fail");
  }
  assert.equal(approval.error.code, "APPROVAL_NOT_PENDING");
});

test("execution auto-rejects duplicate pending approval when application already exists", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = await ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/execution-4",
    description: "Node TypeScript observability",
    location: "remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const resumeProfile = {
    id: "resume-1",
    headline: "Backend Engineer",
    skills: ["node", "typescript"],
    createdAt: new Date().toISOString()
  };

  const proposal = await strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile,
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(proposal.ok, true);
  if (!proposal.ok || !proposal.data.approvalRequest) {
    throw new Error("expected strategy approval request");
  }

  const firstApproval = await execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(firstApproval.ok, true);
  if (!firstApproval.ok) {
    throw new Error("expected initial approval to succeed");
  }

  const duplicatePending = await store.createApprovalRequest({
    actionType: "SEND_APPLICATION",
    jobPostingId: proposal.data.approvalRequest.jobPostingId,
    resumeProfileId: proposal.data.approvalRequest.resumeProfileId,
    requestedBy: "tester",
    reason: "duplicate pending for test"
  });

  const duplicateApproval = await execution.approve({
    approvalRequestId: duplicatePending.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(duplicateApproval.ok, false);
  if (duplicateApproval.ok) {
    throw new Error("expected duplicate approval to fail");
  }
  assert.equal(duplicateApproval.error.code, "APPLICATION_ALREADY_SUBMITTED");

  const refreshedDuplicate = await store.findApprovalRequestById(duplicatePending.id);
  assert.equal(refreshedDuplicate?.status, "rejected");
  assert.match(refreshedDuplicate?.rejectionReason ?? "", /duplicate/i);
});

test("execution updates submitted application status to interview with evidence", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = await ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/execution-5",
    description: "Node TypeScript observability",
    location: "remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const proposal = await strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Backend Engineer",
      skills: ["node", "typescript"],
      createdAt: new Date().toISOString()
    },
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(proposal.ok, true);
  if (!proposal.ok || !proposal.data.approvalRequest) {
    throw new Error("expected strategy approval request");
  }

  const approval = await execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(approval.ok, true);
  if (!approval.ok) {
    throw new Error("expected execution approval to succeed");
  }

  const updated = await execution.updateApplicationStatus({
    applicationId: approval.data.application.id,
    status: "interview",
    updatedBy: "human-reviewer",
    reason: "Strong fit for next stage"
  });
  assert.equal(updated.ok, true);
  if (!updated.ok) {
    throw new Error("expected application status update to succeed");
  }
  assert.equal(updated.data.application.status, "interview");
  assert.equal(updated.data.application.outcomeBy, "human-reviewer");
  assert.equal(updated.data.application.outcomeReason, "Strong fit for next stage");

  const memory = await store.listMemoryEntries();
  assert.equal(memory.length > 0, true);
  assert.match(memory[0]?.value ?? "", /moved to interview/i);
});

test("execution rejects invalid repeated status update", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = await ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/execution-6",
    description: "Node TypeScript observability",
    location: "remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const proposal = await strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Backend Engineer",
      skills: ["node", "typescript"],
      createdAt: new Date().toISOString()
    },
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(proposal.ok, true);
  if (!proposal.ok || !proposal.data.approvalRequest) {
    throw new Error("expected strategy approval request");
  }

  const approval = await execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(approval.ok, true);
  if (!approval.ok) {
    throw new Error("expected execution approval to succeed");
  }

  const firstUpdate = await execution.updateApplicationStatus({
    applicationId: approval.data.application.id,
    status: "rejected",
    updatedBy: "human-reviewer",
    reason: "Not selected"
  });
  assert.equal(firstUpdate.ok, true);

  const repeatedUpdate = await execution.updateApplicationStatus({
    applicationId: approval.data.application.id,
    status: "rejected",
    updatedBy: "human-reviewer",
    reason: "Duplicate status"
  });
  assert.equal(repeatedUpdate.ok, false);
  if (repeatedUpdate.ok) {
    throw new Error("expected repeated status update to fail");
  }
  assert.equal(repeatedUpdate.error.code, "APPLICATION_STATUS_ALREADY_SET");
});
