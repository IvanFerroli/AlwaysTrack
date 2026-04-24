import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { ExecutionService } from "./execution.service.js";
import { StrategyService } from "../strategy/strategy.service.js";

test("execution approves pending request and creates submitted application", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = ingestion.ingest({
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

  const proposal = strategy.propose({
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

  const approval = execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });

  assert.equal(approval.ok, true);
  if (!approval.ok) {
    throw new Error("expected execution approval to succeed");
  }
  assert.equal(approval.data.approvalRequest.status, "approved");
  assert.equal(approval.data.application.status, "submitted");

  const memory = store.listMemoryEntries();
  assert.equal(memory.length > 0, true);
  assert.equal(memory[0]?.type, "APPLICATION_RESULT");
});

test("execution rejects pending request and stores rejection evidence", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = ingestion.ingest({
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

  const proposal = strategy.propose({
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

  const rejection = execution.reject({
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

  const memory = store.listMemoryEntries();
  assert.equal(memory.length > 0, true);
  assert.equal(memory[0]?.type, "APPROVAL_RESULT");
});

test("execution cannot approve already rejected request", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = ingestion.ingest({
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

  const proposal = strategy.propose({
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

  const rejection = execution.reject({
    approvalRequestId: proposal.data.approvalRequest.id,
    rejectedBy: "human-reviewer",
    reason: "Not aligned"
  });
  assert.equal(rejection.ok, true);

  const approval = execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(approval.ok, false);
  if (approval.ok) {
    throw new Error("expected approval to fail");
  }
  assert.equal(approval.error.code, "APPROVAL_NOT_PENDING");
});

test("execution auto-rejects duplicate pending approval when application already exists", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = ingestion.ingest({
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

  const proposal = strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile,
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(proposal.ok, true);
  if (!proposal.ok || !proposal.data.approvalRequest) {
    throw new Error("expected strategy approval request");
  }

  const firstApproval = execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(firstApproval.ok, true);
  if (!firstApproval.ok) {
    throw new Error("expected initial approval to succeed");
  }

  const duplicatePending = store.createApprovalRequest({
    actionType: "SEND_APPLICATION",
    jobPostingId: proposal.data.approvalRequest.jobPostingId,
    resumeProfileId: proposal.data.approvalRequest.resumeProfileId,
    requestedBy: "tester",
    reason: "duplicate pending for test"
  });

  const duplicateApproval = execution.approve({
    approvalRequestId: duplicatePending.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(duplicateApproval.ok, false);
  if (duplicateApproval.ok) {
    throw new Error("expected duplicate approval to fail");
  }
  assert.equal(duplicateApproval.error.code, "APPLICATION_ALREADY_SUBMITTED");

  const refreshedDuplicate = store.findApprovalRequestById(duplicatePending.id);
  assert.equal(refreshedDuplicate?.status, "rejected");
  assert.match(refreshedDuplicate?.rejectionReason ?? "", /duplicate/i);
});
