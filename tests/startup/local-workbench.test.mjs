import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import {
  artifactsAreFresh,
  browserCommand,
  buildWorkbenchHtml,
  createWorkbenchServer,
  presentationUrls,
  resolveAllowedFile
} from "../../scripts/local-workbench.mjs";

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), "alwaystrack-workbench-"));
  mkdirSync(join(root, "docs/generated/typedoc"), { recursive: true });
  mkdirSync(join(root, "docs/testing"), { recursive: true });
  mkdirSync(join(root, "services/api/coverage"), { recursive: true });
  writeFileSync(join(root, "docs/generated/typedoc/index.html"), "<h1>TypeDoc</h1>");
  writeFileSync(join(root, "docs/testing/strategy.md"), "# Strategy");
  writeFileSync(join(root, "services/api/coverage/index.html"), "<h1>Coverage</h1>");
  writeFileSync(
    join(root, "services/api/coverage/coverage-summary.json"),
    JSON.stringify({ total: { lines: { pct: 91.25 } } })
  );
  writeFileSync(join(root, ".env"), "SECRET=do-not-serve");
  return root;
}

test("renders a presentation hub with services, reports and coverage percentages", () => {
  const root = fixtureRoot();
  const html = buildWorkbenchHtml(root, { apiPort: 9001, webPort: 9002, includeStudio: false });

  assert.match(html, /AlwaysTrack Presentation Hub/);
  assert.match(html, /http:\/\/localhost:9002/);
  assert.match(html, /http:\/\/localhost:9001\/health\/ready/);
  assert.match(html, /91\.25% linhas/);
  assert.doesNotMatch(html, /Prisma Studio/);
});

test("serves only allowlisted artifact directories and blocks repository secrets", async () => {
  const root = fixtureRoot();
  const { server } = createWorkbenchServer(root, { port: 0 });
  servers.push(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  const artifact = await fetch(`http://127.0.0.1:${port}/files/docs/generated/typedoc/index.html`);
  const traversal = await fetch(`http://127.0.0.1:${port}/files/%2e%2e/.env`);
  const secret = await fetch(`http://127.0.0.1:${port}/files/.env`);
  const marker = await fetch(`http://127.0.0.1:${port}/__alwaystrack_workbench`);

  assert.equal(artifact.status, 200);
  assert.equal(await artifact.text(), "<h1>TypeDoc</h1>");
  assert.equal(traversal.status, 404);
  assert.equal(secret.status, 404);
  assert.deepEqual(await marker.json(), { service: "alwaystrack-workbench", status: "ready" });
});

test("resolves allowlisted paths without accepting traversal", () => {
  const root = fixtureRoot();
  symlinkSync(join(root, ".env"), join(root, "docs/generated/typedoc/leak.txt"));

  assert.equal(resolveAllowedFile(root, "docs/generated/typedoc/index.html"), join(root, "docs/generated/typedoc/index.html"));
  assert.equal(resolveAllowedFile(root, "../.env"), null);
  assert.equal(resolveAllowedFile(root, "%2e%2e/.env"), null);
  assert.equal(resolveAllowedFile(root, ".env"), null);
  assert.equal(resolveAllowedFile(root, "docs/generated/typedoc/leak.txt"), null);
});

test("builds a complete, deduplicated list of browser tabs from available artifacts", () => {
  const root = fixtureRoot();
  const urls = presentationUrls(root, { workbenchPort: 4444, includeStudio: false });

  assert.equal(urls[0], "http://localhost:4444");
  assert.ok(urls.includes("http://localhost:5173"));
  assert.ok(urls.includes("http://localhost:3333/health/live"));
  assert.ok(urls.includes("http://localhost:4444/files/docs/generated/typedoc/index.html"));
  assert.ok(urls.includes("http://localhost:4444/files/services/api/coverage/index.html"));
  assert.equal(new Set(urls).size, urls.length);
});

test("honors presentation surface opt-outs without removing core service URLs", () => {
  const root = fixtureRoot();
  const urls = presentationUrls(root, {
    workbenchPort: 4444,
    includeStudio: false,
    includeDocs: false,
    includeCoverage: false,
    includeE2e: false,
    includePerformance: false
  });
  const html = buildWorkbenchHtml(root, {
    includeStudio: false,
    includeDocs: false,
    includeCoverage: false,
    includeE2e: false,
    includePerformance: false
  });

  assert.deepEqual(urls, [
    "http://localhost:4444",
    "http://localhost:5173",
    "http://localhost:3333/health/live",
    "http://localhost:3333/health/ready"
  ]);
  assert.doesNotMatch(html, /Documentacao essencial/);
  assert.doesNotMatch(html, /Coverage API/);
});

test("selects browser launchers without interpolating URLs into a shell command", () => {
  assert.deepEqual(browserCommand("http://localhost:4173", "darwin", false), {
    command: "open",
    args: ["http://localhost:4173"]
  });
  assert.deepEqual(browserCommand("http://localhost:4173", "linux", true), {
    command: "cmd.exe",
    args: ["/d", "/s", "/c", "start", "", "http://localhost:4173"]
  });
  assert.deepEqual(browserCommand("http://localhost:4173", "linux", false), {
    command: "xdg-open",
    args: ["http://localhost:4173"]
  });
});

test("detects missing and stale artifact sets", async () => {
  const root = fixtureRoot();
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src/main.ts"), "export const ready = true;");

  assert.equal(
    artifactsAreFresh(root, ["docs/generated/typedoc/index.html"], ["src"]),
    true
  );
  assert.equal(artifactsAreFresh(root, ["missing/index.html"], ["src"]), false);

  await new Promise((resolve) => setTimeout(resolve, 10));
  writeFileSync(join(root, "src/main.ts"), "export const ready = false;");
  assert.equal(
    artifactsAreFresh(root, ["docs/generated/typedoc/index.html"], ["src"]),
    false
  );
});
