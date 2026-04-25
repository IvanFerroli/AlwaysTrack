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
import {
  escapeAttr,
  escapeHtml,
  headAssets,
  jsonForHtml,
  renderBreadcrumb,
  renderFlash as renderFlashComponent,
  renderFooter,
  renderHeader,
  renderInfoIcon
} from "../../core/styles.js";

interface HomeFlash {
  kind: "success" | "error";
  message: string;
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 12)}...` : id;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function renderJobs(items: JobPosting[]): string {
  if (items.length === 0) {
    return `<p class="empty">No job postings ingested yet.</p>`;
  }

  const rows = items
    .slice(0, 10)
    .map(
      (job) => `<tr>
        <td class="mono">${escapeHtml(shortId(job.id))}</td>
        <td>${escapeHtml(job.title)}</td>
        <td>${escapeHtml(job.companyName)}</td>
        <td><span class="badge brand">${escapeHtml(job.sourceName)}</span></td>
        <td>${escapeHtml(job.location ?? "-")}</td>
        <td><span class="badge">${escapeHtml(job.userStatus)}</span></td>
      </tr>`
    )
    .join("");

  return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Company</th><th>Source</th><th>Location</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderResumeProfileOptions(items: ResumeProfile[]): string {
  if (items.length === 0) {
    return '<option value="">No profiles available</option>';
  }

  return items
    .map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.id)} - ${escapeHtml(item.headline)}</option>`)
    .join("");
}

function renderProfileManager(items: ResumeProfile[]): string {
  if (items.length === 0) return `<p class="empty">No profiles found.</p>`;

  return `<div class="stack">${items
    .map(
      (profile) => `<article class="metric-card">
        <div class="section-header">
          <div>
            <h3>${escapeHtml(profile.headline)}</h3>
            <p class="subtle mono">ID: ${escapeHtml(profile.id)}</p>
          </div>
          <button class="btn-secondary btn-small" type="button" onclick='document.getElementById("edit-profile-${escapeAttr(profile.id)}")?.classList.toggle("visible")'>Editar</button>
        </div>
        <div class="chip-row">${profile.skills.map((skill) => `<span class="badge brand">${escapeHtml(skill)}</span>`).join("")}</div>
        <div id="edit-profile-${escapeAttr(profile.id)}" class="deep-score-box">
          <form class="form-grid" onsubmit='event.preventDefault(); updateProfile(${jsonForHtml(profile.id)}, this.headline.value, this.skills.value)'>
            <label><span class="label-row">Headline</span><input name="headline" value="${escapeAttr(profile.headline)}" required /></label>
            <label><span class="label-row">Skills</span><textarea name="skills" rows="3" required>${escapeHtml(profile.skills.join(", "))}</textarea></label>
            <div class="actions-row">
              <button type="submit" class="btn-primary">Salvar</button>
              <button type="button" class="btn-secondary" onclick='document.getElementById("edit-profile-${escapeAttr(profile.id)}")?.classList.remove("visible")'>Cancelar</button>
            </div>
          </form>
        </div>
      </article>`
    )
    .join("")}</div>`;
}

function renderCvSourceOptions(items: MainCvSource[]): string {
  if (items.length === 0) {
    return '<option value="">No .txt CV files found in doc/</option>';
  }

  return items
    .map((item) => `<option value="${escapeAttr(item.fileName)}">${escapeHtml(item.fileName)} (${escapeHtml(item.sizeBytes)} bytes)</option>`)
    .join("");
}

function renderDecisions(items: DecisionLog[]): string {
  if (items.length === 0) {
    return `<p class="empty">No decisions logged yet.</p>`;
  }

  return `<div class="stack">${items
    .slice(0, 8)
    .map(
      (item) => `<article class="metric-card">
        <strong>${escapeHtml(item.summary)}</strong>
        <p class="subtle">${escapeHtml(item.rationale)}</p>
        <span class="mono muted">${escapeHtml(formatDate(item.createdAt))}</span>
      </article>`
    )
    .join("")}</div>`;
}

