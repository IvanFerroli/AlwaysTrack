import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";
import { makeHealthService } from "./health.service.js";

export function createHealthHandler(startedAt: number): HttpHandler {
  const healthService = makeHealthService(startedAt);
  return ({ response }) => {
    sendApiResult(response, healthService());
  };
}
