import type { JobAcquisitionInput } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { JobAcquisitionService } from "./acquisition.service.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isJobAcquisitionMethod(value: unknown): value is JobAcquisitionInput["method"] {
  return (
    value === "smart-paste" ||
    value === "url-import" ||
    value === "ats-adapter" ||
    value === "browser-capture" ||
    value === "email-alert" ||
    value === "provider-json"
  );
}

function validateAcquisitionPayload(payload: unknown): payload is JobAcquisitionInput {
  if (!isRecord(payload)) return false;
  if (!isJobAcquisitionMethod(payload["method"])) return false;
  return true;
}

export function createAcquisitionHandlers(service: JobAcquisitionService): {
  acquire: HttpHandler;
} {
  const acquire: HttpHandler = async ({ request, response }) => {
    const body = await readJsonBody(request);

    if (!validateAcquisitionPayload(body)) {
      sendApiResult(response, {
        ok: false,
        error: {
          code: "INVALID_ACQUISITION_PAYLOAD",
          message: "Payload must include a valid method: smart-paste | url-import | ats-adapter | browser-capture | email-alert | provider-json"
        }
      });
      return;
    }

    const result = await service.acquire(body);
    sendApiResult(response, result);
  };

  return { acquire };
}
