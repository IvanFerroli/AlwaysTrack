import express from "express";
import { attachRequestContext } from "./core/http/request-context.js";
import { sendError, sendOk } from "./core/http/responses.js";
import { listAuditLogsHandler } from "./core/audit/audit.handlers.js";
import { loginHandler, logoutHandler, meHandler } from "./core/auth/auth.handlers.js";
import { requireAuth, requireRole } from "./core/auth/auth.middleware.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(attachRequestContext);

  app.get("/health", (_request, response) => sendOk(response, { status: "ok" }));

  app.post("/v1/auth/login", loginHandler);
  app.post("/v1/auth/logout", requireAuth, logoutHandler);
  app.get("/v1/auth/me", requireAuth, meHandler);

  app.get("/v1/audit-logs", requireAuth, requireRole(["ADMIN"]), listAuditLogsHandler);

  app.use((_request, response) => sendError(response, 404, "NOT_FOUND", "Route not found."));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error(error);
    return sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.");
  });

  return app;
}
