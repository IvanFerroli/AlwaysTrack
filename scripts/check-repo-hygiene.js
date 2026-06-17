import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

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
    pattern: /\b(?:api[_-]?key|token|secret|password|private[_-]?key|database_url|redis_url)\b\s*[:=]\s*["']?(?!$|["']?$|change-me|dev-|fake|example|your-|local-only|localhost|file:|env\.|process\.env|redis:\/\/(?:redis|127\.0\.0\.1)|[a-z]+:\/\/[^/]*example\.com)([A-Za-z0-9_./+=:@$!%*?#-]{24,})/i
  }
];
const secretScanSkipPatterns = [
  /^package-lock\.json$/,
  /^docs\/archive\//,
  /\.(?:png|jpe?g|gif|ico|svg|pdf|zip|gz)$/i
];
const secretFindings = [];

for (const file of tracked) {
  if (secretScanSkipPatterns.some((pattern) => pattern.test(file))) continue;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = content.split("\n");
  for (const [index, line] of lines.entries()) {
    for (const rule of secretRules) {
      if (rule.pattern.test(line)) {
        secretFindings.push({ file, line: index + 1, rule: rule.name });
      }
    }
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
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`);
  }
  process.exit(1);
}

console.log("Repository hygiene OK: no local DBs, generated docs, env files or obvious secrets are tracked.");
