/**
 * Dashboard Page Renderer
 * Main entry point showing overview, metrics, and route index
 */

import type {
  ApiResult,
  HealthPayload,
  ListPayload,
  MetricsSnapshot,
  JobPosting,
  RankedJobPosting,
  ApprovalRequest,
  ApplicationRecord,
  DecisionLog,
  MemoryEntry
} from "@olympus/shared-types";
import { globalStyles, renderHeader, renderBreadcrumb, renderFooter } from "../../core/styles.js";

interface DashboardData {
  health: ApiResult<HealthPayload>;
  metrics: ApiResult<MetricsSnapshot>;
  jobs: ApiResult<ListPayload<JobPosting>>;
  rankedJobs: ApiResult<ListPayload<RankedJobPosting>>;
  approvals: ApiResult<ListPayload<ApprovalRequest>>;
  applications: ApiResult<ListPayload<ApplicationRecord>>;
  decisions: ApiResult<ListPayload<DecisionLog>>;
  memoryEntries: ApiResult<ListPayload<MemoryEntry>>;
  apiBaseUrl: string;
}

function renderDashboardCards(metrics: MetricsSnapshot): string {
  return `
    <div class="cards">
      <div class="card-stat">
        <span class="info-icon" data-tooltip="Total de job postings ingeridos">i</span>
        <strong>${metrics.totalJobPostings}</strong>
        <span>Job Postings</span>
      </div>
      <div class="card-stat">
        <span class="info-icon" data-tooltip="Perfis de candidatos criados">i</span>
        <strong>${metrics.totalResumeProfiles}</strong>
        <span>Resume Profiles</span>
      </div>
      <div class="card-stat">
        <span class="info-icon" data-tooltip="Aprovações aguardando gate humano">i</span>
        <strong>${metrics.pendingApprovals}</strong>
        <span>Approvals Pending</span>
      </div>
      <div class="card-stat">
        <span class="info-icon" data-tooltip="Aplicações enviadas para candidatos">i</span>
        <strong>${metrics.submittedApplications}</strong>
        <span>Applications</span>
      </div>
      <div class="card-stat">
        <span class="info-icon" data-tooltip="Decisões tomadas (aprovado/rejeitado)">i</span>
        <strong>${metrics.strategyProposals}</strong>
        <span>Decisions</span>
      </div>
      <div class="card-stat">
        <span class="info-icon" data-tooltip="Entradas no histórico de operações">i</span>
        <strong>-</strong>
        <span>Memory Entries</span>
      </div>
    </div>
  `;
}

