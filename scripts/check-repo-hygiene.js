import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";

const sarifArgumentIndex = process.argv.indexOf("--sarif");
if (sarifArgumentIndex >= 0) {
  const sarifPath = process.argv[sarifArgumentIndex + 1];
  if (!sarifPath) {
    console.error("Missing path after --sarif.");
    process.exit(1);
  }

  const sarifFiles = statSync(sarifPath).isDirectory()
    ? readdirSync(sarifPath, { recursive: true })
        .filter((file) => file.endsWith(".sarif"))
        .map((file) => `${sarifPath}/${file}`)
    : [sarifPath];
  if (sarifFiles.length === 0) {
    console.error("No SARIF files were produced by the SAST scanner.");
    process.exit(1);
  }

  const blockingResults = [];
  for (const file of sarifFiles) {
    const sarif = JSON.parse(readFileSync(file, "utf8"));
    for (const run of sarif.runs ?? []) {
      const rules = new Map((run.tool?.driver?.rules ?? []).map((rule) => [rule.id, rule]));
      for (const result of run.results ?? []) {
        const rule = rules.get(result.ruleId);
        const securitySeverity = Number(result.properties?.["security-severity"] ?? rule?.properties?.["security-severity"]);
        const level = result.level ?? rule?.defaultConfiguration?.level ?? "none";
        if ((Number.isFinite(securitySeverity) && securitySeverity >= 7) || level === "error") {
          blockingResults.push({ ruleId: result.ruleId ?? "unknown", level, securitySeverity });
        }
      }
    }
  }

  if (blockingResults.length > 0) {
    console.error(`SAST gate blocked ${blockingResults.length} high/critical result(s); source snippets are omitted:`);
    for (const result of blockingResults) {
      console.error(`- ${result.ruleId} (level=${result.level}, security-severity=${result.securitySeverity || "n/a"})`);
    }
    process.exit(1);
  }

  console.log(`SAST gate OK: ${sarifFiles.length} SARIF file(s), no result at security-severity >= 7.0 or level error.`);
  process.exit(0);
}

const forbiddenTrackedPatterns = [
  /^services\/api\/prisma\/dev\.db$/,
  /^services\/api\/prisma\/dev\.db\.backup-/,
  /^docs\/generated\//,
  /^\.env$/,
  /^\.env\.(?!example$)/
];

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const forbidden = tracked.filter((file) => forbiddenTrackedPatterns.some((pattern) => pattern.test(file)));
const secretRules = [
  {
    name: "AWS access key",
    pattern: /AKIA[0-9A-Z]{16}/
  },
  {
    name: "GitHub token",
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/
  },
  {
    name: "private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/
  },
  {
    name: "obvious secret assignment",
    pattern: /\b(?:api[_-]?key|token|secret|password|private[_-]?key|database_url|redis_url)\b\s*["']?\s*[:=]\s*["'](?!change-me|dev-|fake|example|your-|local-only|localhost|file:|env\.|process\.env|redis:\/\/(?:redis|127\.0\.0\.1)|[a-z]+:\/\/[^/]*example\.com)([A-Za-z0-9_./+=:@$!%*?#-]{24,})["']/i
  }
];
const secretScanSkipPatterns = [
  /^package-lock\.json$/,
  /^docs\/archive\//,
  /\.(?:png|jpe?g|gif|ico|svg|pdf|zip|gz)$/i
];
const secretFindings = [];

function scanSecretLines(content, source, findings) {
  const lines = content.split("\n");
  for (const [index, line] of lines.entries()) {
    for (const rule of secretRules) {
      if (rule.pattern.test(line)) findings.push({ source, line: index + 1, rule: rule.name });
    }
  }
}

for (const file of tracked) {
  if (secretScanSkipPatterns.some((pattern) => pattern.test(file))) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  scanSecretLines(content, file, secretFindings);
}

