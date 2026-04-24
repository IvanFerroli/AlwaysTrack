import type {
  ApiResult,
  IngestJobPostingInput,
  IngestJobPostingResult,
  JobPosting
} from "@olympus/shared-types";
import { InMemoryStateStore } from "../../domain/state/store.js";
import {
  computeDedupeKey,
  normalizeIngestPayload,
  tokenizeJobText
} from "./ingestion.normalize.js";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export class IngestionService {
  constructor(private readonly store: InMemoryStateStore) {}

  ingest(payload: IngestJobPostingInput): ApiResult<IngestJobPostingResult> {
    const normalizedPayload = normalizeIngestPayload(payload);
    const dedupeKey = computeDedupeKey(normalizedPayload);
    const existing = this.store.findJobPostingByDedupeKey(dedupeKey);

    const agentRun = this.store.createAgentRun("Normalizer Agent", "Normalization");

    if (existing) {
      this.store.recordIngestionAttempt(true);
      this.store.createDecisionLog(
        agentRun.id,
        "Job posting deduplicated",
        `Found existing posting by dedupeKey=${dedupeKey}`
      );
      this.store.createSkillExecution(
        agentRun.id,
        "job-posting-ingest-v1",
        "success",
        "existing posting reused"
      );
      this.store.completeAgentRun(agentRun.id, "completed");
      return ok({
        jobPosting: existing,
        deduplicated: true
      });
    }

    const normalizedTokens = tokenizeJobText(normalizedPayload);
    const jobPosting: JobPosting = this.store.insertJobPosting({
      ...normalizedPayload,
      normalizedTokens,
      dedupeKey,
      userStatus: "new",
      tags: []
    });

    this.store.createDecisionLog(
      agentRun.id,
      "Job posting ingested",
      `Created posting ${jobPosting.id} with ${normalizedTokens.length} normalized tokens`
    );
    this.store.recordIngestionAttempt(false);
    this.store.createSkillExecution(
      agentRun.id,
      "job-posting-ingest-v1",
      "success",
      `posting=${jobPosting.id}`
    );
    this.store.completeAgentRun(agentRun.id, "completed");
    return ok({
      jobPosting,
      deduplicated: false
    });
  }

  list(): ApiResult<{ items: JobPosting[] }> {
    return ok({ items: this.store.listJobPostings() });
  }

  updateJob(id: string, updates: Partial<Pick<JobPosting, "userStatus" | "tags">>): ApiResult<JobPosting> {
    const job = this.store.updateJobPosting(id, updates);
    if (!job) {
      return fail("JOB_NOT_FOUND", `Job posting ${id} not found`);
    }
    return ok(job);
  }

  failValidation(): ApiResult<never> {
    return fail(
      "INVALID_INGEST_PAYLOAD",
      "Payload must include title, companyName, sourceName, sourceUrl and description"
    );
  }
}
