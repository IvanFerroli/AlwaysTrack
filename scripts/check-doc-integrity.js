import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ACTIVE_DOCS_ROOT = "docs";
const EXCLUDED_DOC_SCOPES = [
  { prefix: "docs/archive/", owner: "docs", reason: "historical material is frozen and is not an active contract" },
  { prefix: "docs/generated/", owner: "docs", reason: "TypeDoc and local workbench output is generated" },
  { prefix: "docs/performance/reports/", owner: "quality", reason: "generated performance evidence is immutable" }
];
const GENERATED_PATH_SCOPES = [
  { prefix: "docs/generated/", owner: "docs", reason: "TypeDoc, coverage and local workbench output are generated and ignored by Git" },
  { prefix: "docs/performance/reports/", owner: "quality", reason: "performance evidence is generated and ignored by Git" },
  { prefix: "services/api/.storage/", owner: "api", reason: "local operational storage is generated and ignored by Git" }
];
const METADATA_FIELDS = ["status", "owner", "last-updated", "source-of-truth"];
const METADATA_SCOPES = [
  /^docs\/adr\/ADR-\d+.*\.md$/,
  /^docs\/specs\/SPEC-.*\.md$/,
  /^docs\/tasks\/TASK-.*\.md$/,
  /^docs\/runbooks\/RUNBOOK-.*\.md$/
];
const METADATA_ALLOWLIST = new Map([
  ["docs/adr/ADR-005-filas-bullmq-backpressure.md", { owner: "docs", reason: "pre-existing metadata debt tracked outside TASK-AT-330 ownership" }],
  ["docs/runbooks/RUNBOOK-005-caseflow-companion-recovery.md", { owner: "docs", reason: "pre-existing metadata debt tracked outside TASK-AT-330 ownership" }],
  ...[143, 144, 145, 146, 147, 148].map((task) => [
    `docs/tasks/TASK-AT-${task}-${({
      143: "runtime-validation-residual-surfaces",
      144: "report-index-and-browser-workbench-hardening",
      145: "coverage-html-gate-and-docs",
      146: "attachments-removal-and-generic-operational-entity",
      147: "prod-postgres-storage-readiness",
      148: "integrations-timeout-redaction-provider-hardening"
    })[task]}.md`,
    { owner: "docs", reason: "pre-existing last-updated debt tracked outside TASK-AT-330 ownership" }
  ])
]);
const PATH_ALLOWLIST = new Map([
  [
    "docs/tasks/TASK-AT-069-operational-today-center.md::apps/web/src/views/today.tsx",
    { owner: "web", reason: "historical implementation target was consolidated into dashboard.tsx outside TASK-AT-330 ownership" }
  ]
]);
const REPOSITORY_PATH_PREFIXES = [
  ".github/", "apps/", "deploy/", "docs/", "packages/", "scripts/", "services/", "tests/"
];

function toPosix(path) {
  return path.split(sep).join("/");
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isExcluded(path) {
  return EXCLUDED_DOC_SCOPES.some(({ prefix }) => path.startsWith(prefix));
}

function isGeneratedPath(path) {
  return GENERATED_PATH_SCOPES.some(({ prefix }) => path === prefix.slice(0, -1) || path.startsWith(prefix));
}

function githubSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");
}

function anchorsFor(markdown) {
  const anchors = new Set();
  const occurrences = new Map();
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/)?.[1];
    if (!heading) continue;
    const base = githubSlug(heading);
    const count = occurrences.get(base) ?? 0;
    anchors.add(count === 0 ? base : `${base}-${count}`);
    occurrences.set(base, count + 1);
  }
  return anchors;
}

