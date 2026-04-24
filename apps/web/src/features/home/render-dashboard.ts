import type { ApiResult, HealthPayload } from "@olympus/shared-types";
import type { DashboardData } from "../dashboard/load-dashboard.js";

interface RouteEntry {
  method: "GET" | "POST";
  route: string;
  target: "web" | "api";
  href?: string;
  usageHint?: string;
}

function renderHealthLine(apiHealth: ApiResult<HealthPayload>): string {
  if (apiHealth.ok) {
    return `API status: ${apiHealth.data.status} (${apiHealth.data.uptimeMs}ms)`;
  }
  return `API status: error (${apiHealth.error.code})`;
}

function renderRoutesTable(routes: RouteEntry[]): string {
  return `<table>
  <thead>
    <tr><th>Method</th><th>Target</th><th>Route</th><th>Access</th></tr>
  </thead>
  <tbody>${routes
    .map((route) => `<tr>
  <td><code>${route.method}</code></td>
  <td>${route.target.toUpperCase()}</td>
  <td><code>${route.route}</code></td>
  <td>${
    route.href
      ? `<a href="${route.href}" target="_blank" rel="noreferrer">Open</a>`
      : route.usageHint ?? "-"
  }</td>
</tr>`)
    .join("")}</tbody>
</table>`;
}

export function renderDashboardPage(
  apiHealth: ApiResult<HealthPayload>,
  dashboard: DashboardData,
  apiBaseUrl: string
): string {
  const metrics = dashboard.metrics.ok ? dashboard.metrics.data : null;
  const routes: RouteEntry[] = [
    { method: "GET", target: "web", route: "/", href: "/" },
    { method: "GET", target: "web", route: "/workspace", href: "/workspace" },
    { method: "GET", target: "web", route: "/health", href: "/health" },
    { method: "POST", target: "web", route: "/ingest", usageHint: "Use form in /workspace" },
    { method: "POST", target: "web", route: "/resume-profiles", usageHint: "Use form in /workspace" },
    { method: "POST", target: "web", route: "/main-cv/analyze", usageHint: "Use form in /workspace" },
    { method: "POST", target: "web", route: "/approve", usageHint: "Use form in /workspace" },
    { method: "POST", target: "web", route: "/reject", usageHint: "Use form in /workspace" },
    { method: "POST", target: "web", route: "/applications/status", usageHint: "Use form in /workspace" },
    { method: "GET", target: "api", route: "/health", href: `${apiBaseUrl}/health` },
    { method: "GET", target: "api", route: "/ping", href: `${apiBaseUrl}/ping` },
    { method: "GET", target: "api", route: "/v1/job-postings", href: `${apiBaseUrl}/v1/job-postings` },
    { method: "POST", target: "api", route: "/v1/job-postings/ingest", usageHint: "Use payload JSON" },
    { method: "GET", target: "api", route: "/v1/resume-profiles", href: `${apiBaseUrl}/v1/resume-profiles` },
    { method: "POST", target: "api", route: "/v1/resume-profiles", usageHint: "Use payload JSON" },
    {
      method: "GET",
      target: "api",
      route: "/v1/resume-profiles/get?id=<id>",
      href: `${apiBaseUrl}/v1/resume-profiles/get?id=resume-000001`
    },
    { method: "GET", target: "api", route: "/v1/main-cv/sources", href: `${apiBaseUrl}/v1/main-cv/sources` },
    { method: "POST", target: "api", route: "/v1/main-cv/analyze", usageHint: "Use payload JSON" },
    { method: "POST", target: "api", route: "/v1/match/score", usageHint: "Use payload JSON" },
    { method: "POST", target: "api", route: "/v1/strategy/propose", usageHint: "Use payload JSON" },
    { method: "GET", target: "api", route: "/v1/approval-queue", href: `${apiBaseUrl}/v1/approval-queue` },
    { method: "POST", target: "api", route: "/v1/approval-queue/approve", usageHint: "Use payload JSON" },
    { method: "POST", target: "api", route: "/v1/approval-queue/reject", usageHint: "Use payload JSON" },
    { method: "GET", target: "api", route: "/v1/applications", href: `${apiBaseUrl}/v1/applications` },
    { method: "POST", target: "api", route: "/v1/applications/update-status", usageHint: "Use payload JSON" },
    { method: "GET", target: "api", route: "/v1/memory-entries", href: `${apiBaseUrl}/v1/memory-entries` },
    { method: "GET", target: "api", route: "/v1/metrics", href: `${apiBaseUrl}/v1/metrics` },
    { method: "GET", target: "api", route: "/v1/agent-runs", href: `${apiBaseUrl}/v1/agent-runs` },
    { method: "GET", target: "api", route: "/v1/decision-logs", href: `${apiBaseUrl}/v1/decision-logs` },
    { method: "GET", target: "api", route: "/v1/skill-executions", href: `${apiBaseUrl}/v1/skill-executions` }
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Olympus Climb - Dashboard</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 2rem; }
      .layout { display: grid; gap: 1rem; max-width: 1100px; }
      .panel { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; background: #fff; }
      .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
      .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.75rem; background: #f8fafc; }
      .card b { display: block; font-size: 1.2rem; margin-top: 0.25rem; }
      table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
      th, td { border-bottom: 1px solid #eee; text-align: left; padding: 0.5rem 0.25rem; vertical-align: top; }
      .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .btn { display: inline-block; border: 1px solid #d1d5db; border-radius: 6px; padding: 0.45rem 0.6rem; text-decoration: none; color: #111827; background: #f8fafc; }
    </style>
  </head>
  <body>
    <main class="layout">
      <section class="panel">
        <h1>Olympus Climb Dashboard</h1>
        <p>${renderHealthLine(apiHealth)}</p>
        <div class="actions">
          <a class="btn" href="/workspace">Open Workbench (/workspace)</a>
          <a class="btn" href="${apiBaseUrl}/v1/metrics" target="_blank" rel="noreferrer">Open Metrics (API)</a>
        </div>
      </section>

      <section class="panel">
        <h2>Snapshot</h2>
        <div class="cards">
          <div class="card">Job postings<b>${metrics?.totalJobPostings ?? "-"}</b></div>
          <div class="card">Resume profiles<b>${metrics?.totalResumeProfiles ?? "-"}</b></div>
          <div class="card">Pending approvals<b>${metrics?.pendingApprovals ?? "-"}</b></div>
          <div class="card">Submitted apps<b>${metrics?.submittedApplications ?? "-"}</b></div>
          <div class="card">Decision logs<b>${dashboard.decisions.ok ? dashboard.decisions.data.items.length : "-"}</b></div>
          <div class="card">Memory entries<b>${dashboard.memoryEntries.ok ? dashboard.memoryEntries.data.items.length : "-"}</b></div>
        </div>
      </section>

      <section class="panel">
        <h2>All Routes</h2>
        <p>GET routes can be opened directly. POST routes are executed via forms in <code>/workspace</code> or JSON payload.</p>
        ${renderRoutesTable(routes)}
      </section>
    </main>
  </body>
</html>`;
}
