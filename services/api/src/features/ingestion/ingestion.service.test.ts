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

test("updateJob fails with JOB_UPDATE_FAILED when store update returns undefined", async () => {
  const store = new InMemoryStateStore();
  const service = new IngestionService(store);
  const ingested = await service.ingest({
    title: "Backend Engineer",
    companyName: "Olympus Labs",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/123",
    description: "Node and TypeScript",
    location: "Remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const storeAny = store as unknown as { updateJobPosting: () => Promise<undefined> };
  storeAny.updateJobPosting = async () => undefined;

  const result = await service.updateJob(ingested.data.jobPosting.id, { addTag: "node" });
  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("expected update to fail");
  }
  assert.equal(result.error.code, "JOB_UPDATE_FAILED");
});

test("updateJob rejects unsafe tags", async () => {
  const store = new InMemoryStateStore();
  const service = new IngestionService(store);
  const ingested = await service.ingest({
    title: "Full Stack Engineer",
    companyName: "Olympus Labs",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/456",
    description: "React and Node",
    location: "Remote"
  });
  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const result = await service.updateJob(ingested.data.jobPosting.id, { addTag: "<script>alert(1)</script>" });
  assert.equal(result.ok, false);
  if (result.ok) {
    throw new Error("expected update to fail for unsafe tag");
  }
  assert.equal(result.error.code, "INVALID_JOB_TAG");
});
