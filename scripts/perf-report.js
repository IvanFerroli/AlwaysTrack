import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const mode = process.argv[2];
const args = process.argv.slice(3);
const targetArg = args.find((arg) => arg.startsWith("--target="));
const target = targetArg?.slice("--target=".length);
const quiet = args.includes("--quiet");
const seedPassword = process.env.SEED_ADMIN_PASSWORD;
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportsDir = resolve(rootDir, "docs/performance/reports");

function usage() {
  console.error("Usage: node scripts/perf-report.js <smoke|1000> --target=<api-url>");
  process.exit(1);
}

function isLocalTarget(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname) || url.hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readMetric(summary, name, field, fallback = "-") {
  return summary.aggregate?.summaries?.[name]?.[field] ?? summary.aggregate?.rates?.[name] ?? fallback;
}

function readCounter(summary, name) {
  return summary.aggregate?.counters?.[name] ?? 0;
}

function endpointRows(summary) {
  const summaries = summary.aggregate?.summaries ?? {};
  return Object.entries(summaries)
    .filter(([name]) => name.startsWith("plugins.metrics-by-endpoint.response_time."))
    .map(([name, metric]) => {
      const endpoint = name.replace("plugins.metrics-by-endpoint.response_time.", "");
      return `<tr><td>${htmlEscape(endpoint)}</td><td>${metric.count ?? "-"}</td><td>${metric.mean ?? "-"}</td><td>${metric.p95 ?? "-"}</td><td>${metric.p99 ?? "-"}</td><td>${metric.max ?? "-"}</td></tr>`;
    })
    .join("\n");
}

function renderPerformanceHtml({ summary, modeLabel, targetUrl, scenario, capturedAt, diagnosticsBefore, diagnosticsAfter }) {
  const counters = summary.aggregate?.counters ?? {};
  const statusRows = Object.entries(counters)
    .filter(([name]) => name.startsWith("http.codes."))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `<tr><td>${htmlEscape(name.replace("http.codes.", "HTTP "))}</td><td>${value}</td></tr>`)
    .join("\n");
  const decision =
    modeLabel === "1000"
      ? "Benchmark de ambiente stage/producao-like. Revisar p95, taxa de erro, recursos e diagnosticos antes de declarar PASS/FAIL."
      : "Smoke local diagnostico. Serve para detectar regressao grosseira, nao para provar 1000 usuarios simultaneos.";

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AlwaysTrack Performance Report</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #102a33; background: #eef5f5; }
    body { margin: 0; padding: 32px; }
    main { max-width: 1180px; margin: 0 auto; }
    header, section { background: #fff; border: 1px solid #d7e3e7; border-radius: 10px; padding: 24px; box-shadow: 0 18px 40px rgba(16, 42, 51, 0.08); margin-bottom: 18px; }
    h1, h2 { margin: 0 0 12px; line-height: 1.1; }
    .meta { color: #637083; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .card { border: 1px solid #d7e3e7; border-radius: 8px; padding: 16px; background: #f8fbfb; }
    .label { color: #637083; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .value { font-size: 26px; font-weight: 900; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e7eef0; padding: 10px; text-align: left; }
    th { color: #304054; font-size: 12px; text-transform: uppercase; }
    pre { overflow: auto; background: #0b2530; color: #e6f4f1; padding: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="meta">AlwaysTrack Performance</p>
      <h1>${htmlEscape(modeLabel.toUpperCase())} report</h1>
      <p class="meta">Capturado em ${htmlEscape(capturedAt)} | Target ${htmlEscape(targetUrl)} | Scenario ${htmlEscape(scenario)}</p>
    </header>
    <section class="grid">
      <div class="card"><div class="label">Requests</div><div class="value">${readCounter(summary, "http.requests")}</div></div>
      <div class="card"><div class="label">VUsers completos</div><div class="value">${readCounter(summary, "vusers.completed")}</div></div>
      <div class="card"><div class="label">Falhas VUser</div><div class="value">${readCounter(summary, "vusers.failed")}</div></div>
      <div class="card"><div class="label">Request rate</div><div class="value">${readMetric(summary, "http.request_rate", "mean", summary.aggregate?.rates?.["http.request_rate"] ?? "-")}/s</div></div>
      <div class="card"><div class="label">p95 geral</div><div class="value">${readMetric(summary, "http.response_time", "p95")} ms</div></div>
      <div class="card"><div class="label">p99 geral</div><div class="value">${readMetric(summary, "http.response_time", "p99")} ms</div></div>
    </section>
    <section>
      <h2>Decisao operacional</h2>
      <p>${htmlEscape(decision)}</p>
    </section>
    <section>
      <h2>Status HTTP</h2>
      <table><thead><tr><th>Status</th><th>Total</th></tr></thead><tbody>${statusRows}</tbody></table>
    </section>
    <section>
      <h2>Endpoints</h2>
      <table><thead><tr><th>Endpoint</th><th>Count</th><th>Mean ms</th><th>p95 ms</th><th>p99 ms</th><th>Max ms</th></tr></thead><tbody>${endpointRows(summary)}</tbody></table>
    </section>
    <section>
      <h2>Diagnostico antes</h2>
      <pre>${htmlEscape(JSON.stringify(diagnosticsBefore, null, 2))}</pre>
    </section>
    <section>
      <h2>Diagnostico depois</h2>
      <pre>${htmlEscape(JSON.stringify(diagnosticsAfter, null, 2))}</pre>
    </section>
  </main>
</body>
</html>
`;
}

async function diagnosticsSnapshot(baseUrl, label) {
  if (!seedPassword) return { skipped: "SEED_ADMIN_PASSWORD is required for diagnostics snapshot." };
  try {
    const login = await fetch(`${baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: seedPassword })
    });
    if (!login.ok) return { skipped: `login failed with HTTP ${login.status}` };
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    const metrics = await fetch(`${baseUrl}/v1/diagnostics/http-metrics`, {
      headers: cookie ? { cookie } : undefined
    });
    if (!metrics.ok) return { skipped: `diagnostics failed with HTTP ${metrics.status}` };
    return { label, capturedAt: new Date().toISOString(), payload: await metrics.json() };
  } catch (error) {
    return { skipped: error instanceof Error ? error.message : "diagnostics snapshot failed" };
  }
}

