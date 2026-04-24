import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { MatchService } from "./match.service.js";

test("match service scores based on normalized token overlap", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  const ingested = ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "linkedin",
    sourceUrl: "https://linkedin.test/job/2",
    description: "TypeScript Node API reliability",
    location: "remote"
  });

  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const result = match.score({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Backend developer",
      skills: ["node", "typescript", "graphql"],
      createdAt: new Date().toISOString()
    }
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("expected match to succeed");
  }

  assert.equal(result.data.matchedSkills.includes("node"), true);
  assert.equal(result.data.matchedSkills.includes("typescript"), true);
  assert.equal(result.data.missingSkills.includes("graphql"), true);
  assert.ok(result.data.score >= 60);
});
