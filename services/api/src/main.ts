import { createServer } from "node:http";
import { loadApiEnv } from "./config/env.js";
import { createRouter } from "./core/http/router.js";
import { sendJson } from "./core/http/send.js";
import type { HttpHandler } from "./core/http/types.js";
import { createHealthHandler } from "./features/health/health.handlers.js";
import { pingHandler } from "./features/ping/ping.handlers.js";

const env = loadApiEnv();
const startedAt = Date.now();

const notFoundHandler: HttpHandler = ({ response }) => {
  sendJson(response, 404, {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  });
};

const router = createRouter(notFoundHandler);
router.register("GET", "/health", createHealthHandler(startedAt));
router.register("GET", "/ping", pingHandler);

const server = createServer(async (request, response) => {
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
