import type {
  ApiResult,
  ApplicationRecord,
  ApprovalRequest,
  DecisionLog,
  HealthPayload,
  JobPosting,
  ListPayload,
  MemoryEntry,
  MetricsSnapshot
} from "@olympus/shared-types";

interface HomeFlash {
  kind: "success" | "error";
  message: string;
}

function renderJobs(items: JobPosting[]): string {
  if (items.length === 0) {
    return "<p>No job postings ingested yet.</p>";
  }

  const rows = items
    .slice(0, 8)
    .map(
      (job) => `<tr>
  <td>${job.id}</td>
  <td>${job.title}</td>
  <td>${job.companyName}</td>
  <td>${job.sourceName}</td>
  <td>${job.location ?? "-"}</td>
</tr>`
    )
    .join("");

  return `<table>
  <thead>
    <tr><th>ID</th><th>Title</th><th>Company</th><th>Source</th><th>Location</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

function renderDecisions(items: DecisionLog[]): string {
  if (items.length === 0) {
    return "<p>No decisions logged yet.</p>";
  }

  return `<ul>${items
    .slice(0, 6)
    .map((item) => `<li><strong>${item.summary}</strong> - ${item.rationale}</li>`)
    .join("")}</ul>`;
}

function renderApprovals(items: ApprovalRequest[]): string {
  if (items.length === 0) {
    return "<p>No pending approvals.</p>";
  }

  return `<table>
  <thead>
    <tr><th>ID</th><th>Job</th><th>Requested By</th><th>Reason</th><th>Action</th></tr>
  </thead>
  <tbody>${items
    .slice(0, 8)
    .map(
      (item) => `<tr>
  <td>${item.id}</td>
  <td>${item.jobPostingId}</td>
  <td>${item.requestedBy}</td>
  <td>${item.reason}</td>
  <td>
    <form method="POST" action="/approve">
      <input type="hidden" name="approvalRequestId" value="${item.id}" />
      <input name="approvedBy" value="human-operator" required />
      <button type="submit">Approve</button>
    </form>
  </td>
</tr>`
    )
    .join("")}</tbody>
</table>`;
}

function renderApplications(items: ApplicationRecord[]): string {
  if (items.length === 0) {
    return "<p>No submitted applications yet.</p>";
  }

  return `<table>
  <thead>
    <tr><th>ID</th><th>Job</th><th>Resume</th><th>Status</th><th>Submitted</th></tr>
  </thead>
  <tbody>${items
    .slice(0, 8)
    .map(
      (item) => `<tr>
  <td>${item.id}</td>
  <td>${item.jobPostingId}</td>
  <td>${item.resumeProfileId}</td>
  <td>${item.status}</td>
  <td>${item.submittedAt}</td>
</tr>`
    )
    .join("")}</tbody>
</table>`;
}

function renderMemory(items: MemoryEntry[]): string {
  if (items.length === 0) {
    return "<p>No memory entries yet.</p>";
  }

  return `<ul>${items
    .slice(0, 8)
    .map((item) => `<li><strong>${item.type}</strong> [${item.key}] - ${item.value}</li>`)
    .join("")}</ul>`;
}

function renderMetrics(metrics: MetricsSnapshot): string {
  return `<ul>
  <li>Total postings: ${metrics.totalJobPostings}</li>
  <li>Ingestion attempts: ${metrics.ingestionAttempts}</li>
  <li>Dedupe hits: ${metrics.dedupeHits}</li>
  <li>Dedupe rate: ${metrics.dedupeRate}</li>
  <li>Strategy proposals: ${metrics.strategyProposals}</li>
  <li>Pending approvals: ${metrics.pendingApprovals}</li>
  <li>Submitted applications: ${metrics.submittedApplications}</li>
</ul>`;
}

function renderFlash(flash?: HomeFlash): string {
  if (!flash) {
    return "";
  }
  const className = flash.kind === "success" ? "flash-success" : "flash-error";
  return `<div class="${className}">${flash.message}</div>`;
}

export function renderHomePage(
  apiHealth: ApiResult<HealthPayload>,
  jobs: ApiResult<ListPayload<JobPosting>>,
  decisions: ApiResult<ListPayload<DecisionLog>>,
  approvals: ApiResult<ListPayload<ApprovalRequest>>,
  applications: ApiResult<ListPayload<ApplicationRecord>>,
  memoryEntries: ApiResult<ListPayload<MemoryEntry>>,
  metrics: ApiResult<MetricsSnapshot>,
  flash?: HomeFlash
): string {
  const statusLine = apiHealth.ok
    ? `API status: ${apiHealth.data.status} (${apiHealth.data.uptimeMs}ms)`
    : `API status: error (${apiHealth.error.code})`;

  const jobsSection = jobs.ok ? renderJobs(jobs.data.items) : `<p>Could not load jobs (${jobs.error.code}).</p>`;
  const decisionsSection = decisions.ok
    ? renderDecisions(decisions.data.items)
    : `<p>Could not load decision logs (${decisions.error.code}).</p>`;
  const approvalsSection = approvals.ok
    ? renderApprovals(approvals.data.items)
    : `<p>Could not load approval queue (${approvals.error.code}).</p>`;
  const applicationsSection = applications.ok
    ? renderApplications(applications.data.items)
    : `<p>Could not load applications (${applications.error.code}).</p>`;
  const memorySection = memoryEntries.ok
    ? renderMemory(memoryEntries.data.items)
    : `<p>Could not load memory entries (${memoryEntries.error.code}).</p>`;
  const metricsSection = metrics.ok
    ? renderMetrics(metrics.data)
    : `<p>Could not load metrics (${metrics.error.code}).</p>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Olympus Climb</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 2rem; }
      .layout { display: grid; gap: 1rem; max-width: 1000px; }
      .panel { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; background: #fff; }
      code { background: #f4f4f4; padding: 0.125rem 0.375rem; border-radius: 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
      th, td { border-bottom: 1px solid #eee; text-align: left; padding: 0.5rem 0.25rem; vertical-align: top; }
      form { display: grid; gap: 0.5rem; }
      input, textarea { width: 100%; box-sizing: border-box; padding: 0.5rem; font: inherit; }
      button { width: fit-content; padding: 0.5rem 0.75rem; cursor: pointer; }
      .flash-success, .flash-error { padding: 0.6rem 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; }
      .flash-success { background: #e9f7ef; border: 1px solid #b7e4c7; color: #1b4332; }
      .flash-error { background: #fde8e8; border: 1px solid #f5c2c2; color: #7f1d1d; }
    </style>
  </head>
  <body>
    <main class="layout">
      <section class="panel">
        <h1>Olympus Climb</h1>
        <p>First functional slice: ingestion + dedupe + match + audit trace.</p>
        <p>${statusLine}</p>
        ${renderFlash(flash)}
      </section>

      <section class="panel">
        <h2>Ingest Job Posting</h2>
        <form method="POST" action="/ingest">
          <label>Title <input name="title" required /></label>
          <label>Company <input name="companyName" required /></label>
          <label>Source Name <input name="sourceName" value="manual" required /></label>
          <label>Source URL <input name="sourceUrl" placeholder="https://..." required /></label>
          <label>Location <input name="location" /></label>
          <label>Description <textarea name="description" rows="4" required></textarea></label>
          <label>Resume Headline <input name="resumeHeadline" value="Software Engineer" required /></label>
          <label>Resume Skills (comma separated) <input name="resumeSkills" value="node,typescript,api" required /></label>
          <button type="submit">Ingest + Score</button>
        </form>
      </section>

      <section class="panel">
        <h2>Recent Job Postings</h2>
        ${jobsSection}
      </section>

      <section class="panel">
        <h2>Recent Decisions</h2>
        ${decisionsSection}
      </section>

      <section class="panel">
        <h2>Approval Queue (Human Gate)</h2>
        ${approvalsSection}
      </section>

      <section class="panel">
        <h2>Submitted Applications</h2>
        ${applicationsSection}
      </section>

      <section class="panel">
        <h2>Memory Entries</h2>
        ${memorySection}
      </section>

      <section class="panel">
        <h2>Metrics Snapshot</h2>
        ${metricsSection}
      </section>

      <section class="panel">
        <p>Operational endpoints: <code>/v1/job-postings/ingest</code>, <code>/v1/strategy/propose</code>, <code>/v1/approval-queue/approve</code>, <code>/v1/memory-entries</code>, <code>/v1/metrics</code>.</p>
      </section>
    </main>
  </body>
</html>`;
}