function codeRanges(markdown) {
  const ranges = [];
  for (const match of markdown.matchAll(/```[\s\S]*?```|~~~[\s\S]*?~~~/g)) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  for (const match of markdown.matchAll(/`[^`\n]*`/g)) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function isCode(index, ranges) {
  return ranges.some(([start, end]) => index >= start && index < end);
}

function normalizePathCandidate(candidate) {
  return candidate
    .replace(/^\.\//, "")
    .replace(/[.,;:]$/, "")
    .replace(/:(?:\d+)(?::\d+)?$/, "");
}

function staticPathPrefix(candidate) {
  const special = candidate.search(/[<>{}*$]/);
  if (special < 0) return candidate;
  const prefix = candidate.slice(0, special);
  return prefix.endsWith("/") ? prefix.slice(0, -1) : dirname(prefix);
}

function packageScripts(root) {
  const manifests = walk(root).filter((path) => {
    const relativePath = toPosix(relative(root, path));
    return relativePath === "package.json" || (/^(?:apps|packages|services)\/[^/]+\/package\.json$/.test(relativePath));
  });
  const scripts = new Map();
  for (const manifestPath of manifests) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    scripts.set(manifest.name ?? toPosix(relative(root, dirname(manifestPath))), new Set(Object.keys(manifest.scripts ?? {})));
  }
  return scripts;
}

function findTaskFiles(root) {
  const tasksDirectory = resolve(root, "docs/tasks");
  return new Set(
    walk(tasksDirectory)
      .map((path) => path.match(/(?:^|\/)TASK-AT-(\d{3})(?:-|\.md$)/)?.[1])
      .filter(Boolean)
  );
}

function validateLink({ root, file, markdown, target, index, failures }) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target) || target.startsWith("mailto:")) return;
  const decoded = decodeURIComponent(target.replace(/^<|>$/g, ""));
  if (decoded.startsWith("/") && !existsSync(resolve(root, decoded.slice(1)))) return;
  const [pathPart, anchor] = decoded.split("#", 2);
  const absoluteTarget = pathPart ? resolve(dirname(resolve(root, file)), pathPart) : resolve(root, file);
  if (pathPart && !existsSync(absoluteTarget)) {
    failures.push(`${file}:${lineNumber(markdown, index)} broken internal link: ${target}`);
    return;
  }
  if (anchor && extname(absoluteTarget).toLowerCase() === ".md") {
    const targetMarkdown = readFileSync(absoluteTarget, "utf8");
    if (!anchorsFor(targetMarkdown).has(decodeURIComponent(anchor).toLowerCase())) {
      failures.push(`${file}:${lineNumber(markdown, index)} missing anchor: ${target}`);
    }
  }
}

export function checkDocumentationIntegrity({ root = process.cwd() } = {}) {
  const failures = [];
  for (const [scope, exception] of [
    ...EXCLUDED_DOC_SCOPES.map((entry) => [entry.prefix, entry]),
    ...GENERATED_PATH_SCOPES.map((entry) => [entry.prefix, entry]),
    ...METADATA_ALLOWLIST,
    ...PATH_ALLOWLIST
  ]) {
    if (!exception.owner || !exception.reason) {
      failures.push(`integrity configuration: ${scope} must declare owner and reason`);
    }
  }
  const docsRoot = resolve(root, ACTIVE_DOCS_ROOT);
  const files = walk(docsRoot)
    .filter((path) => extname(path).toLowerCase() === ".md")
    .map((path) => toPosix(relative(root, path)))
    .filter((path) => !isExcluded(path));
  const scriptsByPackage = packageScripts(root);
  const rootScripts = scriptsByPackage.get(JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).name) ?? new Set();
  const taskFiles = findTaskFiles(root);

  for (const file of files) {
    const markdown = readFileSync(resolve(root, file), "utf8");
    const markdownCodeRanges = codeRanges(markdown);

    for (const match of markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/g)) {
      if (isCode(match.index, markdownCodeRanges)) continue;
      validateLink({ root, file, markdown, target: match[1], index: match.index, failures });
    }
    for (const match of markdown.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gm)) {
      if (isCode(match.index, markdownCodeRanges)) continue;
      validateLink({ root, file, markdown, target: match[1], index: match.index, failures });
    }

    for (const match of markdown.matchAll(/`([^`\n]+)`/g)) {
      const candidate = normalizePathCandidate(match[1]);
      if (!REPOSITORY_PATH_PREFIXES.some((prefix) => candidate.startsWith(prefix))) continue;
      if (/\s|[<>{}*$]/.test(candidate) || /docs\/tasks\/TASK-AT-\d{3}$/.test(candidate)) continue;
      const checkPath = staticPathPrefix(candidate.split("#", 1)[0]);
      const allowlistKey = `${file}::${candidate}`;
      if (
        checkPath &&
        !existsSync(resolve(root, checkPath)) &&
        !isGeneratedPath(checkPath) &&
        !PATH_ALLOWLIST.has(allowlistKey)
      ) {
        failures.push(`${file}:${lineNumber(markdown, match.index)} broken repository path: ${match[1]}`);
      }
    }

    for (const match of markdown.matchAll(/\bTASK-AT-(\d{3})\b/g)) {
      if (!taskFiles.has(match[1])) {
        failures.push(`${file}:${lineNumber(markdown, match.index)} missing task manifest: TASK-AT-${match[1]}`);
      }
    }

    for (const match of markdown.matchAll(/npm run\s+([^\s`]+)/g)) {
      const rawScript = match[1].replace(/[),.:;]+$/, "");
      if (/[<>{}*$]/.test(rawScript)) continue;
      const lineEnd = markdown.indexOf("\n", match.index);
      const commandSegment = markdown.slice(match.index, lineEnd < 0 ? markdown.length : lineEnd).split(/[`;,]/, 1)[0];
      const workspace = commandSegment.match(/--workspace(?:=|\s+)(@?[\w/-]+)/)?.[1];
      const availableScripts = workspace ? scriptsByPackage.get(workspace) : rootScripts;
      if (!availableScripts?.has(rawScript)) {
        failures.push(`${file}:${lineNumber(markdown, match.index)} undocumented npm script does not exist: ${rawScript}${workspace ? ` (${workspace})` : ""}`);
      }
    }

    if (METADATA_SCOPES.some((pattern) => pattern.test(file)) && !METADATA_ALLOWLIST.has(file)) {
      for (const field of METADATA_FIELDS) {
        if (!new RegExp(`^- ${field}:\\s*\\S+`, "m").test(markdown)) {
          failures.push(`${file}: missing required metadata: ${field}`);
        }
      }
    }
  }

  return {
    failures,
    checkedFiles: files.length,
    exclusions: EXCLUDED_DOC_SCOPES,
    generatedPathScopes: GENERATED_PATH_SCOPES,
    metadataAllowlist: METADATA_ALLOWLIST,
    pathAllowlist: PATH_ALLOWLIST
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = checkDocumentationIntegrity();
  if (result.failures.length) {
    console.error(`Documentation integrity failed with ${result.failures.length} finding(s):`);
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`Documentation integrity OK: ${result.checkedFiles} active Markdown file(s) checked.`);
    console.log(`Excluded scopes: ${result.exclusions.map(({ prefix, owner }) => `${prefix} (${owner})`).join(", ")}.`);
    console.log(`Generated path scopes: ${result.generatedPathScopes.map(({ prefix, owner }) => `${prefix} (${owner})`).join(", ")}.`);
    console.log(`Metadata allowlist: ${result.metadataAllowlist.size} owned pre-existing exception(s).`);
    console.log(`Path allowlist: ${result.pathAllowlist.size} owned pre-existing exception(s).`);
  }
}