const history = spawnSync(
  "git",
  [
    "log",
    "--all",
    "-p",
    "--no-ext-diff",
    "--format=commit:%H",
    "--",
    ".",
    ":(exclude)package-lock.json",
    ":(exclude)docs/archive/**",
    ":(exclude)docs/generated/**"
  ],
  { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }
);
if (history.status !== 0) {
  console.error(`Unable to scan Git history: ${history.stderr.trim()}`);
  process.exit(1);
}

const historicalSecretFindings = [];
const historicalSecretExceptions = [
  {
    commit: "b56d9075b5d61f033c0adc8d739a7015d7b7d835",
    path: "apps/companion-extension/src/connectors/test-harness/test-harness.test.ts",
    rule: "obvious secret assignment",
    reason: "Synthetic sanitizer regression input; the value was never a credential.",
    owner: "security",
    expires: "2026-10-15"
  },
  {
    commit: "0af8a242d223b56afc5cb5f37122f33b159d9ad2",
    path: "apps/companion-extension/src/connectors/test-harness/test-harness.test.ts",
    rule: "obvious secret assignment",
    reason: "Synthetic sanitizer regression input; the value was never a credential.",
    owner: "security",
    expires: "2026-10-15"
  }
];
let commit = "unknown";
let historicalPath = "unknown";
for (const line of history.stdout.split("\n")) {
  if (line.startsWith("commit:")) {
    commit = line.slice("commit:".length);
    continue;
  }
  if (line.startsWith("+++ b/")) {
    historicalPath = line.slice("+++ b/".length);
    continue;
  }
  if (!/^[+-](?![+-])/.test(line)) continue;
  for (const rule of secretRules) {
    if (!rule.pattern.test(line.slice(1))) continue;
    const exception = historicalSecretExceptions.find(
      (candidate) => candidate.commit === commit && candidate.path === historicalPath && candidate.rule === rule.name
    );
    const exceptionExpiresAt = exception ? new Date(`${exception.expires}T23:59:59.999Z`) : null;
    if (exception && exception.owner && exception.reason && exceptionExpiresAt && exceptionExpiresAt.getTime() >= Date.now()) continue;
    historicalSecretFindings.push({ commit, path: historicalPath, rule: rule.name });
  }
}

const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
const lockfile = JSON.parse(readFileSync("package-lock.json", "utf8"));
const workspacePaths = Object.keys(lockfile.packages).filter((path) => path && !path.includes("node_modules"));
const requiredWorkspaceScripts = ["lint", "typecheck", "test", "build"];
const qualityContractFindings = [];
const licenseExceptions = {
  "buffers@0.1.1": {
    reason: "The legacy package omits SPDX metadata; its published README contains the MIT grant.",
    owner: "ops/security",
    expires: "2026-10-15"
  },
  "xmlhttprequest-ssl@2.1.2": {
    reason: "The lockfile omits the package's legacy licenses field; the published package declares MIT.",
    owner: "ops/security",
    expires: "2026-10-15"
  }
};

for (const script of requiredWorkspaceScripts) {
  if (!rootPackage.scripts?.[script]) qualityContractFindings.push(`${rootPackage.name}: missing aggregate ${script} script`);
}

for (const workspacePath of workspacePaths) {
  const manifest = JSON.parse(readFileSync(`${workspacePath}/package.json`, "utf8"));
  const workspaceHasTests = tracked.some(
    (file) => file.startsWith(`${workspacePath}/`) && /(?:^|\/)[^/]+\.(?:test|spec)\.(?:js|mjs|cjs|ts|tsx)$/.test(file)
  );
  for (const script of requiredWorkspaceScripts) {
    if (manifest.scripts?.[script]) continue;
    qualityContractFindings.push(`${manifest.name}: missing ${script} script`);
  }

  for (const [gate, exception] of Object.entries(manifest.alwaystrackQuality ?? {})) {
    const requiredFields = ["status", "reason", "tracking", "owner", "expires"];
    if (!requiredWorkspaceScripts.includes(gate)) {
      qualityContractFindings.push(`${manifest.name}: unknown quality exception gate ${gate}`);
      continue;
    }
    if (requiredFields.some((field) => !exception?.[field]) || exception.status !== "exempt") {
      qualityContractFindings.push(`${manifest.name}: incomplete ${gate} exception`);
      continue;
    }
    const expiresAt = new Date(`${exception.expires}T23:59:59.999Z`);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      qualityContractFindings.push(`${manifest.name}: expired or invalid ${gate} exception (${exception.expires})`);
    }
    if (gate === "test" && workspaceHasTests) {
      qualityContractFindings.push(`${manifest.name}: test exception is invalid because test files exist`);
    }
  }

  if (workspaceHasTests && manifest.scripts?.test?.includes("--passWithNoTests")) {
    qualityContractFindings.push(`${manifest.name}: test files exist but test allows an undiscovered suite`);
  }
  if (!workspaceHasTests && !manifest.alwaystrackQuality?.test) {
    qualityContractFindings.push(`${manifest.name}: no test files and no auditable test exception`);
  }
}

