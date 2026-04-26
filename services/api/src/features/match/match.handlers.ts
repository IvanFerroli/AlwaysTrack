import type { JobSeniority, JobUserStatus } from "@olympus/shared-types";
import { JOB_SENIORITY_LEVELS } from "../../domain/matching/seniority.js";
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

function parseJobSeniority(value: string | null): JobSeniority | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  return JOB_SENIORITY_LEVELS.find((level) => level === lower);
}

function trimmedQueryValue(value: string | null, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function trimmedQueryValues(params: URLSearchParams, name: string, maxLength: number): string[] | undefined {
  const values = params
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => value.slice(0, maxLength));

  return values.length > 0 ? [...new Set(values)] : undefined;
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

function parsePositiveInt(value: string | null, min: number, max: number): number | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d+$/.test(trimmed)) return Number.NaN;
  const parsed = Number.parseInt(trimmed, 10);
  if (parsed < min || parsed > max) return Number.NaN;
  return parsed;
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
    sendApiResult(response, await service.score(payload));
  };

  const listRanked: HttpHandler = async ({ request, response }) => {
    const rawUrl = request.url ?? "";
    const queryStart = rawUrl.indexOf("?");
    const params = new URLSearchParams(queryStart >= 0 ? rawUrl.slice(queryStart + 1) : "");
    const resumeProfileId = trimmedQueryValue(params.get("resumeProfileId"), 120);
    const q = trimmedQueryValues(params, "q", 120);
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

    const rawStatuses = params.getAll("status").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
    const status = rawStatuses.map(parseJobUserStatus);
    if (rawStatuses.length > 0 && status.some((item) => !item)) {
      invalidFilters(response, "status must contain only: new, applied, discarded");
      return;
    }

    const tags = trimmedQueryValues(params, "tags", 60);
    if (params.has("tags") && !tags) {
      invalidFilters(response, "tags must include at least one non-empty tag");
      return;
    }
    if (tags && (tags.length > 20 || tags.some((tag) => tag.length > 60))) {
      invalidFilters(response, "tags must contain at most 20 values with 60 characters each");
      return;
    }

    const location = trimmedQueryValues(params, "location", 200);
    const sourceName = trimmedQueryValues(params, "sourceName", 80);
    const rawSeniorities = params
      .getAll("seniority")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean);
    const seniority = rawSeniorities.map(parseJobSeniority);
    if (rawSeniorities.length > 0 && seniority.some((item) => !item)) {
      invalidFilters(response, "seniority must contain only: junior, mid, senior, lead");
      return;
    }

    const sortByDateRaw = params.get("sortByDate")?.trim().toLowerCase();
    let sortByDate: "none" | "newest" | "oldest" | undefined;
    if (sortByDateRaw) {
      if (sortByDateRaw !== "none" && sortByDateRaw !== "newest" && sortByDateRaw !== "oldest") {
        invalidFilters(response, "sortByDate must be one of: none, newest, oldest");
        return;
      }
      sortByDate = sortByDateRaw;
    }

    const page = parsePositiveInt(params.get("page"), 1, 10_000);
    if (Number.isNaN(page)) {
      invalidFilters(response, "page must be an integer between 1 and 10000");
      return;
    }

    const pageSize = parsePositiveInt(params.get("pageSize"), 1, 100);
    if (Number.isNaN(pageSize)) {
      invalidFilters(response, "pageSize must be an integer between 1 and 100");
      return;
    }

    const includeScoreBreakdownRaw = params.get("includeScoreBreakdown")?.trim().toLowerCase();
    const includeScoreBreakdown =
      includeScoreBreakdownRaw === "1" ||
      includeScoreBreakdownRaw === "true" ||
      includeScoreBreakdownRaw === "yes";
    const includeLlmEnrichmentRaw = params.get("includeLlmEnrichment")?.trim().toLowerCase();
    const includeLlmEnrichment =
      includeLlmEnrichmentRaw === "1" ||
      includeLlmEnrichmentRaw === "true" ||
      includeLlmEnrichmentRaw === "yes";

    sendApiResult(response, await service.listRanked(resumeProfileId, {
      q,
      minScore,
      status: status.filter((item): item is JobUserStatus => Boolean(item)),
      tags,
      location,
      sourceName,
      seniority: seniority.filter((item): item is JobSeniority => Boolean(item)),
      sortByDate,
      page,
      pageSize,
      includeScoreBreakdown,
      includeLlmEnrichment
    }));
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
