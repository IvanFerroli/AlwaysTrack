import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { checkDocumentationIntegrity } from "../../scripts/check-doc-integrity.js";

async function fixture(files = {}) {
  const root = await mkdtemp(join(tmpdir(), "alwaystrack-docs-"));
  const defaults = {
    "package.json": JSON.stringify({ name: "fixture", scripts: { check: "node check.js" } }),
    "docs/tasks/TASK-AT-001-example.md": [
      "# TASK-AT-001 - Example",
      "",
      "## Metadata",
      "- status: planned",
      "- owner: quality",
      "- last-updated: 2026-07-15",
      "- source-of-truth: docs/tasks/TASK-AT-001-example.md"
    ].join("\n"),
    "docs/guide.md": "# Guide\n\n[Task](tasks/TASK-AT-001-example.md#metadata)\n\n`docs/tasks/TASK-AT-001-example.md`\n\nRun `npm run check` for TASK-AT-001.\n"
  };
  for (const [path, content] of Object.entries({ ...defaults, ...files })) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}

test("accepts valid active documentation", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(checkDocumentationIntegrity({ root }).failures, []);
});

test("reports broken links, paths, task references, npm scripts and metadata", async (t) => {
  const root = await fixture({
    "docs/tasks/TASK-AT-001-example.md": "# TASK-AT-001 - Example\n",
    "docs/guide.md": "[Missing](missing.md#nope) `docs/nope.md` TASK-AT-999 `npm run nope`\n"
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const failures = checkDocumentationIntegrity({ root }).failures.join("\n");
  assert.match(failures, /broken internal link/);
  assert.match(failures, /broken repository path/);
  assert.match(failures, /missing task manifest/);
  assert.match(failures, /npm script does not exist/);
  assert.match(failures, /missing required metadata/);
});

test("reports a missing anchor in an existing Markdown file", async (t) => {
  const root = await fixture({
    "docs/guide.md": "[Missing section](tasks/TASK-AT-001-example.md#not-a-section)\n"
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.match(checkDocumentationIntegrity({ root }).failures.join("\n"), /missing anchor/);
});

test("keeps historical and generated scopes outside the active contract", async (t) => {
  const root = await fixture({
    "docs/archive/old.md": "[Missing](missing.md) TASK-AT-999 `npm run nope`",
    "docs/generated/api.md": "[Missing](missing.md) TASK-AT-999 `npm run nope`",
    "docs/performance/reports/report.md": "[Missing](missing.md) TASK-AT-999 `npm run nope`"
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(checkDocumentationIntegrity({ root }).failures, []);
});
