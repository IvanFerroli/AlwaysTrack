/**
 * Dashboard Page Renderer
 * Main entry point showing overview, route index, and ranked jobs.
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
import {
  escapeAttr,
  escapeHtml,
  headAssets,
  jsonForHtml,
  renderBreadcrumb,
  renderFooter,
  renderHeader,
  renderInfoIcon
} from "../../core/styles.js";

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

interface RouteInfo {
  method: "GET" | "POST";
  route: string;
  desc: string;
  category: "web" | "api";
  openable?: boolean;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function renderDashboardCards(metrics: MetricsSnapshot, memoryCount: number): string {
  const cards = [
    ["Job Postings", metrics.totalJobPostings, "Total de vagas ingeridas"],
    ["Profiles", metrics.totalResumeProfiles, "Perfis de currículo disponíveis"],
    ["Approvals", metrics.pendingApprovals, "Aprovações aguardando gate humano"],
    ["Applications", metrics.submittedApplications, "Aplicações registradas"],
    ["Decisions", metrics.strategyProposals, "Propostas de estratégia computadas"],
    ["Memory", memoryCount, "Entradas de memória operacional"]
  ] as const;

  return `<div class="cards">${cards
    .map(
      ([label, value, tooltip]) => `<div class="metric-card">
        <div class="metric-label"><span>${escapeHtml(label)}</span>${renderInfoIcon(tooltip)}</div>
        <strong class="metric-value">${escapeHtml(value)}</strong>
      </div>`
    )
    .join("")}</div>`;
}

function renderRouteTable(apiBaseUrl: string): string {
  const routes: RouteInfo[] = [
    { method: "GET", route: "/", desc: "Dashboard, rotas e vagas ranqueadas", category: "web", openable: true },
    { method: "GET", route: "/workspace", desc: "Workbench operacional", category: "web", openable: true },
    { method: "GET", route: "/guide", desc: "Guia de uso atual", category: "web", openable: true },
    { method: "GET", route: "/health", desc: "Health do servidor web + API", category: "web", openable: true },
    { method: "POST", route: "/ingest", desc: "Form action: ingerir vaga manual", category: "web" },
    { method: "POST", route: "/resume-profiles", desc: "Form action: criar resume profile", category: "web" },
    { method: "POST", route: "/main-cv/analyze", desc: "Form action: analisar CV .txt", category: "web" },
    { method: "POST", route: "/approve", desc: "Form action: aprovar candidatura", category: "web" },
    { method: "POST", route: "/reject", desc: "Form action: rejeitar aprovação", category: "web" },
    { method: "POST", route: "/applications/status", desc: "Form action: atualizar status de aplicação", category: "web" },
    { method: "GET", route: "/health", desc: "API health", category: "api", openable: true },
    { method: "GET", route: "/ping", desc: "API ping", category: "api", openable: true },
    { method: "GET", route: "/v1/job-postings", desc: "Listar vagas", category: "api", openable: true },
    { method: "GET", route: "/v1/jobs/ranked", desc: "Listar vagas ranqueadas/filtros", category: "api", openable: true },
    { method: "GET", route: "/v1/resume-profiles", desc: "Listar resume profiles", category: "api", openable: true },
    { method: "GET", route: "/v1/main-cv/sources", desc: "Listar arquivos .txt em doc/", category: "api", openable: true },
    { method: "GET", route: "/v1/approval-queue", desc: "Listar aprovações pendentes", category: "api", openable: true },
    { method: "GET", route: "/v1/applications", desc: "Listar aplicações", category: "api", openable: true },
    { method: "GET", route: "/v1/memory-entries", desc: "Listar memória runtime", category: "api", openable: true },
    { method: "GET", route: "/v1/metrics", desc: "Snapshot de métricas", category: "api", openable: true },
    { method: "GET", route: "/v1/agent-runs", desc: "Runs de agentes internos", category: "api", openable: true },
    { method: "GET", route: "/v1/decision-logs", desc: "Logs de decisão", category: "api", openable: true },
    { method: "GET", route: "/v1/skill-executions", desc: "Execuções e evidências", category: "api", openable: true },
    { method: "POST", route: "/v1/scraper/run", desc: "Executar scraper (?source=, ?keyword=)", category: "api" },
    { method: "POST", route: "/v1/job-postings/ingest", desc: "Ingest direto JSON", category: "api" },
    { method: "POST", route: "/v1/jobs/update", desc: "Atualizar status/tags da vaga", category: "api" },
    { method: "POST", route: "/v1/resume-profiles", desc: "Criar profile direto JSON", category: "api" },
    { method: "POST", route: "/v1/resume-profiles/update", desc: "Atualizar profile", category: "api" },
    { method: "POST", route: "/v1/main-cv/analyze", desc: "Analisar CV direto JSON", category: "api" },
    { method: "POST", route: "/v1/match/score", desc: "Score por overlap de skills", category: "api" },
    { method: "POST", route: "/v1/match/deep-score", desc: "Deep Score com Gemini", category: "api" },
    { method: "POST", route: "/v1/strategy/propose", desc: "Propor candidatura com gate", category: "api" },
    { method: "POST", route: "/v1/approval-queue/approve", desc: "Aprovar request", category: "api" },
    { method: "POST", route: "/v1/approval-queue/reject", desc: "Rejeitar request", category: "api" },
    { method: "POST", route: "/v1/applications/update-status", desc: "Atualizar status da aplicação", category: "api" }
  ];

  const renderRows = (category: "web" | "api") => routes
    .filter((route) => route.category === category)
    .map((route) => {
      const href = route.category === "api" ? `${apiBaseUrl}${route.route}` : route.route;
      return `<tr>
        <td><span class="badge ${route.method === "GET" ? "brand" : "warn"}">${route.method}</span></td>
        <td><code>${escapeHtml(route.category === "api" ? `${apiBaseUrl}${route.route}` : route.route)}</code></td>
        <td>${escapeHtml(route.desc)}</td>
        <td>${route.openable ? `<a class="route-btn" href="${escapeAttr(href)}" target="_blank" rel="noreferrer">Abrir</a>` : `<span class="badge">POST via form/fetch</span>`}</td>
      </tr>`;
    })
    .join("");

  return `<div class="split-grid">
    <section class="panel tight">
      <div class="details-body">
        <div class="panel-heading"><h3>Web Routes</h3>${renderInfoIcon("Rotas servidas pelo app web")}</div>
        <div class="table-wrap"><table><thead><tr><th>Método</th><th>Rota</th><th>Descrição</th><th>Ação</th></tr></thead><tbody>${renderRows("web")}</tbody></table></div>
      </div>
    </section>
    <section class="panel tight">
      <div class="details-body">
        <div class="panel-heading"><h3>API Routes</h3>${renderInfoIcon("Endpoints servidos pela API em API_BASE_URL")}</div>
        <div class="table-wrap"><table><thead><tr><th>Método</th><th>Rota</th><th>Descrição</th><th>Ação</th></tr></thead><tbody>${renderRows("api")}</tbody></table></div>
      </div>
    </section>
  </div>`;
}

function renderRankedJobs(data: DashboardData): string {
  if (!data.rankedJobs.ok) {
    return `<p class="empty">Não foi possível carregar vagas ranqueadas (${escapeHtml(data.rankedJobs.error.code)}).</p>`;
  }

  if (data.rankedJobs.data.items.length === 0) {
    return `<p class="empty">Nenhuma vaga encontrada. Rode o scraper ou ajuste os filtros.</p>`;
  }

  return `<div class="job-list" id="jobs-container">${data.rankedJobs.data.items.map(renderRankedJobCard).join("")}</div>`;
}

function scoreBand(score: number): "high" | "mid" | "low" {
  if (score >= 60) return "high";
  if (score >= 30) return "mid";
  return "low";
}

function safeHttpHref(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function renderRankedJobCard(job: RankedJobPosting): string {
  const band = scoreBand(job.score);
  const statusClass = job.userStatus === "applied" ? "brand" : job.userStatus === "discarded" ? "danger" : "";
  const originalHref = safeHttpHref(job.sourceUrl);
  return `<article class="job-card ${band}">
    <div class="score-box"><span class="score-value ${band}">${escapeHtml(job.score)}%</span><span class="muted">match</span></div>
    <div>
      <div class="job-title">
        <span>${escapeHtml(job.title)}</span>
        <span class="badge ${statusClass}">${escapeHtml(job.userStatus)}</span>
      </div>
      <div class="job-meta">${escapeHtml(job.companyName)} - ${escapeHtml(job.location ?? "Remote")} - ${escapeHtml(job.sourceName)} - ${escapeHtml(formatDate(job.postedAt))}</div>
      ${job.matchedSkills.length > 0 ? `<div class="chip-row">${job.matchedSkills.slice(0, 8).map((skill) => `<span class="badge brand">${escapeHtml(skill)}</span>`).join("")}</div>` : ""}
      <div class="tag-control">
        ${job.tags.map((tag) => `<span class="badge">${escapeHtml(tag)} <button class="btn-small danger" onclick='window.updateJobTag(${jsonForHtml(job.id)}, null, ${jsonForHtml(tag)})' type="button">x</button></span>`).join("")}
        <input class="tag-input" id="tag-input-${escapeAttr(job.id)}" type="text" placeholder="nova tag" onkeydown='if(event.key === "Enter") { event.preventDefault(); window.updateJobTag(${jsonForHtml(job.id)}, this.value); this.value=""; }' />
        <button class="btn-small" onclick='const input = document.getElementById("tag-input-${escapeAttr(job.id)}"); window.updateJobTag(${jsonForHtml(job.id)}, input.value); input.value="";' type="button">+</button>
      </div>
      <div id="deep-score-${escapeAttr(job.id)}" class="deep-score-box"><em>Analisando aderência profunda...</em></div>
    </div>
    <div class="job-actions">
      <button type="button" class="btn-primary" onclick='window.runDeepMatch(${jsonForHtml(job.id)})'>Deep Score</button>
      ${
        originalHref
          ? `<a class="btn-secondary" href="${escapeAttr(originalHref)}" target="_blank" rel="noreferrer">Original</a>`
          : `<span class="btn-secondary" aria-disabled="true">Original indisponivel</span>`
      }
      ${job.userStatus !== "applied" ? `<button type="button" onclick='window.updateJobStatus(${jsonForHtml(job.id)}, "applied")'>Apply</button>` : ""}
      ${job.userStatus !== "discarded" ? `<button type="button" class="btn-danger" onclick='window.updateJobStatus(${jsonForHtml(job.id)}, "discarded")'>Discard</button>` : ""}
    </div>
  </article>`;
}

export function renderDashboardPage(data: DashboardData): string {
  const memoryCount = data.memoryEntries.ok ? data.memoryEntries.data.items.length : 0;
  const rankedCount = data.rankedJobs.ok ? data.rankedJobs.data.items.length : 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - Olympus Climb</title>
  ${headAssets}
</head>
<body>
  <div class="page-container">
    ${renderHeader("Dashboard - visão geral", data.health.ok ? "ok" : "error", data.health.ok ? data.health.data.uptimeMs : undefined, "/")}
    ${renderBreadcrumb([{ label: "Dashboard" }])}
    <main class="page-content">
      <div class="layout">
        <section class="panel">
          <div class="section-header">
            <div><h2>Centro de controle</h2><p class="subtle">Use esta página para navegar, rodar scraping e revisar vagas por afinidade.</p></div>
            ${renderInfoIcon("Resumo navegável do estado local em memória")}
          </div>
          <div class="actions-row">
            <a class="btn-primary" href="/workspace">Abrir Workspace</a>
            <a class="btn-secondary" href="/guide">Como usar</a>
            <a class="btn-secondary" href="/health" target="_blank" rel="noreferrer">Health</a>
            <form action="${escapeAttr(data.apiBaseUrl)}/v1/scraper/run" method="POST" target="_blank" class="actions-row" onsubmit='if(this.keyword.value.trim()) this.action = ${jsonForHtml(`${data.apiBaseUrl}/v1/scraper/run?keyword=`)} + encodeURIComponent(this.keyword.value.trim());'>
              <input class="tag-input" type="text" name="keyword" placeholder="keyword" />
              <button type="submit" class="btn-primary">Run Scraper</button>
            </form>
          </div>
        </section>

        <section class="panel">
          <div class="section-header"><div><h2>Overview</h2><p class="subtle">${escapeHtml(rankedCount)} vagas ranqueadas no filtro atual.</p></div>${renderInfoIcon("Métricas expostas por /v1/metrics e listas runtime")}</div>
          ${data.metrics.ok ? renderDashboardCards(data.metrics.data, memoryCount) : `<p class="empty">Não foi possível carregar métricas.</p>`}
        </section>

        <section>
          ${renderRouteTable(data.apiBaseUrl)}
        </section>

        <section class="panel">
          <div class="section-header">
            <div><h2>Vagas por afinidade</h2><p class="subtle">Ranking por overlap de skills do profile ativo, com filtros e ações rápidas.</p></div>
            ${renderInfoIcon("Score simples local; Deep Score chama Gemini quando GEMINI_API_KEY existe")}
          </div>
          <form method="GET" action="/" class="form-grid two">
            <label><span class="label-row">Busca ${renderInfoIcon("Título, empresa ou descrição")}</span><input type="text" name="q" placeholder="React, backend, platform..." /></label>
            <label><span class="label-row">Local ${renderInfoIcon("Filtro parcial sobre location")}</span><input type="text" name="location" placeholder="Brazil, Remote..." /></label>
            <label><span class="label-row">Fonte ${renderInfoIcon("Feed de origem")}</span><select name="sourceName"><option value="">Todas</option><option value="Remotive">Remotive</option><option value="Arbeitnow">Arbeitnow</option><option value="RemoteOK">RemoteOK</option><option value="Jobicy">Jobicy</option><option value="Himalayas">Himalayas</option><option value="CryptoJobsList">CryptoJobsList</option></select></label>
            <label><span class="label-row">Status ${renderInfoIcon("Estado manual da vaga")}</span><select name="status"><option value="">Todos</option><option value="new">New</option><option value="applied">Applied</option><option value="discarded">Discarded</option></select></label>
            <label><span class="label-row">Score mínimo ${renderInfoIcon("Percentual mínimo de afinidade")}</span><select name="minScore"><option value="0">Qualquer</option><option value="30">30+</option><option value="60">60+</option><option value="90">90+</option></select></label>
            <div class="actions-row"><button type="submit" class="btn-primary">Filtrar</button><a class="btn-secondary" href="/">Limpar</a></div>
          </form>
          ${renderRankedJobs(data)}
        </section>
      </div>
    </main>
    ${renderFooter()}
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const params = new URLSearchParams(window.location.search);
      for (const name of ["q", "location", "sourceName", "status", "minScore"]) {
        const field = document.querySelector('[name="' + name + '"]');
        const value = params.get(name);
        if (field && value !== null) field.value = value;
      }
    });

    window.updateJobStatus = async function(jobId, userStatus) {
      const res = await fetch(${jsonForHtml(data.apiBaseUrl + "/v1/jobs/update")}, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, userStatus })
      });
      const json = await res.json();
      if (json.ok) window.location.reload();
      else alert("Erro ao atualizar vaga: " + (json.error?.message || "unknown"));
    };

    window.updateJobTag = async function(jobId, addTag, removeTag) {
      const cleanTag = typeof addTag === "string" ? addTag.trim() : addTag;
      if (!cleanTag && !removeTag) return;
      const res = await fetch(${jsonForHtml(data.apiBaseUrl + "/v1/jobs/update")}, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, addTag: cleanTag || undefined, removeTag: removeTag || undefined })
      });
      const json = await res.json();
      if (json.ok) window.location.reload();
      else alert("Erro ao atualizar tags: " + (json.error?.message || "unknown"));
    };

    window.runDeepMatch = async function(jobId) {
      const box = document.getElementById("deep-score-" + jobId);
      if (!box) return;
      box.classList.add("visible");
      box.textContent = "Consultando Gemini para Deep Score...";
      try {
        const profilesRes = await fetch(${jsonForHtml(data.apiBaseUrl + "/v1/resume-profiles")});
        const profilesJson = await profilesRes.json();
        if (!profilesJson.ok || profilesJson.data.items.length === 0) {
          box.textContent = "Nenhum resume profile disponível.";
          return;
        }
        const profile = profilesJson.data.items[0];
        const res = await fetch(${jsonForHtml(data.apiBaseUrl + "/v1/match/deep-score")}, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobPostingId: jobId, resumeProfile: profile })
        });
        const json = await res.json();
        box.textContent = json.ok ? "LLM Score: " + json.data.score + "% - " + json.data.rationale : "Falha: " + (json.error?.message || "unknown");
      } catch (error) {
        box.textContent = "Erro de rede: " + error;
      }
    };
  </script>
</body>
</html>`;
}
