import { execFileSync } from "node:child_process";

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

if (forbidden.length > 0) {
  console.error("Forbidden generated/local files are tracked:");
  for (const file of forbidden) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Repository hygiene OK: no local DBs, generated docs or env files are tracked.");
