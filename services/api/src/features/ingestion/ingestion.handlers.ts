import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { IngestionService } from "./ingestion.service.js";
import { validateIngestPayload } from "./ingestion.validate.js";

export function createIngestHandlers(service: IngestionService): {
  ingest: HttpHandler;
  list: HttpHandler;
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

  return { ingest, list };
}
