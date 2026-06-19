import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");

function loadDotEnv(fileName) {
  if (!existsSync(fileName)) return;
  for (const line of readFileSync(fileName, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

function run(command, args, env, description) {
  console.log(`[postgres-preflight] ${description}`);
  execFileSync(command, args, { cwd: rootDir, env: { ...process.env, ...env }, stdio: "inherit" });
}

function fail(message) {
  console.error(`[postgres-preflight] ${message}`);
  process.exitCode = 1;
}

loadDotEnv(".env.production");

const databaseUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL || "";
const required = [];
if (!databaseUrl) required.push("DATABASE_URL or POSTGRES_DATABASE_URL");
if (databaseUrl.startsWith("file:")) required.push("non-SQLite DATABASE_URL");
if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) required.push("Postgres connection string");
if (process.env.STORAGE_PROVIDER !== "s3") required.push("STORAGE_PROVIDER=s3");
for (const key of ["STORAGE_S3_ENDPOINT", "STORAGE_S3_BUCKET", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) {
  if (!process.env[key]) required.push(key);
}
if (process.env.POSTGRES_BACKUP_CONFIRMED !== "true") required.push("POSTGRES_BACKUP_CONFIRMED=true");
if (process.env.POSTGRES_RESTORE_DRY_RUN_CONFIRMED !== "true") required.push("POSTGRES_RESTORE_DRY_RUN_CONFIRMED=true");

if (required.length) {
  fail(`missing/unsafe prerequisites: ${[...new Set(required)].join(", ")}`);
  console.error("[postgres-preflight] This script is intentionally strict. Do not run production migration without managed Postgres, S3-compatible storage and backup/restore evidence.");
  process.exit();
}

run("npx", ["prisma", "validate", "--schema", "services/api/prisma/schema.prisma"], { DATABASE_URL: "file:./dev.db" }, "validating current local-first Prisma schema");
run("npm", ["run", "env:check", "--", "--production"], { DATABASE_URL: databaseUrl, NODE_ENV: "production" }, "checking production env guard");

console.log("[postgres-preflight] prerequisites look ready for a dedicated Postgres migration branch.");
console.log("[postgres-preflight] Next manual step: branch, change Prisma datasource provider to postgresql, generate baseline migration, then run migrate deploy on staging.");