function renderRouteTable(apiBaseUrl: string): string {
  const routes = [
    // Web Routes
    { method: "GET", route: "/", desc: "Dashboard (index)", category: "web" },
    { method: "GET", route: "/workspace", desc: "Workbench (operational)", category: "web" },
    { method: "GET", route: "/health", desc: "Health check", category: "web" },
    { method: "GET", route: "/guide", desc: "Como Usar (documentation)", category: "web" },
    { method: "POST", route: "/ingest", desc: "Ingest job posting", category: "web" },
    { method: "POST", route: "/resume-profiles", desc: "Create resume profile", category: "web" },
    { method: "POST", route: "/main-cv/analyze", desc: "Analyze main CV", category: "web" },
    { method: "POST", route: "/approve", desc: "Approve decision", category: "web" },
    { method: "POST", route: "/reject", desc: "Reject decision", category: "web" },
    { method: "POST", route: "/applications/status", desc: "Update application status", category: "web" },

    // API Routes
    { method: "GET", route: "/v1/health", desc: "API health", category: "api" },
    { method: "GET", route: "/v1/job-postings", desc: "List job postings", category: "api" },
    { method: "GET", route: "/v1/resume-profiles", desc: "List resume profiles", category: "api" },
    { method: "GET", route: "/v1/main-cv/sources", desc: "List CV sources", category: "api" },
    { method: "GET", route: "/v1/approval-queue", desc: "List pending approvals", category: "api" },
    { method: "GET", route: "/v1/applications", desc: "List applications", category: "api" },
    { method: "GET", route: "/v1/decision-logs", desc: "List decisions", category: "api" },
    { method: "GET", route: "/v1/memory-entries", desc: "List memory entries", category: "api" },
    { method: "GET", route: "/v1/metrics", desc: "Get metrics snapshot", category: "api" },
    { method: "GET", route: "/v1/jobs/ranked", desc: "Vagas ranqueadas por afinidade", category: "api" },
    { method: "POST", route: "/v1/scraper/run", desc: "Disparar scraping de vagas", category: "api" },
    { method: "POST", route: "/v1/job-postings/ingest", desc: "Ingest job (direct)", category: "api" },
    { method: "POST", route: "/v1/resume-profiles/create", desc: "Create profile (direct)", category: "api" },
    { method: "POST", route: "/v1/main-cv/analyze", desc: "Analyze CV (direct)", category: "api" },
    { method: "POST", route: "/v1/strategy/propose", desc: "Propose strategy", category: "api" },
    { method: "POST", route: "/v1/approval-queue/approve", desc: "Approve request", category: "api" },
    { method: "POST", route: "/v1/applications/update-status", desc: "Update app status", category: "api" },
  ];

  const webRoutes = routes.filter(r => r.category === "web");
  const apiRoutes = routes.filter(r => r.category === "api");

  const renderRoutes = (routeList: typeof routes) =>
    routeList
      .map(
        (r) => `<tr>
        <td><span style="background: ${r.method === "GET" ? "#e0e7ff" : "#fce7e6"}; padding: 0.2rem 0.5rem; border-radius: 3px; font-weight: 600; font-size: 0.85rem;">${r.method}</span></td>
        <td><code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">${r.category === "api" ? apiBaseUrl : ""}<strong>${r.route}</strong></code></td>
        <td>${r.desc}</td>
        <td>
          <a href="${r.category === "api" ? apiBaseUrl + r.route : r.route}" target="_blank" rel="noreferrer" style="color: #0066cc; text-decoration: none; font-size: 0.9rem;">
            Open ↗
          </a>
        </td>
      </tr>`
      )
      .join("");

  return `
    <h3>Web Routes</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Route</th><th>Description</th><th>Action</th></tr>
      </thead>
      <tbody>${renderRoutes(webRoutes)}</tbody>
    </table>

    <h3 style="margin-top: 1.5rem;">API Routes</h3>
    <table>
      <thead>
        <tr><th>Method</th><th>Route</th><th>Description</th><th>Action</th></tr>
      </thead>
      <tbody>${renderRoutes(apiRoutes)}</tbody>
    </table>
  `;
}

