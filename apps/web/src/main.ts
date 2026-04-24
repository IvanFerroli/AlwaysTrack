import { createServer } from "node:http";
import { loadWebEnv } from "./config/env.js";
import { readFormBody } from "./core/http/read-form.js";
import { sendHtml, sendJson } from "./core/http/send.js";
import { loadDashboardData } from "./features/dashboard/load-dashboard.js";
import { loadApiHealth } from "./features/health/load-health.js";
import { renderDashboardPage } from "./features/dashboard/render-dashboard.js";
import { renderWorkbenchPage } from "./features/home/render-home.js";
import { renderGuidePage } from "./features/home/render-guide.js";
import {
  analyzeMainCv,
  approveExecution,
  createResumeProfile,
  loadResumeProfileById,
  rejectExecution,
  updateApplicationStatus,
  submitJobPosting
} from "./features/ingestion/submit-job.js";

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
    const resumeProfileId = form.get("resumeProfileId")?.toString() ?? "";
    const resumeLookup = await loadResumeProfileById(env.apiBaseUrl, resumeProfileId);
    if (!resumeLookup.ok) {
      response.writeHead(302, { location: `/workspace?status=error&code=${resumeLookup.errorCode}` });
      response.end();
      return;
    }

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
      resumeLookup.profile
    );

    if (outcome.ok) {
      const suffix = outcome.deduplicated ? "dedup" : "created";
      const approvalSuffix = outcome.approvalRequestId ? `&approval=${outcome.approvalRequestId}` : "";
      response.writeHead(302, {
        location: `/workspace?status=success&result=${suffix}&score=${outcome.score ?? 0}${approvalSuffix}`
      });
      response.end();
      return;
    }

    response.writeHead(302, { location: `/workspace?status=error&code=${outcome.errorCode ?? "UNKNOWN"}` });
    response.end();
    return;
  }

  if (pathname === "/resume-profiles" && request.method === "POST") {
    const form = await readFormBody(request);
    const result = await createResumeProfile(
      env.apiBaseUrl,
      form.get("headline")?.toString() ?? "",
      form.get("skills")?.toString() ?? ""
    );
    if (result.ok) {
      response.writeHead(302, {
        location: `/workspace?status=success&result=resume-created&resume=${result.resumeProfileId}`
      });
      response.end();
      return;
    }
    response.writeHead(302, { location: `/workspace?status=error&code=${result.errorCode}` });
    response.end();
    return;
  }

  if (pathname === "/main-cv/analyze" && request.method === "POST") {
    const form = await readFormBody(request);
    const sourceFile = form.get("sourceFile")?.toString() ?? "";
    const headline = form.get("headline")?.toString() ?? "Main CV";
    const extraSkills = form.get("extraSkills")?.toString() ?? "";
    const result = await analyzeMainCv(env.apiBaseUrl, sourceFile, headline, extraSkills);
    if (result.ok) {
      response.writeHead(302, {
        location: `/workspace?status=success&result=main-cv-analyzed&resume=${result.resumeProfileId}&source=${encodeURIComponent(result.sourceFile)}&skills=${result.extractedSkillsCount}`
      });
      response.end();
      return;
    }
    response.writeHead(302, { location: `/workspace?status=error&code=${result.errorCode}` });
    response.end();
    return;
  }

  if (pathname === "/approve" && request.method === "POST") {
    const form = await readFormBody(request);
    const approvalRequestId = form.get("approvalRequestId")?.toString() ?? "";
    const approvedBy = form.get("approvedBy")?.toString() ?? "human-operator";
    const result = await approveExecution(env.apiBaseUrl, approvalRequestId, approvedBy);
    if (result.ok) {
      response.writeHead(302, {
        location: `/workspace?status=success&result=approved&application=${result.applicationId ?? ""}`
      });
      response.end();
      return;
    }

    response.writeHead(302, { location: `/workspace?status=error&code=${result.errorCode ?? "UNKNOWN"}` });
    response.end();
    return;
  }

  if (pathname === "/reject" && request.method === "POST") {
    const form = await readFormBody(request);
    const approvalRequestId = form.get("approvalRequestId")?.toString() ?? "";
    const rejectedBy = form.get("rejectedBy")?.toString() ?? "human-operator";
    const reason = form.get("reason")?.toString() ?? "Rejected by reviewer";
    const result = await rejectExecution(env.apiBaseUrl, approvalRequestId, rejectedBy, reason);
    if (result.ok) {
      response.writeHead(302, {
        location: `/workspace?status=success&result=rejected&approval=${approvalRequestId}`
      });
      response.end();
      return;
    }

    response.writeHead(302, { location: `/workspace?status=error&code=${result.errorCode ?? "UNKNOWN"}` });
    response.end();
    return;
  }

  if (pathname === "/applications/status" && request.method === "POST") {
    const form = await readFormBody(request);
    const applicationId = form.get("applicationId")?.toString() ?? "";
    const statusValue = form.get("status")?.toString() ?? "";
    const updatedBy = form.get("updatedBy")?.toString() ?? "human-operator";
    const reason = form.get("reason")?.toString() ?? "Status updated by operator";

    if (statusValue !== "interview" && statusValue !== "rejected") {
      response.writeHead(302, { location: "/workspace?status=error&code=INVALID_APPLICATION_STATUS" });
      response.end();
      return;
    }

    const result = await updateApplicationStatus(env.apiBaseUrl, applicationId, statusValue, updatedBy, reason);
    if (result.ok) {
      response.writeHead(302, {
        location: `/workspace?status=success&result=application-${statusValue}&application=${applicationId}`
      });
      response.end();
      return;
    }

    response.writeHead(302, { location: `/workspace?status=error&code=${result.errorCode ?? "UNKNOWN"}` });
    response.end();
    return;
  }

  if (pathname === "/") {
    const [apiHealth, dashboard] = await Promise.all([
      loadApiHealth(env.apiBaseUrl),
      loadDashboardData(env.apiBaseUrl, url.searchParams.toString())
    ]);
    sendHtml(
      response,
      200,
      renderDashboardPage({
        health: apiHealth,
        metrics: dashboard.metrics,
        jobs: dashboard.jobs,
        rankedJobs: dashboard.rankedJobs,
        approvals: dashboard.approvals,
        applications: dashboard.applications,
        decisions: dashboard.decisions,
        memoryEntries: dashboard.memoryEntries,
        apiBaseUrl: env.apiBaseUrl
      })
    );
    return;
  }

  if (pathname === "/guide") {
    const apiHealth = await loadApiHealth(env.apiBaseUrl);
    sendHtml(
      response,
      200,
      renderGuidePage({
        apiStatus: apiHealth.ok ? "ok" : "error",
        apiTime: apiHealth.ok ? apiHealth.data.uptimeMs : undefined
      })
    );
    return;
  }

  if (pathname === "/workspace") {
    const [apiHealth, dashboard] = await Promise.all([
      loadApiHealth(env.apiBaseUrl),
      loadDashboardData(env.apiBaseUrl)
    ]);

    const status = url.searchParams.get("status");
    const flash =
      status === "success"
        ? {
            kind: "success" as const,
            message: `Action ${url.searchParams.get("result") ?? "processed"} | score=${url.searchParams.get("score") ?? "n/a"} | approval=${url.searchParams.get("approval") ?? "n/a"} | application=${url.searchParams.get("application") ?? "n/a"}`
          }
        : status === "error"
          ? {
              kind: "error" as const,
              message: `Ingestion failed (${url.searchParams.get("code") ?? "UNKNOWN"})`
            }
          : undefined;

    sendHtml(
      response,
      200,
      renderWorkbenchPage(
        apiHealth,
        dashboard.jobs,
        dashboard.decisions,
        dashboard.approvals,
        dashboard.applications,
        dashboard.resumeProfiles,
        dashboard.cvSources,
        dashboard.memoryEntries,
        dashboard.metrics,
        env.apiBaseUrl,
        flash
      )
    );
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
