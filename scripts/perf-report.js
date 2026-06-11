import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const mode = process.argv[2];
const args = process.argv.slice(3);
const targetArg = args.find((arg) => arg.startsWith("--target="));
const target = targetArg?.slice("--target=".length);
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
const diagnosticsBeforePath = resolve(reportsDir, `${prefix}-diagnostics-before.json`);
const diagnosticsAfterPath = resolve(reportsDir, `${prefix}-diagnostics-after.json`);
const summaryPath = resolve(reportsDir, `${prefix}.md`);

const before = await diagnosticsSnapshot(target, "before");
writeFileSync(diagnosticsBeforePath, `${JSON.stringify(before, null, 2)}\n`);

execFileSync("npx", ["artillery", "run", scenario, "--target", target, "--output", jsonPath], {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit"
});
execFileSync("npx", ["artillery", "report", jsonPath, "--output", htmlPath], {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit"
});

const after = await diagnosticsSnapshot(target, "after");
writeFileSync(diagnosticsAfterPath, `${JSON.stringify(after, null, 2)}\n`);

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
  ].join("\n")
);

console.log(`[perf-report] wrote ${summaryPath}`);
