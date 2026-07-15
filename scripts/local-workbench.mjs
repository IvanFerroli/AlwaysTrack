import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { extname, normalize, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { buildCoverageManifest, coverageManifestHtml } from "./coverage-manifest.mjs";

const DEFAULT_PORT = 4173;

export const documentationPaths = [
  ["Estrategia de testes", "docs/testing/strategy.md"],
  ["Playwright e CI", "docs/testing/playwright-ci.md"],
  ["Politica de coverage", "docs/testing/coverage-policy.md"],
  ["Performance", "docs/performance/README.md"],
  ["OpenAPI v1", "docs/api/openapi.v1.yaml"],
  ["Arquitetura CaseFlow", "docs/architecture/caseflow-architecture.md"],
  ["Roteiro CaseFlow", "docs/demo/caseflow-guided-demo.md"],
  ["Checklist da demo", "docs/demo/always-track-demo-checklist.md"],
  ["Decisao de prontidao", "docs/operations/project-readiness-decision.md"],
  ["Ledger de prontidao", "docs/operations/project-readiness-ledger.md"],
  ["Gate de exposicao", "docs/security/external-exposure-release-gate.md"],
  ["Backup e restore", "docs/operations/backup-restore-runbook.md"],
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
  return `<article class="report ${fresh ? "ready" : "stale"}"><div><span>${htmlEscape(category)}</span><h3>${htmlEscape(label)}</h3></div><strong>${htmlEscape(detail)}</strong><small>${htmlEscape(statSync(absolute).mtime.toLocaleString("pt-BR"))}</small><a href="${pathUrl(filePath)}">Abrir</a></article>`;
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
    .map(([label, filePath]) => `<a href="/view?path=${encodeURIComponent(filePath)}">${htmlEscape(label)}</a>`)
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
  const studioLink = includeStudio ? `<a href="http://localhost:${studioPort}">Prisma Studio</a>` : "";
  const docsSection = options.includeDocs === false
    ? ""
    : `<section><h2>Documentacao essencial</h2><div class="docs">${documentationLinks(rootDir)}</div></section>`;
  let coverageSection = "";
  if (options.includeCoverage !== false) {
    try {
      const manifest = buildCoverageManifest(rootDir);
      coverageSection = `<section><div class="section-heading"><div><h2>Coverage comparativo</h2><p>Quatro metricas, pisos reais, margem e arquivos zerados. Sem media composta.</p></div><a href="/files/docs/generated/coverage/index.html">Abrir scorecard</a></div>${coverageManifestHtml(manifest, { compact: true })}</section>`;
    } catch (error) {
      coverageSection = `<section><h2>Coverage comparativo</h2><p class="coverage-error">Manifesto indisponivel: ${htmlEscape(error.message)}</p></section>`;
    }
  }
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AlwaysTrack Presentation Hub</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17252a; background: #edf3f4; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    header { background: #12343b; color: #fff; padding: 28px max(24px, calc((100vw - 1180px) / 2)); }
    header p { color: #b7d8dc; margin: 6px 0 0; }
    main { width: min(1180px, calc(100% - 32px)); margin: 24px auto 56px; }
    section { margin-top: 28px; }
    h1 { font-size: clamp(28px, 4vw, 44px); margin: 0; letter-spacing: 0; }
    h2 { font-size: 21px; margin: 0 0 12px; letter-spacing: 0; }
    h3 { font-size: 16px; margin: 4px 0 0; letter-spacing: 0; }
    .actions, .docs { display: flex; flex-wrap: wrap; gap: 9px; }
    a { color: #075b6b; font-weight: 750; text-decoration: none; }
    .actions a, .docs a { border: 1px solid #afc8cd; border-radius: 7px; background: #fff; padding: 10px 13px; }
    .actions a:first-child { background: #c43e2f; border-color: #c43e2f; color: #fff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .report { min-height: 150px; border: 1px solid #c8d7da; border-radius: 8px; background: #fff; padding: 16px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
    .report > div { min-height: 50px; }
    .report span { color: #60767b; font-size: 12px; text-transform: uppercase; }
    .report strong { color: #167052; }
    .report.missing strong, .report.stale strong { color: #9a5a00; }
    .report small { color: #60767b; overflow-wrap: anywhere; }
    .report a { margin-top: auto; }
    .section-heading { display: flex; justify-content: space-between; gap: 16px; align-items: end; }
    .section-heading p { margin: 4px 0 0; color: #52696e; }
    .coverage-table-wrap { overflow-x: auto; border: 1px solid #c8d7da; background: #fff; }
    .coverage-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .coverage-table th, .coverage-table td { padding: 10px; text-align: left; border-bottom: 1px solid #dbe5e7; white-space: nowrap; }
    .coverage-table th small, .coverage-table td span { display: block; color: #60767b; font-weight: 500; }
    .coverage-table tr[data-status="passed"] strong { color: #167052; }
    .coverage-table tr[data-status="at-risk"] strong, .coverage-table tr[data-status="stale"] strong { color: #9a5a00; }
    .coverage-table tr[data-status="failed"] strong, .coverage-table tr[data-status="invalid"] strong, .coverage-error { color: #b33424; }
    .notice { border-left: 4px solid #d94f3d; background: #fff; padding: 14px 16px; }
    @media (max-width: 600px) { header { padding: 22px 16px; } main { width: min(100% - 24px, 1180px); } .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header><h1>AlwaysTrack Presentation Hub</h1><p>Aplicacao, qualidade, documentacao, carga e operacao em uma unica bancada local.</p></header>
  <main>
    <section><h2>Servicos</h2><div class="actions"><a href="http://localhost:${webPort}">AlwaysTrack</a><a href="http://localhost:${apiPort}/health/live">API live</a><a href="http://localhost:${apiPort}/health/ready">API ready</a>${studioLink}</div></section>
    ${coverageSection}
    <section><h2>Evidencias navegaveis</h2><div class="grid">${reportCards}</div></section>
    ${docsSection}
    <section class="notice"><strong>Escopo da evidencia:</strong> artefatos locais e sinteticos nao promovem rollout nem exposicao externa.</section>
  </main>
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

export function createWorkbenchServer(rootDir, options = {}) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cache-Control", "no-store");
    if (url.pathname === "/__alwaystrack_workbench") {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify({ service: "alwaystrack-workbench", status: "ready" }));
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
