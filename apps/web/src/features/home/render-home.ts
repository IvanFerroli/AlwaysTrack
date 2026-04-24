import type {
  ApiResult,
  ApplicationRecord,
  ApprovalRequest,
  DecisionLog,
  HealthPayload,
  JobPosting,
  ListPayload,
  MainCvSource,
  MemoryEntry,
  MetricsSnapshot,
  ResumeProfile
} from "@olympus/shared-types";
import { globalStyles, renderHeader, renderBreadcrumb, renderFooter, renderFlash as renderFlashComponent } from "../../core/styles.js";

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

function renderResumeProfileOptions(items: ResumeProfile[]): string {
  if (items.length === 0) {
    return '<option value="">No profiles available</option>';
  }

  return items
    .map((item) => `<option value="${item.id}">${item.id} - ${item.headline} [${item.skills.join(", ")}]</option>`)
    .join("");
}

function renderCvSourceOptions(items: MainCvSource[]): string {
  if (items.length === 0) {
    return '<option value="">No .txt CV files found in doc/</option>';
  }

  return items
    .map((item) => `<option value="${item.fileName}">${item.fileName} (${item.sizeBytes} bytes)</option>`)
    .join("");
}

function renderRouteMenu(apiBaseUrl: string): string {
  const routes = [
    { label: "Web / (Dashboard)", href: "/" },
    { label: "Web /workspace", href: "/workspace" },
    { label: "Web /health", href: "/health" },
    { label: "API /health", href: `${apiBaseUrl}/health` },
    { label: "API /v1/job-postings", href: `${apiBaseUrl}/v1/job-postings` },
    { label: "API /v1/resume-profiles", href: `${apiBaseUrl}/v1/resume-profiles` },
    { label: "API /v1/main-cv/sources", href: `${apiBaseUrl}/v1/main-cv/sources` },
    { label: "API /v1/approval-queue", href: `${apiBaseUrl}/v1/approval-queue` },
    { label: "API /v1/applications", href: `${apiBaseUrl}/v1/applications` },
    { label: "API /v1/memory-entries", href: `${apiBaseUrl}/v1/memory-entries` },
    { label: "API /v1/metrics", href: `${apiBaseUrl}/v1/metrics` },
    { label: "API /v1/decision-logs", href: `${apiBaseUrl}/v1/decision-logs` },
    { label: "API /v1/skill-executions", href: `${apiBaseUrl}/v1/skill-executions` }
  ];

  return `<div class="route-grid">${routes
    .map((route) => `<a class="route-btn" href="${route.href}" target="_blank" rel="noreferrer">${route.label}</a>`)
    .join("")}</div>`;
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
    <form method="POST" action="/reject">
      <input type="hidden" name="approvalRequestId" value="${item.id}" />
      <input name="rejectedBy" value="human-operator" required />
      <input name="reason" value="Not aligned with current strategy" required />
      <button type="submit">Reject</button>
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
    <tr><th>ID</th><th>Job</th><th>Resume</th><th>Status</th><th>Submitted</th><th>Outcome</th><th>Action</th></tr>
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
  <td>${item.outcomeAt ? `${item.outcomeAt} by ${item.outcomeBy ?? "-"} (${item.outcomeReason ?? "-"})` : "-"}</td>
  <td>
    ${
      item.status === "submitted"
        ? `<form method="POST" action="/applications/status">
      <input type="hidden" name="applicationId" value="${item.id}" />
      <input type="hidden" name="status" value="interview" />
      <input name="updatedBy" value="human-operator" required />
      <input name="reason" value="Candidate selected for interview stage" required />
      <button type="submit">Mark Interview</button>
    </form>
    <form method="POST" action="/applications/status">
      <input type="hidden" name="applicationId" value="${item.id}" />
      <input type="hidden" name="status" value="rejected" />
      <input name="updatedBy" value="human-operator" required />
      <input name="reason" value="Rejected after screening" required />
      <button type="submit">Mark Rejected</button>
    </form>`
        : item.status === "interview"
          ? `<form method="POST" action="/applications/status">
      <input type="hidden" name="applicationId" value="${item.id}" />
      <input type="hidden" name="status" value="rejected" />
      <input name="updatedBy" value="human-operator" required />
      <input name="reason" value="Rejected after interview" required />
      <button type="submit">Close as Rejected</button>
    </form>`
          : "<span>Finalized</span>"
    }
  </td>
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
  <li>Total resume profiles: ${metrics.totalResumeProfiles}</li>
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
  const messageType = flash.kind === "success" ? "success" : "error";
  return renderFlashComponent([{ type: messageType, text: flash.message }]);
}

