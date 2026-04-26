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
  MemoryEntry,
  JobSeniority
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

interface FilterOptions {
  tags: string[];
  locations: string[];
  sources: string[];
  statuses: string[];
  seniorities: JobSeniority[];
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectSeniorityFromText(value: string): JobSeniority {
  const text = ` ${normalizeText(value)} `;

  const seniorPatterns = [
    /\bsenior\b/,
    /\bsr\b/,
    /\bstaff\b/,
    /\bprincipal\b/,
    /\btech lead\b/,
    /\bespecialista\b/,
    /\bexpert\b/
  ];
  if (seniorPatterns.some((pattern) => pattern.test(text))) return "senior";

  const leadPatterns = [/\blead\b/, /\bteam lead\b/, /\btechlead\b/];
  if (leadPatterns.some((pattern) => pattern.test(text))) return "lead";

  const juniorPatterns = [
    /\bjunior\b/,
    /\bjr\b/,
    /\bentry level\b/,
    /\bentry-level\b/,
    /\bestagio\b/,
    /\bestagiario\b/,
    /\btrainee\b/,
    /\bintern\b/
  ];
  if (juniorPatterns.some((pattern) => pattern.test(text))) return "junior";

  const midPatterns = [/\bpleno\b/, /\bmid\b/, /\bmid level\b/, /\bmid-level\b/, /\bintermediate\b/, /\bintermediario\b/];
  if (midPatterns.some((pattern) => pattern.test(text))) return "mid";

  return "mid";
}

function detectSeniority(job: RankedJobPosting): JobSeniority {
  if (job.seniority) return job.seniority;
  const fromTags = detectSeniorityFromText(job.tags.join(" "));
  if (fromTags !== "mid") return fromTags;
  return detectSeniorityFromText(`${job.title} ${job.description}`);
}

function buildFilterOptions(data: DashboardData): FilterOptions {
  const jobs = data.jobs.ok ? data.jobs.data.items : [];
  const rankedJobs = data.rankedJobs.ok ? data.rankedJobs.data.items : [];

  const manualTags = jobs.flatMap((job) => job.tags);
  const skillTags = rankedJobs.flatMap((job) => job.matchedSkills);

  return {
    tags: uniqueSorted([...manualTags, ...skillTags]),
    locations: uniqueSorted(jobs.map((job) => job.location ?? "").filter(Boolean)),
    sources: uniqueSorted(jobs.map((job) => job.sourceName)),
    statuses: ["new", "applied", "discarded"],
    seniorities: uniqueSorted([...rankedJobs.map((job) => detectSeniority(job)), "junior", "mid", "senior", "lead"]) as JobSeniority[]
  };
}

function renderOptions(options: string[]): string {
  return options.map((option) => `<option value="${escapeAttr(option)}">${escapeHtml(option)}</option>`).join("");
}

function renderCollapsibleSection(title: string, subtitle: string, content: string, open = false): string {
  return `<details class="panel collapsible" ${open ? "open" : ""}>
    <summary>
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p class="subtle">${escapeHtml(subtitle)}</p>
      </div>
      <span class="collapse-indicator" aria-hidden="true">▾</span>
    </summary>
    <div class="details-body">${content}</div>
  </details>`;
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
    { method: "POST", route: "/acquire", desc: "Form action: adquirir vaga multimodal", category: "web" },
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
    { method: "POST", route: "/v1/jobs/acquire", desc: "Acquisition multimodal de vaga", category: "api" },
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
    <section class="panel tight nested-panel">
      <div class="details-body">
        <div class="panel-heading"><h3>Web Routes</h3>${renderInfoIcon("Rotas servidas pelo app web")}</div>
        <div class="table-wrap"><table><thead><tr><th>Método</th><th>Rota</th><th>Descrição</th><th>Ação</th></tr></thead><tbody>${renderRows("web")}</tbody></table></div>
      </div>
    </section>
    <section class="panel tight nested-panel">
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

  const allScoresAreZero = data.rankedJobs.data.items.every((job) => job.score === 0 && job.matchedSkills.length === 0);
  const scoreNotice = allScoresAreZero
    ? `<div class="notice warning">Scores zerados podem indicar ausência de resume profile ou nenhuma skill encontrada nos tokens das vagas. Ajuste seu profile no Workspace.</div>`
    : "";

  return `${scoreNotice}<div class="job-list" id="jobs-container">${data.rankedJobs.data.items.map(renderRankedJobCard).join("")}</div>`;
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
  const matchedSkills = job.matchedSkills.slice(0, 8);
  const seniority = detectSeniority(job);
  const postedTs = job.postedAt ? new Date(job.postedAt).getTime() : new Date(job.createdAt).getTime();
  const postedAtTs = Number.isNaN(postedTs) ? 0 : postedTs;
  return `<article class="job-card ${band}" data-job-id="${escapeAttr(job.id)}" data-score="${escapeAttr(String(job.score))}" data-status="${escapeAttr(job.userStatus)}" data-location="${escapeAttr((job.location ?? "remote").toLowerCase())}" data-source="${escapeAttr(job.sourceName.toLowerCase())}" data-tags="${escapeAttr(job.tags.join(",").toLowerCase())}" data-seniority="${escapeAttr(seniority)}" data-posted-at="${escapeAttr(String(postedAtTs))}" data-search="${escapeAttr(`${job.title} ${job.companyName} ${job.location ?? ""}`.toLowerCase())}">
    <div class="score-box"><span class="score-value ${band}">${escapeHtml(job.score)}%</span><span class="muted">afinidade local</span></div>
    <div>
      <div class="job-title">
        <span>${escapeHtml(job.title)}</span>
        <span class="badge ${statusClass}">
          ${escapeHtml(job.userStatus)}
          ${job.userStatus !== "new" ? `<button class="status-reset-btn" type="button" onclick="event.stopPropagation(); window.updateJobStatus(${jsonForHtml(job.id)}, 'new')" title="Remover status" aria-label="Remover status">×</button>` : ""}
        </span>
      </div>
      <div class="job-meta">${escapeHtml(job.companyName)} - ${escapeHtml(job.location ?? "Remote")} - ${escapeHtml(job.sourceName)} - ${escapeHtml(formatDate(job.postedAt))}</div>
      <div class="chip-row"><span class="badge">${escapeHtml(seniority)}</span></div>
      <p class="subtle">${matchedSkills.length > 0 ? `Skills encontradas: ${escapeHtml(matchedSkills.join(", "))}` : "Nenhuma skill do profile encontrada nos tokens desta vaga."}</p>
      ${matchedSkills.length > 0 ? `<div class="chip-row">${matchedSkills.map((skill) => `<span class="badge brand">${escapeHtml(skill)}</span>`).join("")}</div>` : ""}
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
            : `<span class="btn-secondary" aria-disabled="true">Original indisponível</span>`
        }
        ${
          job.userStatus === "applied"
            ? `<button type="button" class="btn-secondary" onclick='window.updateJobStatus(${jsonForHtml(job.id)}, "new")'>Unapply</button>`
            : `<button type="button" onclick='window.updateJobStatus(${jsonForHtml(job.id)}, "applied")'>Apply</button>`
        }
        ${
          job.userStatus === "discarded"
            ? `<button type="button" class="btn-secondary" onclick='window.updateJobStatus(${jsonForHtml(job.id)}, "new")'>Undiscard</button>`
            : `<button type="button" class="btn-danger" onclick='window.updateJobStatus(${jsonForHtml(job.id)}, "discarded")'>Discard</button>`
        }
      </div>
  </article>`;
}

export function renderDashboardPage(data: DashboardData): string {
  const memoryCount = data.memoryEntries.ok ? data.memoryEntries.data.items.length : 0;
  const rankedCount = data.rankedJobs.ok
    ? typeof data.rankedJobs.data.total === "number"
      ? data.rankedJobs.data.total
      : data.rankedJobs.data.items.length
    : 0;
  const paginationMeta = data.rankedJobs.ok
    ? {
        page: data.rankedJobs.data.page ?? 1,
        pageSize: data.rankedJobs.data.pageSize ?? data.rankedJobs.data.items.length,
        total: data.rankedJobs.data.total ?? data.rankedJobs.data.items.length,
        totalPages: data.rankedJobs.data.totalPages ?? 1
      }
    : null;
  const filterOptions = buildFilterOptions(data);
  const quickActions = `<div class="actions-row">
    <a class="btn-primary" href="/workspace">Abrir Workspace</a>
    <a class="btn-secondary" href="/guide">Como usar</a>
    <a class="btn-secondary" href="/health" target="_blank" rel="noreferrer">Health</a>
    <form class="actions-row" onsubmit="return window.runScraperNow(this)">
      <select class="tag-input" name="source" aria-label="Scraper source">
        <option value="all">All</option>
        <option value="linkedin">LinkedIn</option>
        <option value="gupy">Gupy</option>
        <option value="remotive">Remotive</option>
        <option value="arbeitnow">Arbeitnow</option>
        <option value="remoteok">RemoteOK</option>
        <option value="jobicy">Jobicy</option>
        <option value="himalayas">Himalayas</option>
      </select>
      <input class="tag-input" type="text" name="keyword" placeholder="keyword ex: junior" />
      <label class="field-hint"><input type="checkbox" name="autoDiscard" checked /> auto-discard low match</label>
      <button type="submit" class="btn-primary">Run Scraper</button>
      <span class="field-hint">A keyword filtra localmente antes de salvar.</span>
      <span class="field-hint" id="scraper-run-feedback" aria-live="polite"></span>
    </form>
  </div>`;
  const jobsContent = `<form method="GET" action="/" class="form-grid two">
    <label><span class="label-row">Busca ${renderInfoIcon("Busca textual em título, empresa, local, fonte e descrição")}</span><input class="tag-input" type="text" name="q" placeholder="ex: react junior remoto" /></label>
    <label><span class="label-row">Tags ${renderInfoIcon("Filtro por tags manuais acrescentadas nas vagas; multi-seleção aplica OR")}</span><select name="tags" multiple size="6">${renderOptions(filterOptions.tags)}</select></label>
    <label><span class="label-row">Local ${renderInfoIcon("Locais presentes no batch atual; multi-seleção aplica OR")}</span><select name="location" multiple size="6">${renderOptions(filterOptions.locations)}</select></label>
    <label><span class="label-row">Fonte ${renderInfoIcon("Feed/plataforma de origem; multi-selecao aplica OR")}</span><select name="sourceName" multiple size="5">${renderOptions(filterOptions.sources)}</select></label>
    <label><span class="label-row">Status ${renderInfoIcon("Estado manual da vaga; multi-selecao aplica OR")}</span><select name="status" multiple size="3">${renderOptions(filterOptions.statuses)}</select></label>
    <label><span class="label-row">Senioridade ${renderInfoIcon("Classificação inferida de título/descrição/tags; sem indicação explícita vira mid/pleno")}</span><select name="seniority" multiple size="3">${renderOptions(filterOptions.seniorities)}</select></label>
    <label><span class="label-row">Score mínimo ${renderInfoIcon("Percentual mínimo de afinidade")}</span><select name="minScore"><option value="0">Qualquer</option><option value="30">30+</option><option value="60">60+</option><option value="90">90+</option></select></label>
    <label><span class="label-row">Data da vaga ${renderInfoIcon("Ordenação por data de publicação (fallback: data de ingestão)")}</span><div class="sort-toggle-row"><button id="sort-toggle-btn" class="btn-secondary sort-toggle-btn" type="button">Mais novo primeiro ↓</button><input type="hidden" name="sortByDate" value="newest" /></div></label>
    <label><span class="label-row">Itens por página ${renderInfoIcon("Paginação da API (todos os filtros combinados)")}</span><select name="pageSize"><option value="10">10</option><option value="20">20</option><option value="30">30</option><option value="50">50</option></select></label>
    <input type="hidden" name="page" value="1" />
    <div class="actions-row filter-actions"><button type="submit" class="btn-primary">Filtrar</button><a class="btn-secondary" href="/">Limpar</a><span class="field-hint">Todos os filtros combinam entre si; paginação e ordenação vão pela URL.</span></div>
  </form>
  <div id="active-filters-summary" class="active-filters-summary"></div>
  ${renderRankedJobs(data)}
  <div class="actions-row" id="jobs-pagination" aria-live="polite"></div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - Olympus Climb</title>
  ${headAssets}
  <style>
    .status-reset-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      margin-left: 0.4rem;
      margin-right: -0.2rem;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 0.9rem;
      font-weight: 900;
      cursor: pointer;
      line-height: 1;
    }
    .status-reset-btn:hover {
      background: var(--danger);
      border-color: var(--danger);
    }
    .form-grid select[multiple] option {
      color: #dbeafe;
      background: rgba(2, 6, 23, 0.96);
    }
    .form-grid select[multiple] option:checked {
      color: #e0f2fe;
      background: rgba(37, 99, 235, 0.75);
    }
    .sort-toggle-row {
      display: flex;
      align-items: center;
      min-height: 2.5rem;
    }
    .sort-toggle-btn {
      width: 100%;
      justify-content: center;
    }
    .active-filters-summary {
      margin-top: 0.65rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .active-filters-summary .badge {
      background: rgba(56, 189, 248, 0.15);
      border-color: rgba(56, 189, 248, 0.35);
      color: #dbeafe;
    }
    .filter-dropdown {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .filter-dropdown-compact {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      align-items: center;
      min-height: 2.45rem;
      padding: 0.45rem 0.75rem;
      border: 1px solid var(--line-soft);
      border-radius: 0.75rem;
      background: rgba(2, 6, 23, 0.45);
      cursor: pointer;
      color: #dbeafe;
    }
    .filter-dropdown-compact.active {
      border-color: rgba(56, 189, 248, 0.75);
      box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.3);
    }
    .filter-dropdown-arrow {
      margin-left: auto;
      font-size: 0.75rem;
      opacity: 0.85;
      transition: transform 0.14s ease;
    }
    .filter-dropdown-compact.active .filter-dropdown-arrow {
      transform: rotate(180deg);
    }
    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.16rem 0.4rem;
      border-radius: 0.42rem;
      border: 1px solid rgba(56, 189, 248, 0.4);
      background: rgba(56, 189, 248, 0.2);
      color: #e0f2fe;
      font-size: 0.76rem;
      line-height: 1.2;
    }
    .filter-tag-remove {
      width: 0.95rem;
      height: 0.95rem;
      border: 1px solid rgba(148, 163, 184, 0.5);
      border-radius: 0.25rem;
      background: rgba(15, 23, 42, 0.45);
      color: #cbd5e1;
      padding: 0;
      cursor: pointer;
      line-height: 1;
      font-size: 0.78rem;
    }
    .filter-tag-remove:hover {
      border-color: rgba(248, 113, 113, 0.85);
      color: #fecaca;
    }
    .filter-dropdown-menu {
      position: absolute;
      top: calc(100% + 0.35rem);
      left: 0;
      right: 0;
      z-index: 20;
      display: none;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.55rem;
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 0.75rem;
      background: rgba(2, 6, 23, 0.96);
      max-height: 14rem;
      overflow: auto;
      box-shadow: 0 10px 22px rgba(2, 6, 23, 0.45);
    }
    .filter-dropdown-controls {
      display: flex;
      gap: 0.45rem;
      align-items: center;
      margin-bottom: 0.2rem;
    }
    .filter-dropdown-controls input {
      flex: 1 1 auto;
      min-width: 0;
      border: 1px solid var(--line-soft);
      border-radius: 0.55rem;
      padding: 0.35rem 0.5rem;
      background: rgba(2, 6, 23, 0.65);
      color: #dbeafe;
    }
    .filter-dropdown-controls button {
      flex: 0 0 auto;
      border: 1px solid var(--line-soft);
      border-radius: 0.55rem;
      background: rgba(15, 23, 42, 0.6);
      color: #cbd5e1;
      padding: 0.35rem 0.45rem;
      cursor: pointer;
    }
    .filter-dropdown-controls button:hover {
      border-color: rgba(56, 189, 248, 0.65);
      color: #e0f2fe;
    }
    .filter-options-list {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .filter-dropdown-menu.open {
      display: flex;
    }
    .filter-option {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.35rem 0.45rem;
      border-radius: 0.45rem;
      color: #dbeafe;
      cursor: pointer;
      user-select: none;
    }
    .filter-option:hover {
      background: rgba(56, 189, 248, 0.12);
    }
    .filter-option input[type="checkbox"] {
      accent-color: #38bdf8;
      width: 0.95rem;
      height: 0.95rem;
      flex: 0 0 auto;
    }
    .filter-option span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="page-container">
    ${renderHeader("Dashboard - visão geral", data.health.ok ? "ok" : "error", data.health.ok ? data.health.data.uptimeMs : undefined, "/")}
    ${renderBreadcrumb([{ label: "Dashboard" }])}
    <main class="page-content">
      <div class="layout">
        ${renderCollapsibleSection("Centro de controle", "Ações rápidas, scraper e navegação principal.", quickActions, true)}
        ${renderCollapsibleSection("Vagas por afinidade", `${rankedCount} vagas ranqueadas no filtro atual.`, jobsContent, true)}
        ${renderCollapsibleSection("Overview", "Métricas expostas por /v1/metrics e listas runtime.", data.metrics.ok ? renderDashboardCards(data.metrics.data, memoryCount) : `<p class="empty">Não foi possível carregar métricas.</p>`)}
        ${renderCollapsibleSection("Rotas", "Índice de rotas web/API disponível quando precisar consultar endpoints.", renderRouteTable(data.apiBaseUrl))}
      </div>
    </main>
    ${renderFooter()}
  </div>

  <script>
    const rankedPaginationMeta = ${jsonForHtml(paginationMeta)};

    document.addEventListener("DOMContentLoaded", () => {
      const params = new URLSearchParams(window.location.search);
      for (const name of ["q", "tags", "location", "sourceName", "status", "seniority"]) {
        const values = params.getAll(name).flatMap((value) => value.split(",")).filter(Boolean);
        const field = document.querySelector('[name="' + name + '"]');
        if (field && field instanceof HTMLSelectElement && field.multiple) {
          for (const option of field.options) option.selected = values.includes(option.value);
        }
      }
      const qInput = document.querySelector('[name="q"]');
      if (qInput instanceof HTMLInputElement) {
        qInput.value = params.get("q") ?? "";
      }
      for (const name of ["minScore", "sortByDate", "pageSize"]) {
        const field = document.querySelector('[name="' + name + '"]');
        const value = params.get(name);
        if (field && value !== null) {
          field.value = value;
        }
      }
      const sortInput = document.querySelector('[name="sortByDate"]');
      if (sortInput instanceof HTMLInputElement) {
        sortInput.value = params.get("sortByDate") === "oldest" ? "oldest" : "newest";
      }
      syncSortToggleButton();

      const filterForm = document.querySelector('form[action="/"]');
      if (filterForm instanceof HTMLFormElement) {
        filterForm.addEventListener("submit", () => {
          const pageInput = filterForm.querySelector('input[name="page"]');
          if (pageInput instanceof HTMLInputElement) pageInput.value = "1";
        });
      }

      setupCompactDropdowns();
      setupSortToggle();
      renderActiveFiltersSummary();
      setupPagination();
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

    window.runScraperNow = async function(form) {
      const feedback = document.getElementById("scraper-run-feedback");
      if (feedback) feedback.textContent = "rodando...";
      const params = new URLSearchParams();
      const source = form.source?.value || "all";
      const keyword = form.keyword?.value?.trim();
      const autoDiscard = !!form.autoDiscard?.checked;
      if (source) params.set("source", source);
      if (keyword) params.set("keyword", keyword);
      params.set("autoDiscard", autoDiscard ? "true" : "false");

      try {
        const res = await fetch(
          ${jsonForHtml(data.apiBaseUrl + "/v1/scraper/run")} + "?" + params.toString(),
          { method: "POST" }
        );
        const json = await res.json();
        if (!json.ok) {
          if (feedback) feedback.textContent = "erro: " + (json.error?.code || "unknown");
          return false;
        }
        const info = json.data;
        if (feedback) {
          const keywordNote = info.keywordEffective ? ' keyword="' + info.keywordEffective + '"' : "";
          const autoDiscardNote = typeof info.autoDiscarded === "number" ? ", auto-discard=" + info.autoDiscarded : "";
          feedback.textContent = "ok: ingested=" + info.ingested + ", dedup=" + info.deduplicated + autoDiscardNote + keywordNote;
        }
        const nextParams = new URLSearchParams(window.location.search);
        if (info.keywordEffective) {
          nextParams.set("q", info.keywordEffective);
        }
        if (source && source !== "all") {
          nextParams.set("sourceName", source);
        }
        const nextUrl = "/?" + nextParams.toString();
        setTimeout(() => window.location.assign(nextUrl), 400);
      } catch (error) {
        if (feedback) feedback.textContent = "erro de rede";
      }
      return false;
    };

    function setupPagination() {
      const pagination = document.getElementById("jobs-pagination");
      if (!pagination || !rankedPaginationMeta) return;
      const page = Number(rankedPaginationMeta.page || 1);
      const totalPages = Number(rankedPaginationMeta.totalPages || 1);
      const total = Number(rankedPaginationMeta.total || 0);
      const params = new URLSearchParams(window.location.search);
      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "btn-secondary";
      prevBtn.textContent = "Prev";
      prevBtn.disabled = page <= 1;
      prevBtn.addEventListener("click", () => {
        const next = new URLSearchParams(params);
        next.set("page", String(page - 1));
        window.location.search = next.toString();
      });

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "btn-secondary";
      nextBtn.textContent = "Next";
      nextBtn.disabled = page >= totalPages;
      nextBtn.addEventListener("click", () => {
        const next = new URLSearchParams(params);
        next.set("page", String(page + 1));
        window.location.search = next.toString();
      });

      const label = document.createElement("span");
      label.className = "field-hint";
      label.textContent = "Página " + page + "/" + totalPages + " • " + total + " vagas";

      pagination.textContent = "";
      pagination.appendChild(prevBtn);
      pagination.appendChild(nextBtn);
      pagination.appendChild(label);
    }

    function syncSortToggleButton() {
      const sortInput = document.querySelector('[name="sortByDate"]');
      const sortBtn = document.getElementById("sort-toggle-btn");
      if (!(sortInput instanceof HTMLInputElement) || !(sortBtn instanceof HTMLButtonElement)) return;
      const isNewest = sortInput.value !== "oldest";
      sortBtn.textContent = isNewest ? "Mais novo primeiro ↓" : "Mais antigo primeiro ↑";
      sortBtn.setAttribute("aria-pressed", isNewest ? "false" : "true");
    }

    function setupSortToggle() {
      const sortBtn = document.getElementById("sort-toggle-btn");
      const sortInput = document.querySelector('[name="sortByDate"]');
      const filterForm = document.querySelector('form[action="/"]');
      if (!(sortBtn instanceof HTMLButtonElement) || !(sortInput instanceof HTMLInputElement) || !(filterForm instanceof HTMLFormElement)) {
        return;
      }
      sortBtn.addEventListener("click", () => {
        sortInput.value = sortInput.value === "oldest" ? "newest" : "oldest";
        const pageInput = filterForm.querySelector('input[name="page"]');
        if (pageInput instanceof HTMLInputElement) pageInput.value = "1";
        syncSortToggleButton();
        filterForm.requestSubmit();
      });
    }

    function renderActiveFiltersSummary() {
      const container = document.getElementById("active-filters-summary");
      if (!container) return;
      const params = new URLSearchParams(window.location.search);
      const chips = [];
      const valueOf = (key) => params.getAll(key).flatMap((value) => value.split(",")).map((item) => item.trim()).filter(Boolean);
      const pushChip = (label, values) => {
        if (values.length === 0) return;
        chips.push(label + ": " + values.join(", "));
      };
      pushChip("Busca", valueOf("q"));
      pushChip("Tags", valueOf("tags"));
      pushChip("Local", valueOf("location"));
      pushChip("Fonte", valueOf("sourceName"));
      pushChip("Status", valueOf("status"));
      pushChip("Senioridade", valueOf("seniority"));
      const minScore = params.get("minScore");
      if (minScore && minScore !== "0") chips.push("Score mínimo: " + minScore + "+");
      const sortByDate = params.get("sortByDate");
      if (sortByDate === "oldest") chips.push("Ordem: mais antigo");
      if (sortByDate === "newest") chips.push("Ordem: mais novo");

      container.textContent = "";
      if (chips.length === 0) {
        container.innerHTML = '<span class="field-hint">Sem filtros ativos.</span>';
        return;
      }
      for (const chipText of chips) {
        const chip = document.createElement("span");
        chip.className = "badge";
        chip.textContent = chipText;
        container.appendChild(chip);
      }
    }

    function setupCompactDropdowns() {
      for (const name of ["tags", "location", "sourceName", "status", "seniority"]) {
        const field = document.querySelector('[name="' + name + '"]');
        if (!field || !(field instanceof HTMLSelectElement) || !field.multiple) continue;
        const wrapper = field.parentElement;
        if (!wrapper) continue;

        const root = document.createElement("div");
        root.className = "filter-dropdown";

        const compact = document.createElement("div");
        compact.className = "filter-dropdown-compact";
        compact.setAttribute("role", "button");
        compact.setAttribute("tabindex", "0");
        compact.setAttribute("aria-label", "Selecionar " + name);
        compact.setAttribute("aria-expanded", "false");

        const menu = document.createElement("div");
        menu.className = "filter-dropdown-menu";
        const controls = document.createElement("div");
        controls.className = "filter-dropdown-controls";
        const search = document.createElement("input");
        search.type = "search";
        search.placeholder = "buscar...";
        search.setAttribute("aria-label", "Buscar opção no filtro " + name);
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.textContent = "Limpar";
        controls.appendChild(search);
        controls.appendChild(clearBtn);
        const optionsList = document.createElement("div");
        optionsList.className = "filter-options-list";
        menu.appendChild(controls);
        menu.appendChild(optionsList);

        function syncFromSelect() {
          optionsList.textContent = "";
          for (const option of field.options) {
            const optionRow = document.createElement("label");
            optionRow.className = "filter-option";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = option.selected;
            checkbox.dataset.value = option.value;
            checkbox.addEventListener("change", () => {
              option.selected = checkbox.checked;
              renderCompactValue();
            });
            const text = document.createElement("span");
            text.textContent = option.value;
            optionRow.appendChild(checkbox);
            optionRow.appendChild(text);
            optionsList.appendChild(optionRow);
          }
          filterOptionsBySearch(search.value);
        }

        function filterOptionsBySearch(rawSearch) {
          const query = rawSearch.trim().toLowerCase();
          for (const row of optionsList.querySelectorAll(".filter-option")) {
            const text = row.textContent ? row.textContent.toLowerCase() : "";
            row.style.display = !query || text.includes(query) ? "" : "none";
          }
        }

        function closeMenu() {
          menu.classList.remove("open");
          compact.classList.remove("active");
          compact.setAttribute("aria-expanded", "false");
        }

        function openMenu() {
          menu.classList.add("open");
          compact.classList.add("active");
          compact.setAttribute("aria-expanded", "true");
        }

        function renderCompactValue() {
          const selected = Array.from(field.options).filter((opt) => opt.selected).map((opt) => opt.value);
          compact.textContent = "";
          if (selected.length === 0) {
            const muted = document.createElement("span");
            muted.className = "muted";
            muted.textContent = "Qualquer";
            compact.appendChild(muted);
          } else {
            for (const value of selected) {
              const chip = document.createElement("span");
              chip.className = "filter-tag";
              chip.textContent = value;
              const remove = document.createElement("button");
              remove.className = "filter-tag-remove";
              remove.type = "button";
              remove.textContent = "×";
              remove.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const option = Array.from(field.options).find((opt) => opt.value === value);
                if (!option) return;
                option.selected = false;
                const checkbox = menu.querySelector('input[data-value="' + CSS.escape(value) + '"]');
                if (checkbox instanceof HTMLInputElement) checkbox.checked = false;
                renderCompactValue();
              });
              chip.appendChild(remove);
              compact.appendChild(chip);
            }
          }
          const arrow = document.createElement("span");
          arrow.className = "filter-dropdown-arrow";
          arrow.textContent = "▼";
          compact.appendChild(arrow);
        }

        compact.addEventListener("click", () => {
          if (menu.classList.contains("open")) closeMenu();
          else openMenu();
        });
        compact.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (menu.classList.contains("open")) closeMenu();
            else openMenu();
          } else if (event.key === "Escape") {
            closeMenu();
          }
        });

        search.addEventListener("input", () => filterOptionsBySearch(search.value));
        clearBtn.addEventListener("click", () => {
          for (const option of field.options) option.selected = false;
          syncFromSelect();
          renderCompactValue();
        });

        document.addEventListener("click", (event) => {
          if (!root.contains(event.target)) closeMenu();
        });

        field.style.display = "none";
        syncFromSelect();
        renderCompactValue();

        root.appendChild(compact);
        root.appendChild(menu);
        wrapper.insertBefore(root, field);
      }
    }
  </script>
</body>
</html>`;
}
