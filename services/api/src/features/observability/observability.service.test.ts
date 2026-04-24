import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";

test("metrics snapshot tracks ingestion attempts and dedupe rate", () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);

  const payload = {
    title: "Backend Engineer",
    companyName: "Olympus",
    sourceName: "manual",
    sourceUrl: "https://example.com/jobs/metrics",
    description: "node typescript api",
    location: "remote"
  };

  ingestion.ingest(payload);
  ingestion.ingest(payload);

  const metrics = store.snapshotMetrics();
  assert.equal(metrics.ingestionAttempts, 2);
  assert.equal(metrics.dedupeHits, 1);
  assert.equal(metrics.dedupeRate, 0.5);
});
