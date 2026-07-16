import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { extname, normalize, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { buildCoverageManifest, coverageManifestHtml } from "./coverage-manifest.mjs";
import { capabilityCatalog, statusLabels } from "./workbench-catalog.mjs";

const DEFAULT_PORT = 4173;

export const documentationPaths = [
  ["Guia de apresentacao", "docs/demo/guia-apresentacao-alwaystrack.md"],
  ["SPEC CaseFlow + Companion", "docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md"],
  ["Estrategia de testes", "docs/testing/strategy.md"],
  ["Playwright e CI", "docs/testing/playwright-ci.md"],
  ["Politica de coverage", "docs/testing/coverage-policy.md"],
  ["Performance", "docs/performance/README.md"],
  ["OpenAPI v1", "docs/api/openapi.v1.yaml"],
  ["Arquitetura CaseFlow", "docs/architecture/caseflow-architecture.md"],
  ["Contrato de conectores", "docs/architecture/companion-connector-contract.md"],
  ["Protocolo Companion", "docs/architecture/companion-protocol.md"],
  ["Agente futuro", "docs/architecture/future-agent-readiness.md"],
  ["Roteiro CaseFlow", "docs/demo/caseflow-guided-demo.md"],
  ["Checklist da demo", "docs/demo/always-track-demo-checklist.md"],
  ["Decisao de prontidao", "docs/operations/project-readiness-decision.md"],
  ["Ledger de prontidao", "docs/operations/project-readiness-ledger.md"],
  ["Gate de exposicao", "docs/security/external-exposure-release-gate.md"],
  ["Seguranca das integracoes", "docs/security/external-integrations-security-review.md"],
  ["Threat model Companion", "docs/security/companion-threat-model.md"],
  ["Backup e restore", "docs/operations/backup-restore-runbook.md"],
  ["Companion local", "docs/operations/companion-local-runbook.md"],
  ["Drift de conectores", "docs/operations/connector-drift-runbook.md"],
  ["Prontidao Postgres e storage", "docs/operations/production-postgres-storage-readiness.md"],
  ["Incidente de seguranca", "docs/operations/security-incident-runbook.md"]
];

export const reportPaths = [
  ["TypeDoc", "docs/generated/typedoc/index.html", "docs"],
  ["Coverage Shared", "packages/shared/coverage/index.html", "coverage"],
  ["Coverage Extension", "apps/companion-extension/coverage/index.html", "coverage"],
  ["Coverage SmartScript", "apps/smartscript-companion/coverage/index.html", "coverage"],
  ["Coverage Web", "apps/web/coverage/index.html", "coverage"],
  ["Coverage API", "services/api/coverage/index.html", "coverage"],
  ["Coverage Companion Host", "services/companion-host/coverage/index.html", "coverage"],
  ["Playwright", "playwright-report/index.html", "e2e"],
  ["Playwright alternativo", "test-results/playwright-report/index.html", "e2e"]
];

const allowedDirectoryPrefixes = [
  "docs/generated/typedoc",
  "docs/generated/coverage",
  "docs/performance/reports",
  "packages/shared/coverage",
  "apps/companion-extension/coverage",
  "apps/smartscript-companion/coverage",
  "apps/web/coverage",
  "services/api/coverage",
  "services/companion-host/coverage",
  "playwright-report",
  "test-results/playwright-report"
];

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"]
]);

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pathUrl(filePath) {
  return `/files/${filePath.split(sep).join("/")}`;
}

export function latestFile(rootDir, directory, predicate) {
  const absoluteDirectory = resolve(rootDir, directory);
  if (!existsSync(absoluteDirectory)) return null;
  return readdirSync(absoluteDirectory)
    .map((name) => ({ name, path: resolve(absoluteDirectory, name) }))
    .filter((item) => {
      try {
        return statSync(item.path).isFile() && predicate(item.name);
      } catch {
        return false;
      }
    })
    .sort((left, right) => statSync(right.path).mtimeMs - statSync(left.path).mtimeMs)[0]?.path ?? null;
}

function newestMtime(filePath) {
  if (!existsSync(filePath)) return 0;
  const stat = statSync(filePath);
  if (stat.isFile()) return stat.mtimeMs;
  if (!stat.isDirectory()) return 0;
  return readdirSync(filePath).reduce((latest, entry) => Math.max(latest, newestMtime(resolve(filePath, entry))), 0);
}

export function artifactsAreFresh(rootDir, outputPaths, inputPaths, maxAgeMs = Infinity) {
  const outputs = outputPaths.map((filePath) => resolve(rootDir, filePath));
  if (!outputs.length || outputs.some((filePath) => !existsSync(filePath))) return false;
  const oldestOutput = Math.min(...outputs.map((filePath) => statSync(filePath).mtimeMs));
  const newestInput = Math.max(0, ...inputPaths.map((filePath) => newestMtime(resolve(rootDir, filePath))));
  return oldestOutput >= newestInput && Date.now() - oldestOutput <= maxAgeMs;
}

function coveragePercent(rootDir, indexPath) {
  const summaryPath = resolve(rootDir, indexPath, "..", "coverage-summary.json");
  if (!existsSync(summaryPath)) return null;
  try {
    const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
    return summary.total?.lines?.pct ?? null;
  } catch {
    return null;
  }
}

