import { describe, expect, it } from "vitest";
import { bullMqJobId } from "./queue.js";

describe("BullMQ job identifiers", () => {
  it("maps deduplication keys to stable custom IDs accepted by BullMQ", () => {
    const dedupeKey = "ranking-snapshot.create:org-1:campaign-1";
    const jobId = bullMqJobId(dedupeKey);

    expect(jobId).toBe(bullMqJobId(dedupeKey));
    expect(jobId).toMatch(/^dedupe-[a-f0-9]{64}$/);
    expect(jobId).not.toContain(":");
    expect(jobId).not.toBe(bullMqJobId(`${dedupeKey}:other`));
  });
});
