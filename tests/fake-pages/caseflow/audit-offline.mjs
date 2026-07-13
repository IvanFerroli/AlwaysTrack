import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const demoRoot = join(root, "..", "..", "fixtures", "caseflow", "demo");
const files = (await readdir(root)).filter((file) => /\.(?:html|json)$/.test(file));
assert.equal(files.filter((file) => file.endsWith(".html")).length, 4);

const artifacts = [
  ...files.map((file) => ({ file, path: join(root, file) })),
  ...(await readdir(demoRoot)).filter((file) => file.endsWith(".json")).map((file) => ({ file: `demo/${file}`, path: join(demoRoot, file) }))
];

for (const { file, path } of artifacts) {
  const content = await readFile(path, "utf8");
  assert.doesNotMatch(content, /https?:\/\/(?![^\s"']*\.example(?:[\/"']))/i, `${file}: real host`);
  assert.doesNotMatch(content, /(?:webhook|postMessage|sendMessage|authorization|api[_-]?key|access[_-]?token|password)/i, `${file}: external action or secret`);
  assert.doesNotMatch(content, /<script|<form|type=["']submit["']/i, `${file}: active page behavior`);
  assert.doesNotMatch(content, /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|[\w.+-]+@(?!example\.)[\w.-]+\.[a-z]{2,}/i, `${file}: possible PII`);
}

const manual = await readFile(join(root, "manual-order-draft.html"), "utf8");
assert.match(manual, /data-stop-before="confirmation"/);
assert.match(manual, /data-final-confirmation="forbidden" disabled/);
console.log(`offline CaseFlow audit passed (${artifacts.length} artifacts)`);