function reportCard(rootDir, [label, filePath, category]) {
  const absolute = resolve(rootDir, filePath);
  if (!existsSync(absolute)) {
    return `<article class="report missing"><div><span>${htmlEscape(category)}</span><h3>${htmlEscape(label)}</h3></div><strong>Ausente</strong><small>${htmlEscape(filePath)}</small></article>`;
  }
  const coverage = category === "coverage" ? coveragePercent(rootDir, filePath) : null;
  const inputPaths =
    category === "coverage"
      ? [`${filePath.slice(0, filePath.indexOf("/coverage/"))}/src`, "package-lock.json"]
      : category === "docs"
        ? ["typedoc.json", "tsconfig.typedoc.json", "packages/shared/src"]
        : category === "e2e"
          ? ["playwright.config.ts", "tests/e2e", "apps/web/src", "services/api/src"]
          : ["scripts/perf-report.js", "tests/performance/alwaystrack-smoke.yml"];
  const maxAgeMs = category === "carga" ? 24 * 60 * 60 * 1000 : Infinity;
  const fresh = artifactsAreFresh(rootDir, [filePath], inputPaths, maxAgeMs);
  const detail = fresh ? (coverage === null ? "Atualizado" : `${coverage}% linhas`) : "Desatualizado";
  return `<article class="report ${fresh ? "ready" : "stale"}" data-searchable="${htmlEscape(`${label} ${category} ${detail}`)}"><div><span>${htmlEscape(category)}</span><h3>${htmlEscape(label)}</h3></div><strong>${htmlEscape(detail)}</strong><small>${htmlEscape(statSync(absolute).mtime.toLocaleString("pt-BR"))}</small><button class="link-button" type="button" data-open="${pathUrl(filePath)}" data-title="${htmlEscape(label)}">Abrir no Hub</button></article>`;
}

function performanceCards(rootDir) {
  const latestHtml = latestFile(rootDir, "docs/performance/reports", (name) => name.endsWith(".html"));
  if (!latestHtml) return '<article class="report missing"><div><span>carga</span><h3>Artillery</h3></div><strong>Ausente</strong></article>';
  const relative = latestHtml.slice(rootDir.length + 1).split(sep).join("/");
  return reportCard(rootDir, ["Ultimo relatorio Artillery", relative, "carga"]);
}

function documentationLinks(rootDir) {
  return documentationPaths
    .filter(([, filePath]) => existsSync(resolve(rootDir, filePath)))
    .map(([label, filePath]) => `<button class="doc-link" type="button" data-open="/view?path=${encodeURIComponent(filePath)}" data-title="${htmlEscape(label)}">${htmlEscape(label)}</button>`)
    .join("");
}

function reportEnabled(category, options) {
  if (category === "docs") return options.includeDocs !== false;
  if (category === "coverage") return options.includeCoverage !== false;
  if (category === "e2e") return options.includeE2e !== false;
  if (category === "carga") return options.includePerformance !== false;
  return true;
}

