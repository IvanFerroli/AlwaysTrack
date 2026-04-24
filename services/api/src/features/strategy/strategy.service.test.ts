import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
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
      skills: ["node", "typescript"]
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