function renderApprovals(items: ApprovalRequest[]): string {
  if (items.length === 0) {
    return `<p class="empty">No pending approvals.</p>`;
  }

  const rows = items
    .slice(0, 10)
    .map(
      (item) => `<tr>
        <td class="mono">${escapeHtml(shortId(item.id))}</td>
        <td class="mono">${escapeHtml(shortId(item.jobPostingId))}</td>
        <td>${escapeHtml(item.requestedBy)}</td>
        <td>${escapeHtml(item.reason)}</td>
        <td>
          <div class="stack">
            <form method="POST" action="/approve" class="actions-row">
              <input type="hidden" name="approvalRequestId" value="${escapeAttr(item.id)}" />
              <input class="tag-input" name="approvedBy" value="human-operator" required />
              <button type="submit" class="btn-primary btn-small">Approve</button>
            </form>
            <form method="POST" action="/reject" class="actions-row">
              <input type="hidden" name="approvalRequestId" value="${escapeAttr(item.id)}" />
              <input class="tag-input" name="rejectedBy" value="human-operator" required />
              <input class="tag-input" name="reason" value="Not aligned" required />
              <button type="submit" class="btn-danger btn-small">Reject</button>
            </form>
          </div>
        </td>
      </tr>`
    )
    .join("");

  return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Job</th><th>Requested By</th><th>Reason</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderApplications(items: ApplicationRecord[]): string {
  if (items.length === 0) {
    return `<p class="empty">No submitted applications yet.</p>`;
  }

  const rows = items
    .slice(0, 10)
    .map((item) => {
      const statusClass = item.status === "interview" ? "ok" : item.status === "rejected" ? "danger" : "brand";
      const actions = item.status === "rejected"
        ? `<span class="badge">Finalized</span>`
        : `<form method="POST" action="/applications/status" class="actions-row">
            <input type="hidden" name="applicationId" value="${escapeAttr(item.id)}" />
            <select class="tag-input" name="status"><option value="interview">interview</option><option value="rejected">rejected</option></select>
            <input class="tag-input" name="updatedBy" value="human-operator" required />
            <input class="tag-input" name="reason" value="Status updated" required />
            <button type="submit" class="btn-primary btn-small">Update</button>
          </form>`;

      return `<tr>
        <td class="mono">${escapeHtml(shortId(item.id))}</td>
        <td class="mono">${escapeHtml(shortId(item.jobPostingId))}</td>
        <td class="mono">${escapeHtml(shortId(item.resumeProfileId))}</td>
        <td><span class="badge ${statusClass}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(formatDate(item.submittedAt))}</td>
        <td>${escapeHtml(item.outcomeReason ?? "-")}</td>
        <td>${actions}</td>
      </tr>`;
    })
    .join("");

  return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Job</th><th>Resume</th><th>Status</th><th>Submitted</th><th>Outcome</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderMemory(items: MemoryEntry[]): string {
  if (items.length === 0) {
    return `<p class="empty">No memory entries yet.</p>`;
  }

  return `<div class="stack">${items
    .slice(0, 10)
    .map(
      (item) => `<article class="metric-card">
        <div class="actions-row"><span class="badge brand">${escapeHtml(item.type)}</span><span class="mono muted">${escapeHtml(item.key)}</span></div>
        <p class="subtle">${escapeHtml(item.value)}</p>
        <div class="chip-row">${item.tags.map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}</div>
      </article>`
    )
    .join("")}</div>`;
}

function renderMetrics(metrics: MetricsSnapshot): string {
  const rows = [
    ["Total postings", metrics.totalJobPostings],
    ["Total resume profiles", metrics.totalResumeProfiles],
    ["Ingestion attempts", metrics.ingestionAttempts],
    ["Dedupe hits", metrics.dedupeHits],
    ["Dedupe rate", metrics.dedupeRate],
    ["Strategy proposals", metrics.strategyProposals],
    ["Pending approvals", metrics.pendingApprovals],
    ["Applications", metrics.submittedApplications]
  ] as const;

  return `<div class="cards">${rows.map(([label, value]) => `<div class="metric-card"><span class="metric-label">${escapeHtml(label)}</span><strong class="metric-value">${escapeHtml(value)}</strong></div>`).join("")}</div>`;
}

function renderFlash(flash?: HomeFlash): string {
  if (!flash) return "";
  return renderFlashComponent([{ type: flash.kind === "success" ? "success" : "error", text: flash.message }]);
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
  const jobsSection = jobs.ok ? renderJobs(jobs.data.items) : `<p class="empty">Could not load jobs (${escapeHtml(jobs.error.code)}).</p>`;
  const decisionsSection = decisions.ok ? renderDecisions(decisions.data.items) : `<p class="empty">Could not load decision logs (${escapeHtml(decisions.error.code)}).</p>`;
  const approvalsSection = approvals.ok ? renderApprovals(approvals.data.items) : `<p class="empty">Could not load approval queue (${escapeHtml(approvals.error.code)}).</p>`;
  const applicationsSection = applications.ok ? renderApplications(applications.data.items) : `<p class="empty">Could not load applications (${escapeHtml(applications.error.code)}).</p>`;
  const memorySection = memoryEntries.ok ? renderMemory(memoryEntries.data.items) : `<p class="empty">Could not load memory entries (${escapeHtml(memoryEntries.error.code)}).</p>`;
  const metricsSection = metrics.ok ? renderMetrics(metrics.data) : `<p class="empty">Could not load metrics (${escapeHtml(metrics.error.code)}).</p>`;
  const profileOptions = resumeProfiles.ok ? renderResumeProfileOptions(resumeProfiles.data.items) : "";
  const profileManager = resumeProfiles.ok ? renderProfileManager(resumeProfiles.data.items) : `<p class="empty">Could not load profiles.</p>`;
  const cvSourceOptions = cvSources.ok ? renderCvSourceOptions(cvSources.data.items) : "";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Olympus Climb - Workspace</title>
    ${headAssets}
  </head>
  <body>
    <div class="page-container">
      ${renderHeader("Workspace operacional", apiHealth.ok ? "ok" : "error", apiHealth.ok ? apiHealth.data.uptimeMs : undefined, "/workspace")}
      ${renderBreadcrumb([{ label: "Dashboard", href: "/" }, { label: "Workspace" }])}
      ${renderFlash(flash)}
      <main class="page-content">
        <div class="layout">
          <section class="panel">
            <div class="section-header">
              <div><h2>Ingest Job Posting</h2><p class="subtle">Adiciona uma vaga manual, calcula score e pode abrir uma aprovação.</p></div>
              ${renderInfoIcon("Use para testar uma oportunidade específica sem depender do scraper")}
            </div>
            <form method="POST" action="/ingest" class="form-grid two">
              <label><span class="label-row">Title ${renderInfoIcon("Título da vaga")}</span><input name="title" required /></label>
              <label><span class="label-row">Company ${renderInfoIcon("Empresa anunciante")}</span><input name="companyName" required /></label>
              <label><span class="label-row">Source Name ${renderInfoIcon("Origem, ex: manual, LinkedIn")}</span><input name="sourceName" value="manual" required /></label>
              <label><span class="label-row">Source URL ${renderInfoIcon("URL original da vaga")}</span><input name="sourceUrl" type="url" placeholder="https://..." pattern="https?://.+" required /></label>
              <label><span class="label-row">Location ${renderInfoIcon("Local ou remoto")}</span><input name="location" /></label>
              <label><span class="label-row">Resume Profile ${renderInfoIcon("Profile usado para matching")}</span><select name="resumeProfileId" required>${profileOptions}</select></label>
              <label style="grid-column: 1 / -1;"><span class="label-row">Description ${renderInfoIcon("Texto usado para tokenização e score")}</span><textarea name="description" rows="5" required></textarea></label>
              <div class="actions-row"><button type="submit" class="btn-primary">Ingest + Score</button><a class="btn-secondary" href="/">Ver ranking</a></div>
            </form>
          </section>

          <section class="split-grid">
            <section class="panel">
              <div class="section-header"><div><h2>Create Profile</h2><p class="subtle">Crie um profile manual de skills.</p></div>${renderInfoIcon("Skills separadas por vírgula")}</div>
              <form method="POST" action="/resume-profiles" class="form-grid">
                <label>Headline<input name="headline" required /></label>
                <label>Skills<input name="skills" value="node,typescript,api" required /></label>
                <button type="submit" class="btn-primary">Create Resume Profile</button>
              </form>
            </section>
            <section class="panel">
              <div class="section-header"><div><h2>Main CV Analyzer</h2><p class="subtle">Lê arquivos .txt em doc/ e cria profile.</p></div>${renderInfoIcon("Com GEMINI_API_KEY usa extração por LLM; sem key usa parser local")}</div>
              <form method="POST" action="/main-cv/analyze" class="form-grid">
                <label>CV text source<select name="sourceFile" required>${cvSourceOptions}</select></label>
                <label>Headline<input name="headline" value="Ivanilson Ferreira - Main CV" required /></label>
                <label>Extra skills<textarea name="extraSkills" rows="3" placeholder="playwright,cypress,redis"></textarea></label>
                <button type="submit" class="btn-primary">Analyze & Create Profile</button>
              </form>
            </section>
          </section>

          <section class="panel">
            <div class="section-header"><div><h2>Resume Profiles Manager</h2><p class="subtle">Editar skills aqui muda o próximo score/ranking.</p></div>${renderInfoIcon("Estado em memória; reiniciar API reseta profiles não persistidos")}</div>
            ${profileManager}
          </section>

          <details class="panel" open><summary><div class="panel-heading"><h2>Recent Job Postings</h2>${renderInfoIcon("Últimas vagas em memória")}</div></summary><div class="details-body">${jobsSection}</div></details>
          <details class="panel"><summary><div class="panel-heading"><h2>Approval Queue</h2>${renderInfoIcon("Ações aguardando gate humano")}</div></summary><div class="details-body">${approvalsSection}</div></details>
          <details class="panel"><summary><div class="panel-heading"><h2>Submitted Applications</h2>${renderInfoIcon("Aplicações e status pós-envio")}</div></summary><div class="details-body">${applicationsSection}</div></details>
          <details class="panel"><summary><div class="panel-heading"><h2>Recent Decisions</h2>${renderInfoIcon("Decisões registradas pelos serviços")}</div></summary><div class="details-body">${decisionsSection}</div></details>
          <details class="panel"><summary><div class="panel-heading"><h2>Memory Entries</h2>${renderInfoIcon("Memória runtime de aprovações/aplicações")}</div></summary><div class="details-body">${memorySection}</div></details>
          <details class="panel"><summary><div class="panel-heading"><h2>Metrics Snapshot</h2>${renderInfoIcon("Métricas expostas pela API")}</div></summary><div class="details-body">${metricsSection}</div></details>
        </div>
      </main>
      ${renderFooter()}
    </div>
    <script>
      async function updateProfile(id, headline, skillsStr) {
        try {
          const skills = skillsStr.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
          const res = await fetch(${jsonForHtml(apiBaseUrl + "/v1/resume-profiles/update")}, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, headline, skills })
          });
          const json = await res.json();
          if (json.ok) window.location.href = "/workspace?status=success&result=profile-updated";
          else alert("Failed to update profile: " + (json.error?.message || "unknown"));
        } catch (error) {
          alert("Network error: " + error);
        }
      }
    </script>
  </body>
</html>`;
}
