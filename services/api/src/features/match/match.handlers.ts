import type { JobUserStatus } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult, sendJson } from "../../core/http/send.js";
import { MatchService } from "./match.service.js";
import { validateMatchPayload } from "./match.validate.js";

function parseJobUserStatus(value: string | null): JobUserStatus | undefined {
  if (value === "new" || value === "applied" || value === "discarded") {
    return value;
  }
  return undefined;
}

function trimmedQueryValue(value: string | null, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function invalidFilters(response: Parameters<HttpHandler>[0]["response"], message: string): void {
  sendJson(response, 400, {
    ok: false,
    error: {
      code: "INVALID_JOB_FILTERS",
      message
    }
  });
}

export function createMatchHandlers(service: MatchService): {
  score: HttpHandler;
  deepScore: HttpHandler;
  listRanked: HttpHandler;
} {
  const score: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateMatchPayload(payload)) {
      sendApiResult(response, service.failValidation());
      return;
    }
    sendApiResult(response, service.score(payload));
  };

  const listRanked: HttpHandler = ({ request, response }) => {
    const rawUrl = request.url ?? "";
    const queryStart = rawUrl.indexOf("?");
    const params = new URLSearchParams(queryStart >= 0 ? rawUrl.slice(queryStart + 1) : "");
    const resumeProfileId = trimmedQueryValue(params.get("resumeProfileId"), 120);
    const q = trimmedQueryValue(params.get("q"), 120);
    const minScoreStr = params.get("minScore");
    const minScoreTrimmed = minScoreStr?.trim();
    let minScore: number | undefined;
    if (minScoreTrimmed) {
      const parsedMinScore = Number(minScoreTrimmed);
      if (!Number.isFinite(parsedMinScore) || parsedMinScore < 0 || parsedMinScore > 100) {
        invalidFilters(response, "minScore must be a number between 0 and 100");
        return;
      }
      minScore = parsedMinScore;
    }

    const rawStatus = params.get("status");
    const status = parseJobUserStatus(rawStatus);
    if (rawStatus !== null && rawStatus.trim() && !status) {
      invalidFilters(response, "status must be one of: new, applied, discarded");
      return;
    }

    const tagsParam = params.get("tags");
    const tags = tagsParam ? tagsParam.split(",").map(t => t.trim()).filter(Boolean) : undefined;
    if (tagsParam !== null && tagsParam.trim() && (!tags || tags.length === 0)) {
      invalidFilters(response, "tags must include at least one non-empty tag");
      return;
    }
    if (tags && (tags.length > 20 || tags.some((tag) => tag.length > 60))) {
      invalidFilters(response, "tags must contain at most 20 values with 60 characters each");
      return;
    }

    const location = trimmedQueryValue(params.get("location"), 200);
    const sourceName = trimmedQueryValue(params.get("sourceName"), 80);

    sendApiResult(response, service.listRanked(resumeProfileId, { q, minScore, status, tags, location, sourceName }));
  };

  const deepScore: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateMatchPayload(payload)) {
      sendApiResult(response, service.failValidation());
      return;
    }
    sendApiResult(response, await service.deepScore(payload));
  };

  return { score, deepScore, listRanked };
}
