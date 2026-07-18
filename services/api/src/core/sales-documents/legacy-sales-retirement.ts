import type { RequestHandler } from "express";
import type { ApiEnv } from "../../config/env.js";
import { sendError } from "../http/responses.js";

export const legacySalesDeprecationHeaders: RequestHandler = (_request, response, next) => {
  response.setHeader("Deprecation", "true");
  response.setHeader("Sunset", "Thu, 31 Dec 2026 23:59:59 GMT");
  response.setHeader("Link", "</v1/support/dashboard>; rel=\"successor-version\"");
  next();
};

export function createLegacySalesWriteGuard(env: Pick<ApiEnv, "enableLegacySalesWrites">): RequestHandler {
  return (_request, response, next) => {
    if (env.enableLegacySalesWrites) return next();
    return sendError(
      response,
      410,
      "LEGACY_SALES_RETIRED",
      "As escritas do módulo de Vendas foram aposentadas. Use as operações SAC."
    );
  };
}
