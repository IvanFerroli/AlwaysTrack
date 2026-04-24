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
      skills: ["node", "typescript"]
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
});