export function renderDashboardPage(data: DashboardData): string {
  const breadcrumbs = [{ label: "Dashboard" }];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - Olympus Climb</title>
  <style>${globalStyles}</style>
</head>
<body>
  <div class="page-container">
    ${renderHeader("Dashboard - Visão Geral", data.health.ok ? "ok" : "error", data.health.ok ? data.health.data.uptimeMs : undefined, "/")}
    ${renderBreadcrumb(breadcrumbs)}
    
    <main class="page-content">
      <div class="layout">
        <!-- Quick Actions -->
        <section class="panel">
          <h2>
            Quick Actions
            <span class="info-icon" data-tooltip="Atalhos para ações comuns">i</span>
          </h2>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <a href="/workspace" style="padding: 0.6rem 1rem; background: #0066cc; color: #fff; text-decoration: none; border-radius: 4px; display: inline-block;">→ Ir para Workspace</a>
            <form action="/v1/scraper/run" method="POST" target="_blank" style="margin: 0;">
              <button type="submit" style="padding: 0.6rem 1rem; background: #22c55e; color: #fff; text-decoration: none; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 600; display: inline-block;">🚀 Start Climbing (Run Scraper)</button>
            </form>
            <a href="/health" style="padding: 0.6rem 1rem; background: #f0f0f0; color: #333; text-decoration: none; border-radius: 4px; display: inline-block; border: 1px solid #ddd;">📊 Ver Health</a>
            <a href="/guide" style="padding: 0.6rem 1rem; background: #f0f0f0; color: #333; text-decoration: none; border-radius: 4px; display: inline-block; border: 1px solid #ddd;">📚 Como Usar</a>
          </div>
        </section>

        <!-- Metrics Overview -->
        <section class="panel">
          <h2>
            Overview
            <span class="info-icon" data-tooltip="Snapshot de métricas-chave da plataforma">i</span>
          </h2>
          ${data.metrics.ok ? renderDashboardCards(data.metrics.data) : '<p>Não foi possível carregar métricas.</p>'}
        </section>

        <!-- All Routes Table -->
        <section class="panel">
          <h2>
            All Routes
            <span class="info-icon" data-tooltip="Índice completo de rotas web e endpoints da API">i</span>
          </h2>
          <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
            Clique em "Open ↗" para acessar qualquer rota diretamente no navegador.
          </p>
          ${renderRouteTable(data.apiBaseUrl)}
        </section>

        <!-- Affinity Ranking -->
        <section class="panel">
          <h2>
            🎯 Vagas por Afinidade
            <span class="info-icon" data-tooltip="Vagas ranqueadas por overlap de skills com seu resume profile ativo">i</span>
          </h2>
          ${!data.rankedJobs.ok
            ? '<p style="color:#666;">Nenhuma vaga ranqueada ainda. Rode <code>POST /v1/scraper/run</code> e crie um resume profile.</p>'
            : data.rankedJobs.data.items.length === 0
              ? '<p style="color:#666;">Nenhuma vaga disponível. Rode o scraper primeiro.</p>'
              : `<div style="display:grid;gap:0.75rem;">
                  ${data.rankedJobs.data.items.slice(0, 15).map(job => {
                    const scoreColor = job.score >= 60 ? '#22c55e' : job.score >= 30 ? '#f59e0b' : '#94a3b8';
                    const scoreBg   = job.score >= 60 ? '#f0fdf4' : job.score >= 30 ? '#fffbeb' : '#f8fafc';
                    return `<div style="display:flex;align-items:center;gap:1rem;padding:0.75rem;background:${scoreBg};border-radius:6px;border-left:3px solid ${scoreColor};">
                      <div style="min-width:3.5rem;text-align:center;">
                        <strong style="font-size:1.1rem;color:${scoreColor};">${job.score}%</strong>
                      </div>
                      <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${job.title}</div>
                        <div style="font-size:0.82rem;color:#555;">${job.companyName} · ${job.location}</div>
                        ${job.matchedSkills.length > 0
                          ? `<div style="margin-top:0.25rem;">${job.matchedSkills.slice(0,5).map(s => `<span style="display:inline-block;background:#dbeafe;color:#1e40af;border-radius:3px;padding:0.1rem 0.4rem;font-size:0.75rem;margin:0.1rem;">${s}</span>`).join('')}</div>`
                          : ''}
                      </div>
                      <a href="${job.sourceUrl}" target="_blank" rel="noreferrer" style="font-size:0.85rem;color:#0066cc;text-decoration:none;white-space:nowrap;">Ver ↗</a>
                    </div>`;
                  }).join('')}
                </div>`
          }
        </section>

        <!-- Quick Stats -->
        <section class="panel">
          <h2>
            Detailed Status
            <span class="info-icon" data-tooltip="Estado detalhado de cada subsistema">i</span>
          </h2>
          <div style="display: grid; gap: 1rem;">
            <div>
              <h3 style="margin-top: 0; font-size: 1rem;">API Health</h3>
              ${data.health.ok
                ? `<p style="color: #22c55e; font-weight: 600;">✓ Online</p>
                   <small style="color: #666;">Status: ${data.health.data.status} • Uptime: ${data.health.data.uptimeMs}ms</small>`
                : `<p style="color: #ef4444; font-weight: 600;">✗ Offline</p>
                   <small style="color: #666;">Error: ${data.health.error.code}</small>`
              }
            </div>
            <div>
              <h3 style="margin-top: 0; font-size: 1rem;">Recent Activity</h3>
               <small style="color: #666;">
                Jobs: ${data.jobs.ok ? data.jobs.data.items.length : "?"} •
                Ranked: ${data.rankedJobs.ok ? data.rankedJobs.data.items.length : "?"} •
                Approvals: ${data.approvals.ok ? data.approvals.data.items.length : "?"} •
                Applications: ${data.applications.ok ? data.applications.data.items.length : "?"}
              </small>
            </div>
          </div>
        </section>

        <!-- Help -->
        <section class="panel" style="background: #e0e7ff; border-left: 4px solid #0066cc;">
          <h3 style="margin-top: 0; color: #0052a3;">💡 Dica</h3>
          <p style="margin: 0; color: #0052a3;">
            Novo por aqui? Comece em <a href="/guide" style="color: #0052a3; font-weight: 600; text-decoration: none;">Como Usar</a> para aprender sobre cada funcionalidade. Depois, vá para o <a href="/workspace" style="color: #0052a3; font-weight: 600; text-decoration: none;">Workspace</a> para começar a operar.
          </p>
        </section>
      </div>
    </main>

    ${renderFooter()}
  </div>
</body>
</html>
  `;
}
