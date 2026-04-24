import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { ExecutionService } from "../execution/execution.service.js";
import { StrategyService } from "./strategy.service.js";

test("strategy creates approval request when score meets threshold", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);

  const ingested = ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/strategy-1",
    description: "Node TypeScript distributed systems",
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
  if (!proposal.ok) {
    throw new Error("expected strategy to succeed");
  }
  assert.equal(proposal.data.proposed, true);
  assert.ok(proposal.data.approvalRequest);
  assert.equal(proposal.data.approvalRequest?.status, "pending");
});

test("strategy reuses existing pending approval for same job and resume", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);

  const ingested = ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/strategy-2",
    description: "Node TypeScript distributed systems",
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

  const firstProposal = strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile,
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(firstProposal.ok, true);
  if (!firstProposal.ok || !firstProposal.data.approvalRequest) {
    throw new Error("expected first proposal approval request");
  }

  const secondProposal = strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile,
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(secondProposal.ok, true);
  if (!secondProposal.ok || !secondProposal.data.approvalRequest) {
    throw new Error("expected second proposal approval request");
  }

  assert.equal(secondProposal.data.approvalRequest.id, firstProposal.data.approvalRequest.id);
  assert.equal(store.listApprovalRequests().length, 1);
});

test("strategy does not propose when application already submitted for same job and resume", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const strategy = new StrategyService(store);
  const execution = new ExecutionService(store);

  const ingested = ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/strategy-3",
    description: "Node TypeScript distributed systems",
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

  const approval = execution.approve({
    approvalRequestId: proposal.data.approvalRequest.id,
    approvedBy: "human-reviewer"
  });
  assert.equal(approval.ok, true);

  const secondProposal = strategy.propose({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile,
    minimumScore: 50,
    requestedBy: "tester"
  });
  assert.equal(secondProposal.ok, true);
  if (!secondProposal.ok) {
    throw new Error("expected strategy to succeed");
  }
  assert.equal(secondProposal.data.proposed, false);
  assert.equal(secondProposal.data.approvalRequest, undefined);
  assert.match(secondProposal.data.rationale, /already submitted/i);
});
