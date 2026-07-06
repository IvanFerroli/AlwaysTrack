import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const port = process.env.SMOKE_API_PORT ?? "3399";
const rootDir = resolve(import.meta.dirname, "..");
const smokeDir = resolve(rootDir, ".tmp/smoke-beta");
const databasePath = resolve(smokeDir, "dev.db");
const schemaSqlPath = resolve(smokeDir, "schema.sql");
const schemaPath = "services/api/prisma/schema.prisma";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AdminSmoke123456!";
const sacPassword = process.env.SEED_SAC_PASSWORD ?? "SacSmoke123456!";
const sellerPassword = process.env.SEED_SELLER_PASSWORD ?? "VendedorSmoke123456!";
const betaAllowedEmails = process.env.BETA_ALLOWED_EMAILS ?? [
  "admin@example.com",
  "sac@example.com",
  "financeiro@example.com",
  "vendedor@example.com",
  "supervisor@example.com"
].join(",");
const env = {
  ...process.env,
  APP_MODE: "beta-local",
  VITE_APP_MODE: "beta-local",
  BETA_ALLOWED_EMAILS: betaAllowedEmails,
  DATABASE_URL: `file:${databasePath}`,
  API_PORT: port,
  SEED_ADMIN_PASSWORD: adminPassword,
  SEED_SAC_PASSWORD: sacPassword,
  SEED_FINANCEIRO_PASSWORD: process.env.SEED_FINANCEIRO_PASSWORD ?? "FinanceiroSmoke123456!",
  SEED_SELLER_PASSWORD: sellerPassword,
  SEED_RT_PASSWORD: process.env.SEED_RT_PASSWORD ?? "RtSmoke123456!",
  SEED_SUPERVISOR_PASSWORD: process.env.SEED_SUPERVISOR_PASSWORD ?? "SupervisorSmoke123456!",
  SEED_UPLOAD_TOKEN: process.env.SEED_UPLOAD_TOKEN ?? "UploadSmoke123456!",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "local-smoke-session-secret-1234567890",
  NOTIFICATION_PROVIDER: process.env.NOTIFICATION_PROVIDER ?? "fake"
};

function prepareDatabase() {
  rmSync(smokeDir, { recursive: true, force: true });
  mkdirSync(smokeDir, { recursive: true });
  const sql = execFileSync("npx", ["prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", schemaPath, "--script"], {
    cwd: rootDir,
    env,
    encoding: "utf8"
  });
  writeFileSync(schemaSqlPath, sql);
  execFileSync("npx", ["prisma", "db", "execute", "--schema", schemaPath, "--file", schemaSqlPath], {
    cwd: rootDir,
    env,
    stdio: "inherit"
  });
  execFileSync("npm", ["run", "prisma:seed"], { cwd: rootDir, env, stdio: "inherit" });
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit", shell: process.platform === "win32", ...options });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
      }
    });
  });
}

async function waitForHealth(baseUrl) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    try {
      const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // API ainda subindo.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("API healthcheck did not become ready.");
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
    ...options
  });
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`${path} failed: ${payload.error?.message ?? response.status}`);
  }
  return { response, payload };
}

async function requestError(baseUrl, path, expectedStatus, expectedCode, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
    ...options
  });
  const payload = await response.json();
  if (response.status !== expectedStatus || payload.ok !== false || payload.error?.code !== expectedCode) {
    throw new Error(`${path} expected ${expectedStatus}/${expectedCode}, got ${response.status}/${payload.error?.code ?? "unknown"}`);
  }
}