if (!mode || !["smoke", "1000"].includes(mode)) usage();
if (!target) usage();
if (!seedPassword) {
  console.error("SEED_ADMIN_PASSWORD is required so Artillery can authenticate.");
  process.exit(1);
}
if (mode === "1000" && isLocalTarget(target)) {
  console.error("perf:1000:report must target stage/prod-like infrastructure, not localhost. Use perf:smoke:report for local diagnostics.");
  process.exit(1);
}

mkdirSync(reportsDir, { recursive: true });

const scenario = mode === "smoke" ? "tests/performance/alwaystrack-smoke.yml" : "tests/performance/alwaystrack-1000.yml";
const prefix = `${mode}-${timestamp}`;
const jsonPath = resolve(reportsDir, `${prefix}.json`);
const htmlPath = resolve(reportsDir, `${prefix}.html`);
const logPath = resolve(reportsDir, `${prefix}.log`);
const diagnosticsBeforePath = resolve(reportsDir, `${prefix}-diagnostics-before.json`);
const diagnosticsAfterPath = resolve(reportsDir, `${prefix}-diagnostics-after.json`);
const summaryPath = resolve(reportsDir, `${prefix}.md`);

const before = await diagnosticsSnapshot(target, "before");
writeFileSync(diagnosticsBeforePath, `${JSON.stringify(before, null, 2)}\n`);

const artilleryOutput = execFileSync("npx", ["artillery", "run", scenario, "--target", target, "--output", jsonPath], {
  cwd: rootDir,
  env: process.env,
  encoding: "utf8",
  stdio: quiet ? "pipe" : "inherit"
});
if (quiet) writeFileSync(logPath, artilleryOutput);

const after = await diagnosticsSnapshot(target, "after");
writeFileSync(diagnosticsAfterPath, `${JSON.stringify(after, null, 2)}\n`);
const summary = JSON.parse(readFileSync(jsonPath, "utf8"));
writeFileSync(
  htmlPath,
  renderPerformanceHtml({
    summary,
    modeLabel: mode,
    targetUrl: target.replace(/\/\/[^/@]+@/, "//***@"),
    scenario,
    capturedAt: new Date().toISOString(),
    diagnosticsBefore: before,
    diagnosticsAfter: after
  })
);

writeFileSync(
  summaryPath,
  [
    `# AlwaysTrack Performance Report - ${mode}`,
    "",
    `- captured-at: ${new Date().toISOString()}`,
    `- target: ${target.replace(/\/\/[^/@]+@/, "//***@")}`,
    `- scenario: ${scenario}`,
    `- artillery-json: ${jsonPath}`,
    `- artillery-html: ${htmlPath}`,
    quiet ? `- artillery-log: ${logPath}` : null,
    `- diagnostics-before: ${diagnosticsBeforePath}`,
    `- diagnostics-after: ${diagnosticsAfterPath}`,
    "",
    "## Decision",
    mode === "1000"
      ? "Fill PASS/FAIL/INCONCLUSIVE after reviewing p95, HTTP error rate, resource usage and diagnostics."
      : "Local smoke/diagnostic only. This is not evidence for 1000 concurrent users.",
    "",
    "## SLO",
    "- p95 API read <= 500 ms in target environment.",
    "- p95 critical write <= 1000 ms.",
    "- HTTP error rate < 1%.",
    "- Memory must not grow without bound.",
    ""
  ].filter(Boolean).join("\n")
);

console.log(`[perf-report] wrote ${summaryPath}`);
console.log(`[perf-report] wrote ${htmlPath}`);