const licenseInventory = new Map();
const prohibitedLicenses = [];
const licenseExceptionFindings = [];
const permissiveLicense = /(?:MIT|APACHE|BSD|ISC|0BSD|UNLICENSE|CC0|BLUEOAK|WTFPL)/i;
for (const [path, entry] of Object.entries(lockfile.packages)) {
  if (!path.includes("node_modules") || entry.link) continue;
  const license = entry.license ?? "UNKNOWN";
  licenseInventory.set(license, (licenseInventory.get(license) ?? 0) + 1);
  if (license === "UNKNOWN") {
    const packageName = path.replace(/^.*node_modules\//, "");
    const key = `${packageName}@${entry.version}`;
    const exception = licenseExceptions[key];
    const expiresAt = exception ? new Date(`${exception.expires}T23:59:59.999Z`) : null;
    if (!exception?.reason || !exception.owner || !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
      licenseExceptionFindings.push(`${key}: missing, incomplete or expired UNKNOWN-license exception`);
    }
    continue;
  }
  const strongCopyleft = /(?:AGPL|SSPL|(?<!L)GPL)/i.test(license);
  const hasPermissiveAlternative = /\bOR\b/i.test(license) && permissiveLicense.test(license);
  if (strongCopyleft && !hasPermissiveAlternative) {
    prohibitedLicenses.push(`${path.replace(/^node_modules\//, "")}: ${license}`);
  }
}

if (forbidden.length > 0) {
  console.error("Forbidden generated/local files are tracked:");
  for (const file of forbidden) console.error(`- ${file}`);
  process.exit(1);
}

if (secretFindings.length > 0) {
  console.error("Potential secrets found in tracked files:");
  for (const finding of secretFindings) {
    console.error(`- ${finding.source}:${finding.line} (${finding.rule})`);
  }
  process.exit(1);
}

if (historicalSecretFindings.length > 0) {
  console.error("Potential secrets found in Git history (secret values are intentionally omitted):");
  for (const finding of historicalSecretFindings) console.error(`- ${finding.commit} ${finding.path} (${finding.rule})`);
  process.exit(1);
}

if (qualityContractFindings.length > 0) {
  console.error("Workspace quality contract violations:");
  for (const finding of qualityContractFindings) console.error(`- ${finding}`);
  process.exit(1);
}

if (prohibitedLicenses.length > 0) {
  console.error("Dependencies with prohibited strong-copyleft licenses:");
  for (const finding of prohibitedLicenses) console.error(`- ${finding}`);
  process.exit(1);
}

if (licenseExceptionFindings.length > 0) {
  console.error("Dependency license exception violations:");
  for (const finding of licenseExceptionFindings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Dependency license inventory OK: ${licenseInventory.size} license expressions across ${[...licenseInventory.values()].reduce((sum, count) => sum + count, 0)} packages.`);
console.log(`Workspace quality contract OK: ${workspacePaths.length} workspaces expose lint, typecheck, test and build; ${rootPackage.name} aggregate scripts are present.`);
console.log("Repository hygiene OK: tracked files and Git history contain no forbidden artifacts or obvious secrets.");
