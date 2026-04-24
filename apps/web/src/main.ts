import { createServer } from "node:http";
import { loadWebEnv } from "./config/env.js";
import { readFormBody } from "./core/http/read-form.js";
import { sendHtml, sendJson } from "./core/http/send.js";
import { loadDashboardData } from "./features/dashboard/load-dashboard.js";
import { loadApiHealth } from "./features/health/load-health.js";
import { renderHomePage } from "./features/home/render-home.js";
import { parseResumeSkills, submitJobPosting } from "./features/ingestion/submit-job.js";

const env = loadWebEnv();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const pathname = url.pathname;

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

  if (pathname === "/ingest" && request.method === "POST") {
    const form = await readFormBody(request);
    const outcome = await submitJobPosting(
      env.apiBaseUrl,
      {
        title: form.get("title")?.toString() ?? "",
        companyName: form.get("companyName")?.toString() ?? "",
        sourceName: form.get("sourceName")?.toString() ?? "",
        sourceUrl: form.get("sourceUrl")?.toString() ?? "",
        location: form.get("location")?.toString() ?? "",
        description: form.get("description")?.toString() ?? ""
      },
      {
        id: "resume-default",
        headline: form.get("resumeHeadline")?.toString() ?? "Software Engineer",
        skills: parseResumeSkills(form.get("resumeSkills")?.toString() ?? "")
      }
    );

    if (outcome.ok) {
      const suffix = outcome.deduplicated ? "dedup" : "created";
      response.writeHead(302, { location: `/?status=success&result=${suffix}&score=${outcome.score ?? 0}` });
      response.end();
      return;
    }

    response.writeHead(302, { location: `/?status=error&code=${outcome.errorCode ?? "UNKNOWN"}` });
    response.end();
    return;
  }

  if (pathname === "/") {
    const [apiHealth, dashboard] = await Promise.all([
      loadApiHealth(env.apiBaseUrl),
      loadDashboardData(env.apiBaseUrl)
    ]);

    const status = url.searchParams.get("status");
    const flash =
      status === "success"
        ? {
            kind: "success" as const,
            message: `Job ${url.searchParams.get("result") ?? "processed"} with score ${url.searchParams.get("score") ?? "n/a"}`
          }
        : status === "error"
          ? {
              kind: "error" as const,
              message: `Ingestion failed (${url.searchParams.get("code") ?? "UNKNOWN"})`
            }
          : undefined;

    sendHtml(response, 200, renderHomePage(apiHealth, dashboard.jobs, dashboard.decisions, flash));
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
