import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { StrategyService } from "./strategy.service.js";
import { validateStrategyPayload } from "./strategy.validate.js";

export function createStrategyHandlers(service: StrategyService): { propose: HttpHandler } {
  const propose: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateStrategyPayload(payload)) {
      sendApiResult(response, service.failValidation());
      return;
    }
    sendApiResult(response, await service.propose(payload));
  };

  return { propose };
}
