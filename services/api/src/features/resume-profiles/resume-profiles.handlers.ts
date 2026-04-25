import type { ResumeProfile } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { ResumeProfilesService } from "./resume-profiles.service.js";
import { validateMainCvAnalyzePayload, validateResumeProfilePayload } from "./resume-profiles.validate.js";

type ResumeProfileUpdatePayload = Partial<Pick<ResumeProfile, "headline" | "skills">> & {
  id: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function validateResumeProfileUpdatePayload(payload: unknown): payload is ResumeProfileUpdatePayload {
  if (!isRecord(payload) || typeof payload["id"] !== "string" || payload["id"].trim().length === 0) {
    return false;
  }

  if (payload["headline"] !== undefined && typeof payload["headline"] !== "string") {
    return false;
  }

  if (
    payload["skills"] !== undefined &&
    (!Array.isArray(payload["skills"]) || !payload["skills"].every((item) => typeof item === "string"))
  ) {
    return false;
  }

  return true;
}

export function createResumeProfilesHandlers(service: ResumeProfilesService): {
  list: HttpHandler;
  create: HttpHandler;
  getById: HttpHandler;
  update: HttpHandler;
  listMainCvSources: HttpHandler;
  analyzeMainCv: HttpHandler;
} {
  const list: HttpHandler = ({ response }) => {
    sendApiResult(response, service.list());
  };

  const create: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateResumeProfilePayload(payload)) {
      sendApiResult(response, service.failValidation());
      return;
    }
    sendApiResult(response, service.create(payload));
  };

  const getById: HttpHandler = ({ request, response }) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const id = url.searchParams.get("id");
    if (!id) {
      sendApiResult(response, {
        ok: false,
        error: { code: "MISSING_RESUME_PROFILE_ID", message: "Query param id is required" }
      });
      return;
    }
    sendApiResult(response, service.getById(id));
  };

  const listMainCvSources: HttpHandler = async ({ response }) => {
    sendApiResult(response, await service.listMainCvSources());
  };

  const analyzeMainCv: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateMainCvAnalyzePayload(payload)) {
      sendApiResult(response, service.failMainCvValidation());
      return;
    }
    sendApiResult(response, await service.analyzeMainCv(payload));
  };

  const update: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateResumeProfileUpdatePayload(payload)) {
      sendApiResult(response, { ok: false, error: { code: "MISSING_ID", message: "ID is required for update" } });
      return;
    }
    sendApiResult(response, service.update(payload.id, payload));
  };

  return { list, create, getById, update, listMainCvSources, analyzeMainCv };
}
