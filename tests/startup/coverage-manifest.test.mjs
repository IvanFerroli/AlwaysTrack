import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildCoverageManifest, coverageManifestHtml, readCoverageThresholds } from "../../scripts/coverage-manifest.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "alwaystrack-coverage-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ devDependencies: { vitest: "3.2.6" } }));
  writeFileSync(join(root, "package-lock.json"), "{}");
  for (const workspace of ["packages/shared", "apps/companion-extension", "apps/smartscript-companion", "apps/web", "services/api", "services/companion-host"]) {
    mkdirSync(join(root, workspace, "src"), { recursive: true });
    mkdirSync(join(root, workspace, "coverage"), { recursive: true });
    writeFileSync(join(root, workspace, "src/index.ts"), "export const value = 1;");
    writeFileSync(join(root, workspace, "vitest.config.ts"), `import { defineConfig } from "vitest/config"; export default defineConfig({ test: { coverage: { thresholds: { statements: 50, lines: 50, branches: 40, functions: 60, "src/critical.ts": { statements: 90, lines: 90 } } } } });`);
    const filePath = join(root, workspace, "src/index.ts");
    const criticalPath = join(root, workspace, "src/critical.ts");
    writeFileSync(criticalPath, "export const critical = true;");
    writeFileSync(join(root, workspace, "coverage/coverage-summary.json"), JSON.stringify({
      total: {
        lines: { total: 10, covered: workspace === "apps/web" ? 5 : 8, skipped: 0, pct: workspace === "apps/web" ? 50 : 80 },
        statements: { total: 10, covered: 8, skipped: 0, pct: 80 },
        branches: { total: 0, covered: 0, skipped: 0, pct: 100 },
        functions: { total: 10, covered: 8, skipped: 0, pct: 80 }
      },
      [filePath]: { lines: { total: 10, covered: workspace === "apps/web" ? 0 : 8, pct: workspace === "apps/web" ? 0 : 80 } },
      [criticalPath]: {
        lines: { total: 1, covered: 1, pct: 100 }, statements: { total: 1, covered: 1, pct: 100 },
        branches: { total: 0, covered: 0, pct: 100 }, functions: { total: 0, covered: 0, pct: 100 }
      }
    }));
  }
  return root;
}

test("parses global and critical thresholds through the TypeScript AST", () => {
  const root = fixture();
  const thresholds = readCoverageThresholds(join(root, "apps/web/vitest.config.ts"));
  assert.deepEqual(thresholds.global, { statements: 50, lines: 50, branches: 40, functions: 60 });
  assert.deepEqual(thresholds.critical["src/critical.ts"], { statements: 90, lines: 90 });
});

test("builds six auditable workspace records without averaging metrics", () => {
  const manifest = buildCoverageManifest(fixture(), { commit: "abc123", now: new Date("2026-07-15T12:00:00Z") });
  assert.equal(manifest.workspaces.length, 6);
  assert.equal(manifest.commit, "abc123");
  assert.equal(manifest.classification, "local");
  const web = manifest.workspaces.find((workspace) => workspace.id === "web");
  assert.deepEqual(web.metrics.lines, { covered: 5, total: 10, skipped: 0, pct: 50 });
  assert.equal(web.metrics.branches.pct, null);
  assert.equal(web.zeroFiles.length, 1);
  assert.equal(web.criticalFiles[0].status, "passed");
  assert.deepEqual(
    { owner: web.criticalFiles[0].owner, risk: web.criticalFiles[0].risk, task: web.criticalFiles[0].task },
    { owner: "web/product", risk: "P0", task: "TASK-AT-339" }
  );
  assert.equal(web.status, "at-risk");
});

test("renders N/A for empty counters and preserves raw numerators", () => {
  const manifest = buildCoverageManifest(fixture(), { commit: "abc123" });
  const html = coverageManifestHtml(manifest);
  assert.match(html, /5\/10 \(50%\)/);
  assert.match(html, /margem \+0 pp/);
  assert.match(html, />N\/A</);
  assert.match(html, /role="region"[^>]+tabindex="0"/);
  assert.doesNotMatch(html, /score/i);
});

test("reports missing and invalid workspace summaries explicitly", () => {
  const root = fixture();
  unlinkSync(join(root, "services/companion-host/coverage/coverage-summary.json"));
  writeFileSync(join(root, "services/api/coverage/coverage-summary.json"), "{invalid");

  const manifest = buildCoverageManifest(root, { commit: "abc123" });
  assert.equal(manifest.workspaces.find((workspace) => workspace.id === "host").status, "missing");
  assert.equal(manifest.workspaces.find((workspace) => workspace.id === "api").status, "invalid");
});
