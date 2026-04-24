import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { IngestionService } from "./ingestion.service.js";
import { validateIngestPayload } from "./ingestion.validate.js";

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
      if (!payload.id) {
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