export function renderWorkbenchPage(
  apiHealth: ApiResult<HealthPayload>,
  jobs: ApiResult<ListPayload<JobPosting>>,
  decisions: ApiResult<ListPayload<DecisionLog>>,
  approvals: ApiResult<ListPayload<ApprovalRequest>>,
  applications: ApiResult<ListPayload<ApplicationRecord>>,
  resumeProfiles: ApiResult<ListPayload<ResumeProfile>>,
  cvSources: ApiResult<ListPayload<MainCvSource>>,
  memoryEntries: ApiResult<ListPayload<MemoryEntry>>,
  metrics: ApiResult<MetricsSnapshot>,
  apiBaseUrl: string,
  flash?: HomeFlash
): string {

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
  const profileOptions = resumeProfiles.ok ? renderResumeProfileOptions(resumeProfiles.data.items) : "";
  const cvSourceOptions = cvSources.ok ? renderCvSourceOptions(cvSources.data.items) : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Olympus Climb - Workbench</title>
    <style>${globalStyles}</style>
  </head>
  <body>
    <div class="page-container">
      ${renderHeader("Olympus Climb Workbench", apiHealth.ok ? "ok" : "error", apiHealth.ok ? apiHealth.data.uptimeMs : undefined, "/workspace")}
      ${renderBreadcrumb([
        { label: "Dashboard", href: "/" },
        { label: "Workspace" }
      ])}
      
      <main class="page-content">
        <div class="layout">
          <!-- Flash Messages -->
          ${renderFlash(flash)}

          <!-- Route Menu -->
          <section class="panel">
            <h2>
              Route Menu 
              <span class="info-icon" data-tooltip="Atalhos rápidos para inspecionar rotas web e endpoints da API">i</span>
            </h2>
            ${renderRouteMenu(apiBaseUrl)}
          </section>

          <!-- Ingest & Create Profile -->
          <section class="panel">
            <h2>
              Ingest Job Posting 
              <span class="info-icon" data-tooltip="Adicione uma nova oportunidade para análise e scoring">i</span>
            </h2>
            <form method="POST" action="/ingest">
              <label>
                Title
                <span class="info-icon" data-tooltip="Título da vaga (ex: Senior Software Engineer)">i</span>
                <input name="title" required />
              </label>
              <label>
                Company
                <span class="info-icon" data-tooltip="Nome da empresa">i</span>
                <input name="companyName" required />
              </label>
              <label>
                Source Name
                <span class="info-icon" data-tooltip="Origem (ex: LinkedIn, internal, etc)">i</span>
                <input name="sourceName" value="manual" required />
              </label>
              <label>
                Source URL
                <span class="info-icon" data-tooltip="Link para a vaga (https://...)">i</span>
                <input name="sourceUrl" placeholder="https://..." required />
              </label>
              <label>
                Location
                <span class="info-icon" data-tooltip="Local do trabalho (opcional)">i</span>
                <input name="location" />
              </label>
              <label>
                Description
                <span class="info-icon" data-tooltip="Descrição completa da vaga">i</span>
                <textarea name="description" rows="4" required></textarea>
              </label>
              <label>
                Resume Profile
                <span class="info-icon" data-tooltip="Perfil de candidato para matching">i</span>
                <select name="resumeProfileId" required>
                  ${profileOptions}
                </select>
              </label>
              <button type="submit" class="primary">✓ Ingest + Score</button>
            </form>

            <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #ddd;" />

            <h3>Create Resume Profile</h3>
            <form method="POST" action="/resume-profiles">
              <label>
                Headline
                <span class="info-icon" data-tooltip="Descrição do perfil (ex: Senior Node.js Developer)">i</span>
                <input name="headline" required />
              </label>
              <label>
                Skills (comma separated)
                <span class="info-icon" data-tooltip="Skills principais (ex: TypeScript, React, Node.js)">i</span>
                <input name="skills" value="node,typescript,api" required />
              </label>
              <button type="submit" class="primary">✓ Create Profile</button>
            </form>
          </section>

          <!-- Main CV Analyzer -->
          <section class="panel">
            <h2>
              Main CV Analyzer
              <span class="info-icon" data-tooltip="Analise seu CV principal contra oportunidades disponíveis">i</span>
            </h2>
            <p>Use seus arquivos em <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">doc/*.txt</code> para gerar um profile com skills extraídas e usar no matching.</p>
            <form method="POST" action="/main-cv/analyze">
              <label>
                CV text source (.txt)
                <span class="info-icon" data-tooltip="Selecione qual CV analisar">i</span>
                <select name="sourceFile" required>
                  ${cvSourceOptions}
                </select>
              </label>
              <label>
                Headline
                <span class="info-icon" data-tooltip="Nome descritivo para este profile">i</span>
                <input name="headline" value="Ivanilson Ferreira - Main CV" required />
              </label>
              <label>
                Extra skills (comma separated)
                <span class="info-icon" data-tooltip="Skills adicionais não mencionadas no CV">i</span>
                <textarea name="extraSkills" rows="3" placeholder="ex: playwright,cypress,redis"></textarea>
              </label>
              <button type="submit" class="primary">✓ Analyze Main CV + Create Profile</button>
            </form>
          </section>

          <!-- Recent Job Postings -->
          <section class="panel">
            <h2>
              Recent Job Postings
              <span class="info-icon" data-tooltip="Últimos jobs ingeridos com scores">i</span>
            </h2>
            ${jobsSection}
          </section>

          <!-- Recent Decisions -->
          <section class="panel">
            <h2>
              Recent Decisions
              <span class="info-icon" data-tooltip="Decisões tomadas em matching e approvals">i</span>
            </h2>
            ${decisionsSection}
          </section>

          <!-- Approval Queue -->
          <section class="panel">
            <h2>
              Approval Queue (Human Gate)
              <span class="info-icon" data-tooltip="Decisões aguardando aprovação manual">i</span>
            </h2>
            ${approvalsSection}
          </section>

          <!-- Submitted Applications -->
          <section class="panel">
            <h2>
              Submitted Applications
              <span class="info-icon" data-tooltip="Status das aplicações enviadas (submitted → interview → rejected)">i</span>
            </h2>
            ${applicationsSection}
          </section>

          <!-- Memory Entries -->
          <section class="panel">
            <h2>
              Memory Entries
              <span class="info-icon" data-tooltip="Histórico de operações e contexto da plataforma">i</span>
            </h2>
            ${memorySection}
          </section>

          <!-- Metrics Snapshot -->
          <section class="panel">
            <h2>
              Metrics Snapshot
              <span class="info-icon" data-tooltip="KPIs e métricas em tempo real">i</span>
            </h2>
            ${metricsSection}
          </section>

          <!-- Footer Info -->
          <section class="panel" style="background: #f9f9f9; border-top: 3px solid #0066cc;">
            <p style="font-size: 0.85rem; color: #666; margin: 0;">
              <strong>Operational endpoints:</strong> 
              <code style="background: #fff; padding: 0.25rem 0.5rem;">/v1/job-postings/ingest</code>,
              <code style="background: #fff; padding: 0.25rem 0.5rem;">/v1/main-cv/sources</code>,
              <code style="background: #fff; padding: 0.25rem 0.5rem;">/v1/main-cv/analyze</code>,
              <code style="background: #fff; padding: 0.25rem 0.5rem;">/v1/strategy/propose</code>,
              <code style="background: #fff; padding: 0.25rem 0.5rem;">/v1/approval-queue/approve</code>.
            </p>
          </section>
        </div>
      </main>

      ${renderFooter()}
    </div>
  </body>
</html>`;
}
