import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const e2eDir = resolve(rootDir, ".tmp/e2e");
const schemaPath = "services/api/prisma/schema.prisma";
const databasePath = resolve(e2eDir, "dev.db");
const schemaSqlPath = resolve(e2eDir, "schema.sql");
const seedPassword = "AlwaysTrackE2E123!";

const env = {
  ...process.env,
  DATABASE_URL: `file:${databasePath}`,
  SESSION_SECRET: "e2e-session-secret",
  API_PORT: "3334",
  CORS_ORIGIN: "http://localhost:5174",
  VITE_API_BASE_URL: "http://localhost:3334",
  SEED_ADMIN_PASSWORD: seedPassword,
  SEED_SELLER_PASSWORD: seedPassword,
  SEED_SAC_PASSWORD: seedPassword,
  SEED_FINANCEIRO_PASSWORD: seedPassword,
  SEED_SUPERVISOR_PASSWORD: seedPassword
};

function run(command, args, description) {
  console.log(`[e2e] ${description}`);
  execFileSync(command, args, { cwd: rootDir, env, stdio: "inherit" });
}

function prepareDatabase() {
  rmSync(e2eDir, { recursive: true, force: true });
  mkdirSync(e2eDir, { recursive: true });
  const sql = execFileSync("npx", ["prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", schemaPath, "--script"], {
    cwd: rootDir,
    env,
    encoding: "utf8"
  });
  writeFileSync(schemaSqlPath, sql);
  run("npx", ["prisma", "db", "execute", "--schema", schemaPath, "--file", schemaSqlPath], "applying isolated schema");
  run("npm", ["run", "prisma:seed"], "seeding isolated database");
}

function spawnService(name, command, args) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

prepareDatabase();

const processes = [
  spawnService("api:e2e", "npm", ["run", "dev:api"]),
  spawnService("web:e2e", "npm", ["run", "dev", "--workspace", "@alwaystrack/web", "--", "--host", "127.0.0.1", "--port", "5174", "--strictPort"])
];

function shutdown() {
  for (const child of processes) child.kill("SIGTERM");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});
