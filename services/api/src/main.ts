import { createServer } from "node:http";
import { loadApiEnv } from "./config/env.js";
import { createRouter } from "./core/http/router.js";
import { sendJson } from "./core/http/send.js";
import type { HttpHandler } from "./core/http/types.js";
import { PrismaStateStore } from "./domain/state/prisma-store.js";
import { PrismaClient } from "@prisma/client";
import { createAuditHandlers } from "./features/audit/audit.handlers.js";
import { createExecutionHandlers } from "./features/execution/execution.handlers.js";
import { ExecutionService } from "./features/execution/execution.service.js";
import { createHealthHandler } from "./features/health/health.handlers.js";
import { createIngestHandlers } from "./features/ingestion/ingestion.handlers.js";
import { IngestionService } from "./features/ingestion/ingestion.service.js";
import { createMatchHandlers } from "./features/match/match.handlers.js";
import { MatchService } from "./features/match/match.service.js";
import { createMemoryHandlers } from "./features/memory/memory.handlers.js";
import { createObservabilityHandlers } from "./features/observability/observability.handlers.js";
import { pingHandler } from "./features/ping/ping.handlers.js";
import { createResumeProfilesHandlers } from "./features/resume-profiles/resume-profiles.handlers.js";
import { ResumeProfilesService } from "./features/resume-profiles/resume-profiles.service.js";
import { createAcquisitionHandlers } from "./features/acquisition/acquisition.handlers.js";
import { JobAcquisitionService } from "./features/acquisition/acquisition.service.js";
import { createScraperHandlers } from "./features/scraper/scraper.handlers.js";
import { createStrategyHandlers } from "./features/strategy/strategy.handlers.js";
import { StrategyService } from "./features/strategy/strategy.service.js";

const env = loadApiEnv();
const startedAt = Date.now();
const prisma = new PrismaClient();
const store = new PrismaStateStore(prisma);
const ingestionService = new IngestionService(store);
const matchService = new MatchService(store);
const strategyService = new StrategyService(store);
const executionService = new ExecutionService(store);
const resumeProfilesService = new ResumeProfilesService(store);
const acquisitionService = new JobAcquisitionService(ingestionService);

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
const strategyHandlers = createStrategyHandlers(strategyService);
const executionHandlers = createExecutionHandlers(executionService);
const auditHandlers = createAuditHandlers(store);
const memoryHandlers = createMemoryHandlers(store);
const observabilityHandlers = createObservabilityHandlers(store);
const resumeProfilesHandlers = createResumeProfilesHandlers(resumeProfilesService);
const scraperHandlers = createScraperHandlers(ingestionService);
const acquisitionHandlers = createAcquisitionHandlers(acquisitionService);
const router = createRouter(notFoundHandler);
router.register("GET", "/health", createHealthHandler(startedAt));
router.register("GET", "/ping", pingHandler);
router.register("GET", "/v1/job-postings", ingestHandlers.list);
router.register("POST", "/v1/job-postings/ingest", ingestHandlers.ingest);
router.register("POST", "/v1/jobs/update", ingestHandlers.update);
router.register("GET", "/v1/resume-profiles", resumeProfilesHandlers.list);
router.register("POST", "/v1/resume-profiles", resumeProfilesHandlers.create);
router.register("POST", "/v1/resume-profiles/update", resumeProfilesHandlers.update);
router.register("GET", "/v1/resume-profiles/get", resumeProfilesHandlers.getById);
router.register("GET", "/v1/main-cv/sources", resumeProfilesHandlers.listMainCvSources);
router.register("POST", "/v1/main-cv/analyze", resumeProfilesHandlers.analyzeMainCv);
router.register("POST", "/v1/scraper/run", scraperHandlers.run);
router.register("POST", "/v1/jobs/acquire", acquisitionHandlers.acquire);
router.register("POST", "/v1/match/score", matchHandlers.score);
router.register("POST", "/v1/match/deep-score", matchHandlers.deepScore);
router.register("GET", "/v1/jobs/ranked", matchHandlers.listRanked);
router.register("POST", "/v1/strategy/propose", strategyHandlers.propose);
router.register("GET", "/v1/approval-queue", executionHandlers.listApprovalQueue);
router.register("POST", "/v1/approval-queue/approve", executionHandlers.approve);
router.register("POST", "/v1/approval-queue/reject", executionHandlers.reject);
router.register("GET", "/v1/applications", executionHandlers.listApplications);
router.register("POST", "/v1/applications/update-status", executionHandlers.updateApplicationStatus);
router.register("GET", "/v1/memory-entries", memoryHandlers.listMemory);
router.register("GET", "/v1/metrics", observabilityHandlers.metrics);
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
    const isTooLarge = error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE";
    const isInvalidJson = error instanceof SyntaxError;
    const statusCode = isTooLarge ? 413 : isInvalidJson ? 400 : 500;
    const code = isTooLarge ? "REQUEST_BODY_TOO_LARGE" : isInvalidJson ? "INVALID_JSON" : "INTERNAL_ERROR";
    const message = error instanceof Error ? error.message : "Unknown error";

    sendJson(response, statusCode, {
      ok: false,
      error: {
        code,
        message
      }
    });
  }
});

server.listen(env.port, env.host, () => {
  console.log(`[api] runtime scaffold listening on ${env.host}:${env.port} (${env.nodeEnv})`);
});
