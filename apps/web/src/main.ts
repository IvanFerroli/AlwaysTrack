import { createServer } from "node:http";
import { loadWebEnv } from "./config/env.js";
import { sendHtml, sendJson } from "./core/http/send.js";
import { loadApiHealth } from "./features/health/load-health.js";
import { renderHomePage } from "./features/home/render-home.js";

const env = loadWebEnv();

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  if (pathname === "/health") {
    const apiHealth = await loadApiHealth(env.apiBaseUrl);
    sendJson(response, 200, {
      ok: true,
      data: {
        service: "web",
        status: "ok",
        timestamp: new Date().toISOString(),
        api: apiHealth
      }
    });
    return;
  }

  if (pathname === "/") {
    const apiHealth = await loadApiHealth(env.apiBaseUrl);
    sendHtml(response, 200, renderHomePage(apiHealth));
    return;
  }

  sendJson(response, 404, {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  });
});

server.listen(env.port, () => {
  console.log(`[web] runtime scaffold listening on :${env.port} (${env.nodeEnv})`);
});