async function login(baseUrl, email, password) {
  const result = await request(baseUrl, "/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const cookie = result.response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error(`Login for ${email} did not return a session cookie.`);
  return { cookie };
}

async function smokeHttp(baseUrl) {
  console.log("[smoke:beta-local] waiting for API");
  await waitForHealth(baseUrl);
  console.log("[smoke:beta-local] validating allowlist");
  await requestError(baseUrl, "/v1/auth/login", 401, "EMAIL_NOT_ALLOWED", {
    method: "POST",
    body: JSON.stringify({ email: "outsider@example.com", password: "irrelevant" })
  });

  const adminSession = await login(baseUrl, "admin@example.com", adminPassword);
  console.log("[smoke:beta-local] validating ADMIN flow");
  const headers = { cookie: adminSession.cookie };
  await request(baseUrl, "/v1/auth/me", { headers });
  const dashboard = await request(baseUrl, "/v1/sales/dashboard", { headers });
  if (typeof dashboard.payload.data.metrics?.totalDocuments !== "number") {
    throw new Error("Commercial dashboard metric is missing.");
  }
  const notes = await request(baseUrl, "/v1/sales/documents", { headers });
  if (!Array.isArray(notes.payload.data.items)) {
    throw new Error("Sales documents list is missing.");
  }
  const campaigns = await request(baseUrl, "/v1/sales/campaigns", { headers });
  if (!Array.isArray(campaigns.payload.data.items)) {
    throw new Error("Sales campaigns list is missing.");
  }
  const ranking = await request(baseUrl, "/v1/sales/ranking", { headers });
  if (!Array.isArray(ranking.payload.data.items)) {
    throw new Error("Sales ranking is missing.");
  }
  const statements = await request(baseUrl, "/v1/sales/statements", { headers });
  if (typeof statements.payload.data.summary?.documents !== "number") {
    throw new Error("Sales statements summary is missing.");
  }
  const wiki = await request(baseUrl, "/v1/wiki/pages", { headers });
  if (!Array.isArray(wiki.payload.data.items) || wiki.payload.data.items.length === 0) {
    throw new Error("Wiki seed page was not found.");
  }

  const sacSession = await login(baseUrl, "sac@example.com", sacPassword);
  console.log("[smoke:beta-local] validating SAC boundaries");
  const sacHeaders = { cookie: sacSession.cookie };
  await requestError(baseUrl, "/v1/sales/documents", 403, "FORBIDDEN", { headers: sacHeaders });
  await requestError(baseUrl, "/v1/sales/ranking", 403, "FORBIDDEN", { headers: sacHeaders });
  await requestError(baseUrl, "/v1/audit-logs", 403, "FORBIDDEN", { headers: sacHeaders });
  const sacWiki = await request(baseUrl, "/v1/wiki/pages", { headers: sacHeaders });
  if (!Array.isArray(sacWiki.payload.data.items)) throw new Error("SAC Wiki access is missing.");
  const sacSearch = await request(baseUrl, "/v1/search?q=danfe", { headers: sacHeaders });
  const forbiddenSacGroups = new Set(["notes", "sellers", "campaigns"]);
  if (sacSearch.payload.data.groups.some((group) => forbiddenSacGroups.has(group.key))) {
    throw new Error("SAC global search leaked commercial groups.");
  }

  const sellerSession = await login(baseUrl, "vendedor@example.com", sellerPassword);
  console.log("[smoke:beta-local] validating VENDEDOR scope");
  const sellerHeaders = { cookie: sellerSession.cookie };
  const sellerRanking = await request(baseUrl, "/v1/sales/ranking", { headers: sellerHeaders });
  if (sellerRanking.payload.data.items.some((item) => item.sellerName !== "Vendedor Demo")) {
    throw new Error("Seller ranking leaked another seller.");
  }
  const sellerStatements = await request(baseUrl, "/v1/sales/statements", { headers: sellerHeaders });
  if (sellerStatements.payload.data.consolidations.bySeller.some((item) => item.sellerName !== "Vendedor Demo")) {
    throw new Error("Seller statements leaked another seller.");
  }
}

async function stopApi(child) {
  const exited = new Promise((resolve) => child.once("exit", resolve));
  if (child.pid) {
    if (process.platform === "win32") {
      child.kill("SIGTERM");
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  }
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2_000))]);
  if (child.exitCode === null && child.pid) {
    if (process.platform === "win32") {
      child.kill("SIGKILL");
    } else {
      process.kill(-child.pid, "SIGKILL");
    }
  }
}

async function main() {
  console.log("[smoke:beta-local] validating environment");
  await run("npm", ["run", "env:check"]);
  console.log("[smoke:beta-local] preparing isolated database");
  prepareDatabase();
  console.log("[smoke:beta-local] validating production guardrails");
  await run("npm", ["run", "env:check", "--", "--production"], {
    env: {
      ...env,
      NODE_ENV: "production",
      APP_MODE: "production",
      DATABASE_URL: "file:./prod.db",
      SESSION_SECRET: "abcdefghijklmnopqrstuvwxyz1234567890ABCD",
      CORS_ORIGIN: "https://app.example.com",
      VITE_API_BASE_URL: "https://api.example.com",
      GOOGLE_REDIRECT_URI: "https://api.example.com/v1/integrations/google/oauth/callback",
      GOOGLE_LOGIN_REDIRECT_URI: "https://api.example.com/v1/auth/google/callback"
    }
  });

  console.log("[smoke:beta-local] starting isolated API");
  const api = spawn("npx", ["tsx", "services/api/src/main.ts"], {
    env,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32"
  });

  api.stdout.on("data", (chunk) => process.stdout.write(`[api] ${chunk}`));
  api.stderr.on("data", (chunk) => process.stderr.write(`[api] ${chunk}`));

  try {
    await smokeHttp(`http://localhost:${port}`);
    console.log("[smoke:beta-local] ok");
  } finally {
    await stopApi(api);
  }
}

main().catch((error) => {
  console.error(`[smoke:beta-local] ${error.message}`);
  process.exit(1);
});