export function buildWorkbenchHtml(rootDir, options = {}) {
  const apiPort = options.apiPort ?? 3333;
  const webPort = options.webPort ?? 5173;
  const studioPort = options.studioPort ?? 5555;
  const includeStudio = options.includeStudio !== false;
  const reportCards = [
    ...reportPaths.filter(([, , category]) => reportEnabled(category, options)).map((report) => reportCard(rootDir, report)),
    ...(options.includePerformance === false ? [] : [performanceCards(rootDir)])
  ].join("");
  const studioLink = includeStudio ? `<button type="button" data-open="http://localhost:${studioPort}" data-title="Prisma Studio">Prisma Studio</button>` : "";
  const docsSection = options.includeDocs === false
    ? ""
    : `<section class="content-section"><div class="section-heading"><div><p class="eyebrow">Fontes de verdade</p><h2>Documentacao essencial</h2></div></div><div class="docs">${documentationLinks(rootDir)}</div></section>`;
  let coverageSection = "";
  if (options.includeCoverage !== false) {
    try {
      const manifest = buildCoverageManifest(rootDir);
      coverageSection = `<section class="content-section"><div class="section-heading"><div><p class="eyebrow">Cobertura executavel</p><h2>Coverage comparativo</h2><p>Metricas brutas, pisos reais, margem e arquivos zerados.</p></div><button class="secondary-button" type="button" data-open="/files/docs/generated/coverage/index.html" data-title="Scorecard de coverage">Scorecard completo</button></div>${coverageManifestHtml(manifest, { compact: true })}</section>`;
    } catch (error) {
      coverageSection = `<section class="content-section"><h2>Coverage comparativo</h2><p class="coverage-error">Manifesto indisponivel: ${htmlEscape(error.message)}</p></section>`;
    }
  }
  const capabilities = capabilityCatalog.map((item) => `
    <article class="capability-card" data-status="${item.status}" data-group="${htmlEscape(item.group)}" data-searchable="${htmlEscape([item.title, item.group, item.summary, item.finalVision, ...item.todos].join(" "))}">
      <div class="capability-top"><span class="group-label">${htmlEscape(item.group)}</span><span class="status-chip ${item.status}">${htmlEscape(statusLabels[item.status])}</span></div>
      <h3>${htmlEscape(item.title)}</h3><p>${htmlEscape(item.summary)}</p>
      <details><summary>Estado, visao final e pendencias</summary>
        <div class="capability-detail"><strong>Entregue</strong><ul>${item.delivered.map((entry) => `<li>${htmlEscape(entry)}</li>`).join("")}</ul></div>
        <div class="capability-detail"><strong>Visao final</strong><p>${htmlEscape(item.finalVision)}</p></div>
        <div class="capability-detail"><strong>O que falta</strong><ul>${item.todos.map((entry) => `<li>${htmlEscape(entry)}</li>`).join("")}</ul></div>
        <div class="intentional"><strong>Decisao intencional</strong><p>${htmlEscape(item.intentionalReason)}</p></div>
      </details>
      <button class="link-button" type="button" data-open="${htmlEscape(item.href)}" data-title="${htmlEscape(item.title)}">Abrir evidencia</button>
    </article>`).join("");
  const groupOptions = [...new Set(capabilityCatalog.map((item) => item.group))].sort().map((group) => `<option value="${htmlEscape(group)}">${htmlEscape(group)}</option>`).join("");
  const searchIndex = [
    ...capabilityCatalog.map((item) => ({ title: item.title, kind: item.group, description: item.summary, href: item.href, page: "capabilities" })),
    ...documentationPaths.filter(([, filePath]) => existsSync(resolve(rootDir, filePath))).map(([title, filePath]) => ({ title, kind: "Documentacao", description: filePath, href: `/view?path=${encodeURIComponent(filePath)}`, page: "docs" })),
    ...reportPaths.filter(([, filePath, category]) => reportEnabled(category, options) && existsSync(resolve(rootDir, filePath))).map(([title, filePath, category]) => ({ title, kind: category, description: filePath, href: pathUrl(filePath), page: "quality" }))
  ];
  const safeSearchIndex = JSON.stringify(searchIndex).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AlwaysTrack Presentation Hub</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17252a; background: #eef2f3; --ink:#17252a; --muted:#5d7075; --line:#cbd7da; --teal:#0e4a55; --green:#147a55; --red:#ba3d2f; --amber:#9a5a00; }
    * { box-sizing: border-box; } body { margin: 0; min-width: 320px; } button, input, select { font: inherit; } button { cursor: pointer; }
    .app-shell { min-height: 100vh; display: grid; grid-template-columns: 248px minmax(0, 1fr); }
    .sidebar { position: sticky; top: 0; height: 100vh; background: #113841; color: #fff; padding: 24px 18px; display: flex; flex-direction: column; gap: 24px; }
    .brand strong { display:block; font-size: 20px; } .brand span { color:#b8d7db; font-size:13px; }
    .nav { display:grid; gap:6px; } .nav a { color:#cce0e3; padding:10px 12px; border-radius:6px; text-decoration:none; font-weight:700; }
    .nav a:hover, .nav a.active { background:#fff; color:#113841; }
    .sidebar-note { margin-top:auto; border-top:1px solid #38606a; padding-top:16px; color:#b8d7db; font-size:12px; line-height:1.5; }
    .workspace { min-width:0; } .topbar { position:sticky; top:0; z-index:10; background:rgba(255,255,255,.96); border-bottom:1px solid var(--line); padding:14px clamp(16px,3vw,36px); display:flex; gap:14px; align-items:center; }
    .search-wrap { position:relative; flex:1; max-width:760px; } .search-wrap input { width:100%; height:44px; border:1px solid #aebfc3; border-radius:7px; padding:0 14px; background:#fff; color:var(--ink); }
    .search-wrap input:focus { outline:3px solid #8bc3cd; outline-offset:1px; }
    .search-results { position:absolute; top:50px; left:0; right:0; max-height:480px; overflow:auto; background:#fff; border:1px solid var(--line); box-shadow:0 14px 34px rgba(15,52,59,.18); padding:8px; z-index:30; }
    .search-results[hidden] { display:none; } .search-result { width:100%; text-align:left; border:0; background:#fff; padding:11px; border-bottom:1px solid #e5ecee; }
    .search-result:hover { background:#edf6f7; } .search-result strong, .search-result span { display:block; } .search-result span { color:var(--muted); font-size:12px; margin-top:3px; }
    .top-status { white-space:nowrap; font-size:12px; font-weight:800; color:var(--green); }
    main { width:min(1280px, calc(100% - 40px)); margin:0 auto 64px; }
    [data-page][hidden] { display:none; } .page-header { padding:34px 0 20px; border-bottom:1px solid var(--line); }
    .page-header h1 { font-size:32px; margin:4px 0 8px; letter-spacing:0; } .page-header p { max-width:820px; margin:0; color:var(--muted); line-height:1.55; }
    .eyebrow { margin:0; color:#176477; font-size:12px; font-weight:850; text-transform:uppercase; }
    h2 { font-size:21px; margin:0; letter-spacing:0; } h3 { font-size:16px; margin:0; letter-spacing:0; }
    .content-section { margin-top:28px; } .section-heading { display:flex; justify-content:space-between; gap:16px; align-items:end; margin-bottom:12px; }
    .section-heading p:not(.eyebrow) { margin:4px 0 0; color:var(--muted); }
    .decision-band { display:grid; grid-template-columns:1.2fr 1fr 1fr; border:1px solid var(--line); background:#fff; margin-top:24px; }
    .decision { padding:18px; border-right:1px solid var(--line); } .decision:last-child { border:0; } .decision strong { display:block; font-size:18px; margin:5px 0; }
    .decision.go strong { color:var(--amber); } .decision.no strong { color:var(--red); } .decision p { margin:0; color:var(--muted); font-size:13px; line-height:1.45; }
    .metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-top:18px; }
    .metric { background:#fff; border:1px solid var(--line); padding:16px; } .metric strong { display:block; font-size:25px; } .metric span { color:var(--muted); font-size:12px; }
    .architecture { display:grid; grid-template-columns:repeat(4,1fr); gap:0; border:1px solid var(--line); background:#fff; }
    .architecture div { padding:16px; border-right:1px solid var(--line); } .architecture div:last-child { border:0; } .architecture p { margin:5px 0 0; color:var(--muted); font-size:13px; }
    .actions, .docs { display:flex; flex-wrap:wrap; gap:8px; } .actions button, .doc-link, .secondary-button { border:1px solid #aac0c5; border-radius:6px; background:#fff; color:#075b6b; font-weight:750; padding:10px 12px; }
    .actions button.primary { background:var(--red); border-color:var(--red); color:#fff; }
    .service-grid, .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
    .service-card, .report { min-height:146px; border:1px solid var(--line); background:#fff; padding:16px; display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
    .service-card .service-state { color:var(--amber); } .service-card[data-state="online"] .service-state { color:var(--green); }
    .report > div { min-height:48px; } .report span, .group-label { color:var(--muted); font-size:11px; text-transform:uppercase; font-weight:750; }
    .report strong { color:var(--green); } .report.missing strong, .report.stale strong { color:var(--amber); } .report small { color:var(--muted); overflow-wrap:anywhere; }
    .link-button { border:0; padding:0; background:transparent; color:#07677a; font-weight:800; margin-top:auto; text-align:left; }
    .filters { display:flex; gap:10px; flex-wrap:wrap; margin:18px 0 12px; } .filters select { min-height:40px; border:1px solid #aac0c5; background:#fff; padding:0 10px; border-radius:6px; }
    .capability-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .capability-card { background:#fff; border:1px solid var(--line); padding:17px; min-width:0; display:flex; flex-direction:column; gap:10px; }
    .capability-card[hidden] { display:none; } .capability-top { min-height:25px; display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .status-chip { font-size:11px; font-weight:800; padding:4px 6px; border:1px solid currentColor; border-radius:4px; white-space:nowrap; }
    .status-chip.delivered { color:var(--green); } .status-chip.partial { color:var(--amber); } .status-chip.planned { color:#7352a0; }
    .capability-card > p, .capability-detail p, .intentional p { margin:0; color:var(--muted); line-height:1.48; font-size:13px; }
    details { border-top:1px solid #e2e9eb; padding-top:9px; } summary { color:#174e59; font-size:13px; font-weight:800; cursor:pointer; }
    .capability-detail, .intentional { margin-top:12px; } ul { margin:6px 0 0; padding-left:19px; color:var(--muted); font-size:13px; line-height:1.5; }
    .intentional { border-left:3px solid #d4a22e; padding-left:10px; }
    .evolution-list { display:grid; gap:10px; } .evolution-item { display:grid; grid-template-columns:180px 1fr 1fr; background:#fff; border:1px solid var(--line); }
    .evolution-item > div { padding:15px; border-right:1px solid var(--line); } .evolution-item > div:last-child { border:0; } .evolution-item p { margin:4px 0 0; color:var(--muted); font-size:13px; }
    .coverage-table-wrap { overflow-x:auto; border:1px solid var(--line); background:#fff; } .coverage-table { width:100%; border-collapse:collapse; font-size:13px; }
    .coverage-table th, .coverage-table td { padding:10px; text-align:left; border-bottom:1px solid #dbe5e7; white-space:nowrap; } .coverage-table th small, .coverage-table td span { display:block; color:var(--muted); font-weight:500; }
    .coverage-table tr[data-status="passed"] strong { color:var(--green); } .coverage-table tr[data-status="at-risk"] strong, .coverage-table tr[data-status="stale"] strong { color:var(--amber); } .coverage-table tr[data-status="failed"] strong, .coverage-error { color:var(--red); }
    .notice { border-left:4px solid var(--red); background:#fff; padding:14px 16px; margin-top:24px; }
    dialog { width:min(1180px,calc(100% - 28px)); height:min(850px,calc(100vh - 28px)); padding:0; border:1px solid #8da6ab; box-shadow:0 24px 70px rgba(8,35,41,.35); }
    dialog::backdrop { background:rgba(10,34,40,.64); } .viewer-head { height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--line); background:#fff; }
    .viewer-actions { display:flex; gap:8px; } .viewer-actions a, .viewer-actions button { border:1px solid #aac0c5; background:#fff; color:#075b6b; padding:7px 10px; border-radius:5px; font-weight:750; text-decoration:none; }
    #viewer-frame { width:100%; height:calc(100% - 56px); border:0; background:#fff; }
    @media (max-width:1000px) { .capability-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .metric-grid { grid-template-columns:repeat(2,1fr); } .architecture { grid-template-columns:repeat(2,1fr); } .architecture div:nth-child(2) { border-right:0; } }
    @media (max-width:760px) { .app-shell { display:block; } .sidebar { position:relative; height:auto; padding:16px; gap:12px; } .nav { display:flex; overflow:auto; } .nav a { white-space:nowrap; } .sidebar-note { display:none; } .topbar { top:0; padding:10px 12px; } .top-status { display:none; } main { width:min(100% - 24px,1280px); } .page-header { padding-top:24px; } .page-header h1 { font-size:27px; } .decision-band, .capability-grid, .evolution-item { grid-template-columns:1fr; } .decision { border-right:0; border-bottom:1px solid var(--line); } .evolution-item > div { border-right:0; border-bottom:1px solid var(--line); } }
    @media (max-width:480px) { .metric-grid, .architecture { grid-template-columns:1fr; } .architecture div { border-right:0; border-bottom:1px solid var(--line); } .section-heading { align-items:flex-start; flex-direction:column; } }
  </style>
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar"><div class="brand"><strong>AlwaysTrack</strong><span>Project & Presentation Hub</span></div>
      <nav class="nav" aria-label="Navegacao do Hub"><a href="#overview" data-nav="overview">Visao geral</a><a href="#capabilities" data-nav="capabilities">Capacidades</a><a href="#quality" data-nav="quality">Qualidade</a><a href="#operations" data-nav="operations">Operacao</a><a href="#evolution" data-nav="evolution">Evolucao</a><a href="#docs" data-nav="docs">Documentacao</a></nav>
      <div class="sidebar-note"><strong>Demo local controlada</strong><br>Dados sinteticos e providers fake. Rollout e exposicao externa permanecem bloqueados.</div>
    </aside>
    <div class="workspace"><header class="topbar"><div class="search-wrap"><input id="global-search" type="search" placeholder="Buscar capacidade, relatorio, conector ou documento" aria-label="Pesquisa global do Hub"><div id="search-results" class="search-results" hidden></div></div><span class="top-status" id="top-status">Verificando ambiente</span></header>
      <main>
        <div data-page="overview"><header class="page-header"><p class="eyebrow">Visao executiva</p><h1>Uma porta de entrada para todo o projeto</h1><p>Produto, CaseFlow, qualidade, operacao e decisoes de evolucao reunidos sem confundir evidencia local com prontidao produtiva.</p></header>
          <section class="decision-band"><div class="decision go"><span>Demonstracao controlada</span><strong>GO-WITH-RISK</strong><p>Checkout local, seed e fixtures sinteticos, sem provider live.</p></div><div class="decision no"><span>Rollout interno CaseFlow</span><strong>NO-GO</strong><p>Wiring e gates live por host e conector seguem pendentes.</p></div><div class="decision no"><span>Exposicao externa</span><strong>NO-GO</strong><p>Infra, secrets, recovery e release production-like ainda precisam de prova.</p></div></section>
          <section class="metric-grid"><div class="metric"><strong>${capabilityCatalog.length}</strong><span>capacidades catalogadas</span></div><div class="metric"><strong>6</strong><span>workspaces com gate uniforme</span></div><div class="metric"><strong>982</strong><span>testes locais aprovados</span></div><div class="metric"><strong>34/34</strong><span>E2E executados e aprovados</span></div></section>
          <section class="content-section"><div class="section-heading"><div><p class="eyebrow">Demonstracao</p><h2>Acessos principais</h2></div></div><div class="actions"><button class="primary" type="button" data-open="http://localhost:${webPort}" data-title="AlwaysTrack Web">Abrir AlwaysTrack</button><button type="button" data-page-target="capabilities">Catalogo do produto</button><button type="button" data-page-target="quality">Evidencias de qualidade</button><button type="button" data-open="/view?path=docs/demo/caseflow-guided-demo.md" data-title="Roteiro CaseFlow">Roteiro CaseFlow</button></div></section>
          <section class="content-section"><div class="section-heading"><div><p class="eyebrow">Fronteiras</p><h2>Arquitetura em quatro camadas</h2></div></div><div class="architecture"><div><strong>AlwaysTrack Core</strong><p>Casos, fatos, heuristica, fluxos, mensagens e auditoria.</p></div><div><strong>Companion Host</strong><p>Orquestracao local, cache, timeout e resultados progressivos.</p></div><div><strong>Extensao MV3</strong><p>Side panel, intake, DOM e intervencao humana.</p></div><div><strong>Conectores</strong><p>Adaptadores isolados com drift e degradacao explicitos.</p></div></div></section>
          <section class="notice"><strong>Leitura correta:</strong> o projeto demonstra a visao funcional com profundidade local; os itens restantes estao registrados por dependencia, risco e classe de evidencia.</section>
        </div>
        <div data-page="capabilities" hidden><header class="page-header"><p class="eyebrow">Catalogo do produto</p><h1>Modulos, capacidades e maturidade</h1><p>Cada item explicita o que ja existe, a visao final, as pendencias e por que elas foram preservadas.</p></header><div class="filters"><select id="group-filter" aria-label="Filtrar por grupo"><option value="">Todos os grupos</option>${groupOptions}</select><select id="status-filter" aria-label="Filtrar por maturidade"><option value="">Todas as maturidades</option><option value="delivered">Entregue localmente</option><option value="partial">Parcial / gate externo</option><option value="planned">Planejado intencional</option></select></div><section class="capability-grid" id="capability-grid">${capabilities}</section></div>
        <div data-page="quality" hidden><header class="page-header"><p class="eyebrow">Evidencia executavel</p><h1>Qualidade e demonstracao tecnica</h1><p>Coverage, Playwright, documentacao de API e carga permanecem navegaveis dentro do Hub.</p></header>${coverageSection}<section class="content-section"><div class="section-heading"><div><p class="eyebrow">Relatorios</p><h2>Evidencias navegaveis</h2></div></div><div class="grid">${reportCards}</div></section></div>
        <div data-page="operations" hidden><header class="page-header"><p class="eyebrow">Bancada local</p><h1>Servicos, dados e operacao</h1><p>Estado do ambiente e acessos tecnicos em uma unica superficie, sem depender de dezenas de abas.</p></header><section class="content-section"><div class="service-grid"><article class="service-card" data-service="web"><span>Aplicacao</span><h3>AlwaysTrack Web</h3><strong class="service-state">Verificando</strong><button class="link-button" type="button" data-open="http://localhost:${webPort}" data-title="AlwaysTrack Web">Abrir no Hub</button></article><article class="service-card" data-service="api"><span>Backend</span><h3>API live / ready</h3><strong class="service-state">Verificando</strong><button class="link-button" type="button" data-open="http://localhost:${apiPort}/health/ready" data-title="API readiness">Abrir resposta</button></article>${includeStudio ? `<article class="service-card" data-service="studio"><span>Dados locais</span><h3>Prisma Studio</h3><strong class="service-state">Verificando</strong>${studioLink}</article>` : ""}<article class="service-card" data-service="hub"><span>Apresentacao</span><h3>Presentation Hub</h3><strong class="service-state">Online</strong></article></div></section><section class="content-section"><div class="section-heading"><div><p class="eyebrow">Comandos</p><h2>Rotinas reproduziveis</h2></div></div><div class="architecture"><div><strong>npm run up</strong><p>Setup inteligente, servicos e Hub.</p></div><div><strong>npm run check</strong><p>Lint, types, testes e builds.</p></div><div><strong>npm run coverage:html</strong><p>Seis reports e manifesto.</p></div><div><strong>npm run demo:reset:local</strong><p>Base ficticia reprodutivel.</p></div></div></section></div>
        <div data-page="evolution" hidden><header class="page-header"><p class="eyebrow">Visao final</p><h1>O que falta e por que ficou assim</h1><p>Pendencias intencionais separadas de falhas: cada frente exige uma classe de evidencia ou aprovacao que a demo local nao pode fabricar.</p></header><section class="content-section evolution-list"><article class="evolution-item"><div><strong>Companion live</strong><p>Host e extensao</p></div><div><strong>Visao final</strong><p>Perfil corporativo com wiring, pairing e recovery homologados.</p></div><div><strong>Proximo gate</strong><p>Windows/WSL, Chrome/Edge, firewall, VPN e suspend/resume reais.</p></div></article><article class="evolution-item"><div><strong>Conectores</strong><p>Sistemas externos</p></div><div><strong>Visao final</strong><p>Adaptadores live independentes, observados e com owner.</p></div><div><strong>Proximo gate</strong><p>Credenciais sandbox autorizadas e smoke redigido por sistema.</p></div></article><article class="evolution-item"><div><strong>Infraestrutura</strong><p>Dados e release</p></div><div><strong>Visao final</strong><p>Postgres, Redis, storage, backup/PITR e deploy reproduziveis.</p></div><div><strong>Proximo gate</strong><p>Ambiente production-like, restore e pipeline final observados.</p></div></article><article class="evolution-item"><div><strong>Governanca</strong><p>Legal e seguranca</p></div><div><strong>Visao final</strong><p>Uso de dados e exposicao aprovados pelos owners.</p></div><div><strong>Proximo gate</strong><p>RIPD, Security, Privacy e release gate assinados.</p></div></article><article class="evolution-item"><div><strong>Escala e UX</strong><p>Operacao humana</p></div><div><strong>Visao final</strong><p>Performance e experiencia validadas no contexto diario.</p></div><div><strong>Proximo gate</strong><p>Carga pesada, acessibilidade manual e piloto com operadores.</p></div></article><article class="evolution-item"><div><strong>Agente futuro</strong><p>Fora desta fase</p></div><div><strong>Visao final</strong><p>Agente opcional, restrito por capabilities e auditavel.</p></div><div><strong>Proximo gate</strong><p>Somente apos rollout consultivo, avaliacao e threat model.</p></div></article></section></div>
        <div data-page="docs" hidden><header class="page-header"><p class="eyebrow">Conhecimento do projeto</p><h1>Documentacao e fontes de verdade</h1><p>Arquitetura, demonstracao, testes, operacao e seguranca acessiveis sem sair da central.</p></header>${docsSection}</div>
      </main>
    </div>
  </div>
  <dialog id="viewer"><div class="viewer-head"><strong id="viewer-title">Evidencia</strong><div class="viewer-actions"><a id="viewer-external" href="/" target="_blank" rel="noreferrer">Nova aba</a><button id="viewer-close" type="button">Fechar</button></div></div><iframe id="viewer-frame" title="Visualizador integrado"></iframe></dialog>
  <script>
    const searchIndex = ${safeSearchIndex};
    const pages = [...document.querySelectorAll('[data-page]')];
    const navItems = [...document.querySelectorAll('[data-nav]')];
    const viewer = document.getElementById('viewer');
    const frame = document.getElementById('viewer-frame');
    const viewerTitle = document.getElementById('viewer-title');
    const viewerExternal = document.getElementById('viewer-external');
    function showPage(page) { const target = pages.some((item) => item.dataset.page === page) ? page : 'overview'; pages.forEach((item) => { item.hidden = item.dataset.page !== target; }); navItems.forEach((item) => item.classList.toggle('active', item.dataset.nav === target)); if (location.hash !== '#' + target) history.replaceState(null, '', '#' + target); window.scrollTo(0, 0); }
    function openResource(href, title) { viewerTitle.textContent = title || 'Evidencia'; frame.src = href; viewerExternal.href = href; viewer.showModal(); }
    document.addEventListener('click', (event) => { const open = event.target.closest('[data-open]'); if (open) { openResource(open.dataset.open, open.dataset.title || open.textContent.trim()); return; } const target = event.target.closest('[data-page-target]'); if (target) showPage(target.dataset.pageTarget); });
    document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('close', () => { frame.src = 'about:blank'; });
    navItems.forEach((item) => item.addEventListener('click', (event) => { event.preventDefault(); showPage(item.dataset.nav); }));
    window.addEventListener('hashchange', () => showPage(location.hash.slice(1)));
    const groupFilter = document.getElementById('group-filter'); const statusFilter = document.getElementById('status-filter'); const cards = [...document.querySelectorAll('.capability-card')];
    function filterCapabilities() { cards.forEach((card) => { card.hidden = Boolean((groupFilter.value && card.dataset.group !== groupFilter.value) || (statusFilter.value && card.dataset.status !== statusFilter.value)); }); }
    groupFilter.addEventListener('change', filterCapabilities); statusFilter.addEventListener('change', filterCapabilities);
    const search = document.getElementById('global-search'); const results = document.getElementById('search-results');
    search.addEventListener('input', () => { const query = search.value.trim().toLocaleLowerCase('pt-BR'); if (!query) { results.hidden = true; results.replaceChildren(); return; } const matches = searchIndex.filter((item) => (item.title + ' ' + item.kind + ' ' + item.description).toLocaleLowerCase('pt-BR').includes(query)).slice(0, 12); results.innerHTML = matches.length ? matches.map((item, index) => '<button class="search-result" type="button" data-result="' + index + '"><strong>' + item.title.replaceAll('&','&amp;').replaceAll('<','&lt;') + '</strong><span>' + item.kind + ' - ' + item.description.replaceAll('&','&amp;').replaceAll('<','&lt;') + '</span></button>').join('') : '<div class="search-result"><strong>Nenhum resultado</strong><span>Revise o termo pesquisado.</span></div>'; results.hidden = false; results.querySelectorAll('[data-result]').forEach((button) => button.addEventListener('click', () => { const item = matches[Number(button.dataset.result)]; results.hidden = true; search.value = ''; showPage(item.page); openResource(item.href, item.title); })); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !viewer.open) { results.hidden = true; search.value = ''; } });
    fetch('/__alwaystrack_status').then((response) => response.json()).then((payload) => { const online = Object.values(payload.services).filter(Boolean).length; document.getElementById('top-status').textContent = online + '/' + Object.keys(payload.services).length + ' servicos online'; document.querySelectorAll('[data-service]').forEach((card) => { const active = card.dataset.service === 'hub' || payload.services[card.dataset.service]; card.dataset.state = active ? 'online' : 'offline'; card.querySelector('.service-state').textContent = active ? 'Online' : 'Indisponivel'; }); }).catch(() => { document.getElementById('top-status').textContent = 'Hub local online'; });
    showPage(location.hash.slice(1) || 'overview');
  </script>
</body>
</html>`;
}

export function resolveAllowedFile(rootDir, requestedPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestedPath).replaceAll("\\", "/");
  } catch {
    return null;
  }
  const relative = normalize(decoded).split(sep).join("/").replace(/^\/+/, "");
  if (!relative || relative === "." || relative.includes("../")) return null;
  const allowedPrefix = allowedDirectoryPrefixes.find((prefix) => relative === prefix || relative.startsWith(`${prefix}/`));
  if (!allowedPrefix) return null;
  const absolute = resolve(rootDir, relative);
  if (!absolute.startsWith(`${resolve(rootDir)}${sep}`) || !existsSync(absolute) || !statSync(absolute).isFile()) return null;
  const realAllowedRoot = realpathSync(resolve(rootDir, allowedPrefix));
  const realFile = realpathSync(absolute);
  if (realFile !== realAllowedRoot && !realFile.startsWith(`${realAllowedRoot}${sep}`)) return null;
  return realFile;
}

function documentViewer(rootDir, requestedPath) {
  if (!documentationPaths.some(([, filePath]) => filePath === requestedPath)) return null;
  const absolute = resolve(rootDir, requestedPath);
  if (!existsSync(absolute)) return null;
  const realDocsRoot = realpathSync(resolve(rootDir, "docs"));
  const realFile = realpathSync(absolute);
  if (!realFile.startsWith(`${realDocsRoot}${sep}`)) return null;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${htmlEscape(requestedPath)}</title><style>body{font:16px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;margin:0;background:#edf3f4;color:#17252a}main{max-width:1100px;margin:24px auto;padding:24px;background:#fff;border:1px solid #c8d7da}a{color:#075b6b}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><main><a href="/">Voltar ao hub</a><pre>${htmlEscape(readFileSync(realFile, "utf8"))}</pre></main></body></html>`;
}

async function probe(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(900) });
    return response.ok;
  } catch {
    return false;
  }
}

export function createWorkbenchServer(rootDir, options = {}) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "no-store");
    if (url.pathname === "/__alwaystrack_workbench") {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ service: "alwaystrack-workbench", status: "ready" }));
      return;
    }
    if (url.pathname === "/__alwaystrack_status") {
      const apiPort = options.apiPort ?? 3333;
      const webPort = options.webPort ?? 5173;
      const studioPort = options.studioPort ?? 5555;
      const [api, web, studio] = await Promise.all([
        probe(`http://127.0.0.1:${apiPort}/health/ready`),
        probe(`http://127.0.0.1:${webPort}`),
        options.includeStudio === false ? Promise.resolve(false) : probe(`http://127.0.0.1:${studioPort}`)
      ]);
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ services: { api, web, studio, hub: true }, checkedAt: new Date().toISOString() }));
      return;
    }
    if (url.pathname === "/") {
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.end(buildWorkbenchHtml(rootDir, options));
      return;
    }
    if (url.pathname === "/view") {
      const html = documentViewer(rootDir, url.searchParams.get("path") ?? "");
      if (html) {
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(html);
        return;
      }
    }
    if (url.pathname.startsWith("/files/")) {
      const absolute = resolveAllowedFile(rootDir, url.pathname.slice("/files/".length));
      if (absolute) {
        response.setHeader("Content-Type", mimeTypes.get(extname(absolute).toLowerCase()) ?? "application/octet-stream");
        response.end(readFileSync(absolute));
        return;
      }
    }
    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Not found");
  });
  return { server, port: Number(options.port ?? DEFAULT_PORT) };
}

export function presentationUrls(rootDir, options = {}) {
  const apiPort = options.apiPort ?? 3333;
  const webPort = options.webPort ?? 5173;
  const studioPort = options.studioPort ?? 5555;
  const workbenchPort = options.workbenchPort ?? DEFAULT_PORT;
  const urls = [
    `http://localhost:${workbenchPort}`,
    `http://localhost:${webPort}`,
    `http://localhost:${apiPort}/health/live`,
    `http://localhost:${apiPort}/health/ready`
  ];
  if (options.includeStudio !== false) urls.push(`http://localhost:${studioPort}`);
  for (const [, filePath, category] of reportPaths) {
    if (!reportEnabled(category, options)) continue;
    if (existsSync(resolve(rootDir, filePath))) urls.push(`http://localhost:${workbenchPort}${pathUrl(filePath)}`);
  }
  if (options.includeCoverage !== false && existsSync(resolve(rootDir, "docs/generated/coverage/index.html"))) {
    urls.push(`http://localhost:${workbenchPort}/files/docs/generated/coverage/index.html`);
  }
  const latestPerf = options.includePerformance === false
    ? null
    : latestFile(rootDir, "docs/performance/reports", (name) => name.endsWith(".html"));
  if (latestPerf) {
    const relative = latestPerf.slice(rootDir.length + 1).split(sep).join("/");
    urls.push(`http://localhost:${workbenchPort}${pathUrl(relative)}`);
  }
  if (options.includeDocs !== false) {
    for (const [, filePath] of documentationPaths) {
      if (existsSync(resolve(rootDir, filePath))) urls.push(`http://localhost:${workbenchPort}/view?path=${encodeURIComponent(filePath)}`);
    }
  }
  return [...new Set(urls)];
}

export function browserUrlsToOpen(urls, options = {}) {
  return options.openAll === true && options.hubOnly !== true ? [...urls] : urls.slice(0, 1);
}

function isWsl() {
  if (process.platform !== "linux") return false;
  try {
    return /microsoft|wsl/i.test(readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
}

export function browserCommand(url, platform = process.platform, wsl = isWsl()) {
  if (platform === "darwin") return { command: "open", args: [url] };
  if (platform === "win32") return { command: "cmd.exe", args: ["/d", "/s", "/c", "start", "", url] };
  if (wsl) return { command: "cmd.exe", args: ["/d", "/s", "/c", "start", "", url] };
  return { command: "xdg-open", args: [url] };
}

export function openBrowserUrls(urls) {
  for (const url of urls) {
    const { command, args } = browserCommand(url);
    try {
      const child = spawn(command, args, { detached: true, stdio: "ignore" });
      child.on("error", () => {
        console.warn(`[AlwaysTrack Setup] Nao foi possivel abrir automaticamente: ${url}`);
      });
      child.unref();
    } catch {
      // Browser opening is best effort; URLs remain visible in the terminal and hub.
    }
  }
}
