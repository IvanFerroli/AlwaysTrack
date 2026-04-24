import { createServer } from "node:http";
import { loadApiEnv } from "./config/env.js";
import { createRouter } from "./core/http/router.js";
import { sendJson } from "./core/http/send.js";
import type { HttpHandler } from "./core/http/types.js";
import { InMemoryStateStore } from "./domain/state/store.js";
import { createAuditHandlers } from "./features/audit/audit.handlers.js";
import { createHealthHandler } from "./features/health/health.handlers.js";
import { createIngestHandlers } from "./features/ingestion/ingestion.handlers.js";
import { IngestionService } from "./features/ingestion/ingestion.service.js";
import { createMatchHandlers } from "./features/match/match.handlers.js";
import { MatchService } from "./features/match/match.service.js";
import { pingHandler } from "./features/ping/ping.handlers.js";

const env = loadApiEnv();
const startedAt = Date.now();
const store = new InMemoryStateStore();
const ingestionService = new IngestionService(store);
const matchService = new MatchService(store);

const notFoundHandler: HttpHandler = ({ response }) => {
  sendJson(response, 404, {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  });
};

const ingestHandlers = createIngestHandlers(ingestionService);
const matchHandlers = createMatchHandlers(matchService);
const auditHandlers = createAuditHandlers(store);
const router = createRouter(notFoundHandler);
router.register("GET", "/health", createHealthHandler(startedAt));
router.register("GET", "/ping", pingHandler);
router.register("GET", "/v1/job-postings", ingestHandlers.list);
router.register("POST", "/v1/job-postings/ingest", ingestHandlers.ingest);
router.register("POST", "/v1/match/score", matchHandlers.score);
router.register("GET", "/v1/agent-runs", auditHandlers.listRuns);
router.register("GET", "/v1/decision-logs", auditHandlers.listDecisionLogs);
router.register("GET", "/v1/skill-executions", auditHandlers.listSkillExecutions);

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    await router.handle(request, response);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
  }
});

server.listen(env.port, () => {
  console.log(`[api] runtime scaffold listening on :${env.port} (${env.nodeEnv})`);
});
