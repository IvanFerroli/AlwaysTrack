import type {
  ApiResult,
  IngestJobPostingInput,
  IngestJobPostingResult,
  JobPosting
} from "@olympus/shared-types";
import type { StateStore } from "../../domain/state/store.js";
import {
  computeDedupeKey,
  normalizeIngestPayload,
  tokenizeJobText
} from "./ingestion.normalize.js";
import { validateIngestPayload } from "./ingestion.validate.js";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

export class IngestionService {
  constructor(private readonly store: StateStore) {}

  async ingest(payload: IngestJobPostingInput): Promise<ApiResult<IngestJobPostingResult>> {
    if (!validateIngestPayload(payload)) {
      return this.failValidation();
    }

    const normalizedPayload = normalizeIngestPayload(payload);
    const dedupeKey = computeDedupeKey(normalizedPayload);
    const existing = await this.store.findJobPostingByDedupeKey(dedupeKey);

    const agentRun = await this.store.createAgentRun("Normalizer Agent", "Normalization");

    if (existing) {
      await this.store.recordIngestionAttempt(true);
      await this.store.createDecisionLog(
        agentRun.id,
        "Job posting deduplicated",
        `Found existing posting by dedupeKey=${dedupeKey}`
      );
      await this.store.createSkillExecution(
        agentRun.id,
        "job-posting-ingest-v1",
        "success",
        "existing posting reused"
      );
      await this.store.completeAgentRun(agentRun.id, "completed");
      return ok({
        jobPosting: existing,
        deduplicated: true
      });
    }

    const normalizedTokens = tokenizeJobText(normalizedPayload);
    const jobPosting: JobPosting = await this.store.insertJobPosting({
      ...normalizedPayload,
      normalizedTokens,
      dedupeKey,
      userStatus: "new",
      tags: []
    });

    await this.store.createDecisionLog(
      agentRun.id,
      "Job posting ingested",
      `Created posting ${jobPosting.id} with ${normalizedTokens.length} normalized tokens`
    );
    await this.store.recordIngestionAttempt(false);
    await this.store.createSkillExecution(
      agentRun.id,
      "job-posting-ingest-v1",
      "success",
      `posting=${jobPosting.id}`
    );
    await this.store.completeAgentRun(agentRun.id, "completed");
    return ok({
      jobPosting,
      deduplicated: false
    });
  }

  async list(): Promise<ApiResult<{ items: JobPosting[] }>> {
    return ok({ items: await this.store.listJobPostings() });
  }

  async updateJob(id: string, updates: Partial<Pick<JobPosting, "userStatus" | "tags">> & { addTag?: string, removeTag?: string }): Promise<ApiResult<JobPosting>> {
    const existingJob = await this.store.findJobPostingById(id);
    if (!existingJob) {
      return fail("JOB_NOT_FOUND", `Job posting ${id} not found`);
    }

    let newTags = updates.tags ?? [...existingJob.tags];
    const tagToAdd = updates.addTag?.trim();
    if (tagToAdd) {
      newTags.push(tagToAdd);
    }
    if (updates.removeTag) {
      newTags = newTags.filter(t => t !== updates.removeTag);
    }
    newTags = [...new Set(newTags)];

    const job = await this.store.updateJobPosting(id, { userStatus: updates.userStatus, tags: newTags });
    return ok(job!);
  }

  failValidation(): ApiResult<never> {
    return fail(
      "INVALID_INGEST_PAYLOAD",
      "Payload must include title, companyName, sourceName, sourceUrl and description"
    );
  }
}
