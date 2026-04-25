import type { JobPosting, JobUserStatus } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { IngestionService } from "./ingestion.service.js";
import { validateIngestPayload } from "./ingestion.validate.js";

type UpdateJobPayload = Partial<Pick<JobPosting, "userStatus" | "tags">> & {
  id: string;
  addTag?: string;
  removeTag?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isJobUserStatus(value: unknown): value is JobUserStatus {
  return value === "new" || value === "applied" || value === "discarded";
}

function validateUpdateJobPayload(payload: unknown): payload is UpdateJobPayload {
  if (!isRecord(payload) || typeof payload["id"] !== "string" || payload["id"].trim().length === 0) {
    return false;
  }

  if (payload["userStatus"] !== undefined && !isJobUserStatus(payload["userStatus"])) {
    return false;
  }

  if (
    payload["tags"] !== undefined &&
    (!Array.isArray(payload["tags"]) || !payload["tags"].every((item) => typeof item === "string"))
  ) {
    return false;
  }

  if (payload["addTag"] !== undefined && typeof payload["addTag"] !== "string") {
    return false;
  }

  if (payload["removeTag"] !== undefined && typeof payload["removeTag"] !== "string") {
    return false;
  }

  return true;
}

export function createIngestHandlers(service: IngestionService): {
  ingest: HttpHandler;
  list: HttpHandler;
  update: HttpHandler;
} {
  const ingest: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateIngestPayload(payload)) {
      sendApiResult(response, service.failValidation());
      return;
    }
    sendApiResult(response, service.ingest(payload));
  };

  const list: HttpHandler = ({ response }) => {
    sendApiResult(response, service.list());
  };

  const update: HttpHandler = async ({ request, response }) => {
    try {
      const payload = await readJsonBody(request);
      if (!validateUpdateJobPayload(payload)) {
        sendApiResult(response, { ok: false, error: { code: "INVALID_PAYLOAD", message: "Missing job id" } });
        return;
      }
      sendApiResult(response, service.updateJob(payload.id, payload));
    } catch (err) {
      sendApiResult(response, { ok: false, error: { code: "SERVER_ERROR", message: String(err) } });
    }
  };

  return { ingest, list, update };
}
