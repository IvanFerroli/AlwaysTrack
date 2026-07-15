import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";

export const coverageWorkspaces = [
  { id: "shared", label: "Shared", owner: "platform/contracts", root: "packages/shared", risk: "P0", upliftTask: "TASK-AT-344" },
  { id: "extension", label: "Extension", owner: "companion/extension", root: "apps/companion-extension", risk: "P0", upliftTask: "TASK-AT-343" },
  { id: "smartscript", label: "SmartScript", owner: "companion/smartscript", root: "apps/smartscript-companion", risk: "P1", upliftTask: "TASK-AT-342" },
  { id: "web", label: "Web", owner: "web/product", root: "apps/web", risk: "P0", upliftTask: "TASK-AT-339" },
  { id: "api", label: "API", owner: "api/core", root: "services/api", risk: "P0", upliftTask: "TASK-AT-345" },
  { id: "host", label: "Companion Host", owner: "companion/host", root: "services/companion-host", risk: "P0", upliftTask: "TASK-AT-347" }
];

const metricNames = ["lines", "statements", "branches", "functions"];

function propertyName(node) {
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) return node.name.text;
  return null;
}

function objectProperty(object, name) {
  if (!object || !ts.isObjectLiteralExpression(object)) return null;
  const property = object.properties.find((item) => ts.isPropertyAssignment(item) && propertyName(item) === name);
  return property?.initializer ?? null;
}

function numericValue(node) {
  if (node && ts.isNumericLiteral(node)) return Number(node.text);
  if (node && ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text);
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }
  return null;
}

export function readCoverageThresholds(configPath) {
  if (!existsSync(configPath)) return { global: {}, critical: {} };
  const source = ts.createSourceFile(configPath, readFileSync(configPath, "utf8"), ts.ScriptTarget.Latest, true);
  let configObject = null;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === "defineConfig" && node.arguments[0]) {
      configObject = node.arguments[0];
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  const thresholds = objectProperty(objectProperty(objectProperty(configObject, "test"), "coverage"), "thresholds");
  const result = { global: {}, critical: {} };
  if (!thresholds || !ts.isObjectLiteralExpression(thresholds)) return result;
  for (const property of thresholds.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = propertyName(property);
    if (!name) continue;
    const numeric = numericValue(property.initializer);
    if (metricNames.includes(name) && numeric !== null) {
      result.global[name] = numeric;
      continue;
    }
    if (ts.isObjectLiteralExpression(property.initializer)) {
      const critical = {};
      for (const item of property.initializer.properties) {
        if (!ts.isPropertyAssignment(item)) continue;
        const metric = propertyName(item);
        const value = numericValue(item.initializer);
        if (metric && value !== null) critical[metric] = value;
        if (metric && /^\d+(?:\.\d+)?$/.test(metric) && item.initializer.kind === ts.SyntaxKind.TrueKeyword) {
          critical.all = Number(metric);
        }
      }
      result.critical[name] = critical;
    }
  }
  return result;
}

function newestMtime(path) {
  if (!existsSync(path)) return 0;
  const info = statSync(path);
  if (info.isFile()) return info.mtimeMs;
  if (!info.isDirectory()) return 0;
  return readdirSync(path).reduce((latest, entry) => Math.max(latest, newestMtime(resolve(path, entry))), 0);
}

function normalizeMetric(metric) {
  const total = Number(metric?.total ?? 0);
  const covered = Number(metric?.covered ?? 0);
  return {
    covered,
    total,
    skipped: Number(metric?.skipped ?? 0),
    pct: total === 0 ? null : Number(metric?.pct ?? (covered / total) * 100)
  };
}

