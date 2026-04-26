import type { PipelineRunInput } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { PipelineService } from "./pipeline.service.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function parseInput(payload: unknown): PipelineRunInput | undefined {
  if (!isRecord(payload)) return {};

  const source = typeof payload["source"] === "string" ? payload["source"] : undefined;
  const keyword = typeof payload["keyword"] === "string" ? payload["keyword"] : undefined;
  const autoDiscard = typeof payload["autoDiscard"] === "boolean" ? payload["autoDiscard"] : undefined;
  const includeLlmEnrichment =
    typeof payload["includeLlmEnrichment"] === "boolean" ? payload["includeLlmEnrichment"] : undefined;
  const resumeProfileId = typeof payload["resumeProfileId"] === "string" ? payload["resumeProfileId"] : undefined;
  const shortlistSize = typeof payload["shortlistSize"] === "number" ? payload["shortlistSize"] : undefined;
  const minScore = typeof payload["minScore"] === "number" ? payload["minScore"] : undefined;
  const maxLlmJobs = typeof payload["maxLlmJobs"] === "number" ? payload["maxLlmJobs"] : undefined;
  const maxDurationMs = typeof payload["maxDurationMs"] === "number" ? payload["maxDurationMs"] : undefined;
  const maxSources = typeof payload["maxSources"] === "number" ? payload["maxSources"] : undefined;
  const maxEstimatedCostUsd =
    typeof payload["maxEstimatedCostUsd"] === "number" ? payload["maxEstimatedCostUsd"] : undefined;

  if (source !== undefined && source.trim().length === 0) return undefined;
  if (keyword !== undefined && keyword.trim().length === 0) return undefined;
  if (resumeProfileId !== undefined && resumeProfileId.trim().length === 0) return undefined;
  if (shortlistSize !== undefined && (!Number.isFinite(shortlistSize) || shortlistSize < 1 || shortlistSize > 20)) {
    return undefined;
  }
  if (minScore !== undefined && (!Number.isFinite(minScore) || minScore < 0 || minScore > 100)) {
    return undefined;
  }
  if (maxLlmJobs !== undefined && (!Number.isFinite(maxLlmJobs) || maxLlmJobs < 0 || maxLlmJobs > 20)) {
    return undefined;
  }
  if (maxDurationMs !== undefined && (!Number.isFinite(maxDurationMs) || maxDurationMs < 500 || maxDurationMs > 120_000)) {
    return undefined;
  }
  if (maxSources !== undefined && (!Number.isFinite(maxSources) || maxSources < 1 || maxSources > 20)) {
    return undefined;
  }
  if (
    maxEstimatedCostUsd !== undefined &&
    (!Number.isFinite(maxEstimatedCostUsd) || maxEstimatedCostUsd < 0 || maxEstimatedCostUsd > 5)
  ) {
    return undefined;
  }

  return {
    source,
    keyword,
    autoDiscard,
    includeLlmEnrichment,
    resumeProfileId,
    shortlistSize,
    minScore,
    maxLlmJobs,
    maxDurationMs,
    maxSources,
    maxEstimatedCostUsd
  };
}

export function createPipelineHandlers(service: PipelineService): {
  run: HttpHandler;
} {
  const run: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    const input = parseInput(payload);

    if (!input) {
      sendApiResult(response, {
        ok: false,
        error: {
          code: "INVALID_PIPELINE_PAYLOAD",
          message: "Payload inválido para pipeline run"
        }
      });
      return;
    }

    sendApiResult(response, await service.run(input));
  };

  return { run };
}
