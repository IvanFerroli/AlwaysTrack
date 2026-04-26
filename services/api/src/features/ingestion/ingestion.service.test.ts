import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "./ingestion.service.js";

test("ingestion deduplicates repeated postings", async () => {
  const store = new InMemoryStateStore();
  const service = new IngestionService(store);

  const payload = {
    title: "Senior Node Engineer",
    companyName: "Olympus Labs",
    sourceName: "linkedin",
    sourceUrl: "https://linkedin.test/job/1",
    description: "Node TypeScript APIs and observability",
    location: "remote"
  };

  const first = await service.ingest(payload);
  assert.equal(first.ok, true);
  if (!first.ok) {
    throw new Error("expected first ingestion to succeed");
  }
  assert.equal(first.data.deduplicated, false);

  const second = await service.ingest(payload);
  assert.equal(second.ok, true);
  if (!second.ok) {
    throw new Error("expected second ingestion to succeed");
  }
  assert.equal(second.data.deduplicated, true);
  assert.equal(second.data.jobPosting.id, first.data.jobPosting.id);
});