function gitSha(rootDir) {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: rootDir, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function criticalFileManifest(rootDir, workspace, summary, [filePath, requirements]) {
  const absolute = resolve(rootDir, workspace.root, filePath);
  const metadata = { owner: workspace.owner, risk: workspace.risk, task: workspace.upliftTask };
  const entry = Object.entries(summary).find(([name]) => resolve(rootDir, name) === absolute)?.[1];
  if (!entry) return { path: filePath, ...metadata, status: "missing", requirements, metrics: {} };
  const metrics = Object.fromEntries(metricNames.map((name) => [name, normalizeMetric(entry[name])]));
  const failedMetrics = metricNames.filter((name) => {
    const required = requirements[name] ?? requirements.all;
    return required !== undefined && metrics[name].pct !== null && metrics[name].pct < required;
  });
  return { path: filePath, ...metadata, status: failedMetrics.length ? "failed" : "passed", requirements, metrics, failedMetrics };
}

function workspaceManifest(rootDir, workspace) {
  const summaryPath = resolve(rootDir, workspace.root, "coverage/coverage-summary.json");
  const configPath = resolve(rootDir, workspace.root, "vitest.config.ts");
  const thresholds = readCoverageThresholds(configPath);
  const base = { ...workspace, summaryPath: relative(rootDir, summaryPath).split(sep).join("/"), thresholds };
  if (!existsSync(summaryPath)) return { ...base, status: "missing", fresh: false, metrics: {}, zeroFiles: [], criticalFiles: [] };
  try {
    const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
    const metrics = Object.fromEntries(metricNames.map((name) => [name, normalizeMetric(summary.total?.[name])]));
    const zeroFiles = Object.entries(summary)
      .filter(([name, value]) => name !== "total" && Number(value?.lines?.total ?? 0) > 0 && Number(value?.lines?.covered ?? 0) === 0)
      .map(([name]) => relative(rootDir, name).split(sep).join("/"))
      .sort();
    const criticalFiles = Object.entries(thresholds.critical).map((entry) => criticalFileManifest(rootDir, workspace, summary, entry));
    const fresh = statSync(summaryPath).mtimeMs >= Math.max(
      newestMtime(resolve(rootDir, workspace.root, "src")),
      newestMtime(resolve(rootDir, workspace.root, "test")),
      newestMtime(configPath),
      newestMtime(resolve(rootDir, "package-lock.json"))
    );
    const margins = Object.fromEntries(metricNames.map((name) => {
      const threshold = thresholds.global[name];
      const pct = metrics[name].pct;
      return [name, threshold === undefined || pct === null ? null : Number((pct - threshold).toFixed(2))];
    }));
    const failed = metricNames.some((name) => margins[name] !== null && margins[name] < 0) || criticalFiles.some((file) => file.status !== "passed");
    const atRisk = !failed && metricNames.some((name) => margins[name] !== null && margins[name] < 2);
    return {
      ...base,
      status: !fresh ? "stale" : failed ? "failed" : atRisk ? "at-risk" : "passed",
      fresh,
      generatedAt: statSync(summaryPath).mtime.toISOString(),
      metrics,
      margins,
      zeroFiles,
      criticalFiles
    };
  } catch (error) {
    return { ...base, status: "invalid", fresh: false, metrics: {}, zeroFiles: [], criticalFiles: [], error: error.message };
  }
}

export function buildCoverageManifest(rootDir, options = {}) {
  const packageJson = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf8"));
  return {
    schemaVersion: 1,
    classification: "local",
    generatedAt: (options.now ?? new Date()).toISOString(),
    commit: options.commit ?? gitSha(rootDir),
    runtime: {
      node: process.version,
      vitest: packageJson.devDependencies?.vitest ?? packageJson.dependencies?.vitest ?? "unknown"
    },
    workspaces: coverageWorkspaces.map((workspace) => workspaceManifest(rootDir, workspace))
  };
}

function htmlEscape(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function metricCell(workspace, metric) {
  const value = workspace.metrics?.[metric];
  if (!value || value.pct === null) return "N/A";
  const threshold = workspace.thresholds.global[metric];
  const thresholdText = threshold === undefined ? "sem piso" : `piso ${threshold}%`;
  const margin = workspace.margins?.[metric];
  const marginText = margin === null || margin === undefined ? "" : ` · margem ${margin >= 0 ? "+" : ""}${margin} pp`;
  return `${value.covered}/${value.total} (${value.pct}%) · ${thresholdText}${marginText}`;
}

export function coverageManifestHtml(manifest, options = {}) {
  const compact = options.compact === true;
  const rows = manifest.workspaces.map((workspace) => {
    const criticalPassed = workspace.criticalFiles?.filter((file) => file.status === "passed").length ?? 0;
    const criticalTotal = workspace.criticalFiles?.length ?? 0;
    return `<tr data-status="${htmlEscape(workspace.status)}"><th>${htmlEscape(workspace.label)}<small>${htmlEscape(workspace.owner)}</small></th>${metricNames.map((metric) => `<td><span>${htmlEscape(metric)}</span>${htmlEscape(metricCell(workspace, metric))}</td>`).join("")}<td>${workspace.zeroFiles.length}</td><td>${criticalTotal ? `${criticalPassed}/${criticalTotal}` : "N/A"}</td><td><strong>${htmlEscape(workspace.status)}</strong></td></tr>`;
  }).join("");
  const table = `<div class="coverage-table-wrap" role="region" aria-label="Coverage comparativo por workspace" tabindex="0"><table class="coverage-table"><thead><tr><th>Workspace</th>${metricNames.map((name) => `<th>${htmlEscape(name)}</th>`).join("")}<th>Arquivos 0%</th><th>Criticos</th><th>Gate</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  if (compact) return table;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AlwaysTrack Coverage</title><style>body{font:15px/1.45 system-ui;margin:24px;color:#17252a;background:#edf3f4}main{max-width:1400px;margin:auto}small,span{display:block;color:#60767b}.coverage-table-wrap{overflow:auto;background:#fff;border:1px solid #c8d7da}.coverage-table{width:100%;border-collapse:collapse}.coverage-table th,.coverage-table td{padding:12px;text-align:left;border-bottom:1px solid #dbe5e7;white-space:nowrap}tr[data-status=passed] strong{color:#167052}tr[data-status=at-risk] strong,tr[data-status=stale] strong{color:#9a5a00}tr[data-status=failed] strong,tr[data-status=invalid] strong{color:#b33424}</style></head><body><main><h1>Coverage por workspace</h1><p>Commit ${htmlEscape(manifest.commit)} · evidencia ${htmlEscape(manifest.classification)} · ${htmlEscape(manifest.generatedAt)}</p>${table}</main></body></html>`;
}

export function writeCoverageManifest(rootDir, outputDir = "docs/generated/coverage") {
  const manifest = buildCoverageManifest(rootDir);
  const absolute = resolve(rootDir, outputDir);
  mkdirSync(absolute, { recursive: true });
  writeFileSync(resolve(absolute, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(resolve(absolute, "index.html"), coverageManifestHtml(manifest));
  return { manifest, outputDir: absolute };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rootDir = resolve(import.meta.dirname, "..");
  const { manifest, outputDir } = writeCoverageManifest(rootDir);
  const invalid = manifest.workspaces.filter((workspace) => ["missing", "invalid", "failed"].includes(workspace.status));
  console.log(`[coverage-manifest] wrote ${relative(rootDir, outputDir)}/manifest.json and index.html`);
  for (const workspace of manifest.workspaces) console.log(`[coverage-manifest] ${workspace.label}: ${workspace.status}`);
  if (invalid.length) process.exitCode = 1;
}
