import { existsSync, readFileSync } from "node:fs";

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

const mode = process.argv.includes("--production") ? "production" : "local";
loadDotEnv(mode === "production" ? ".env.production" : ".env");

const required = mode === "production"
  ? ["DATABASE_URL", "SESSION_SECRET", "CORS_ORIGIN", "VITE_API_BASE_URL"]
  : [];

const optional = [
  "APP_NAME",
  "API_PORT",
  "SESSION_COOKIE_NAME",
  "VITE_API_BASE_URL",
  "VITE_APP_NAME",
  "STORAGE_LOCAL_DIR",
  "DOCUMENT_MAX_BYTES",
  "NOTIFICATION_PROVIDER",
  "META_WHATSAPP_TOKEN",
  "META_WHATSAPP_PHONE_NUMBER_ID",
  "META_WEBHOOK_VERIFY_TOKEN",
  "META_APP_SECRET",
  "META_WHATSAPP_SMOKE_TO",
  "META_WHATSAPP_SMOKE_TEMPLATE",
  "META_WHATSAPP_SMOKE_TEMPLATE_LANGUAGE",
  "SUPPORT_PHONE",
  "NOTIFICATION_JOB_LIMIT",
  "HTTP_METRICS_SLOW_MS",
  "PRISMA_SLOW_QUERY_MS",
  "JOB_QUEUE_DRIVER",
  "REDIS_URL",
  "JOB_CONCURRENCY",
  "GOOGLE_LOGIN_CLIENT_ID",
  "GOOGLE_LOGIN_CLIENT_SECRET",
  "GOOGLE_LOGIN_REDIRECT_URI",
  "GOOGLE_LOGIN_ALLOWED_DOMAINS"
];

const missing = required.filter((key) => !process.env[key] || process.env[key] === "change-me-in-production");
const provider = process.env.NOTIFICATION_PROVIDER ?? "fake";
const jobQueueDriver = process.env.JOB_QUEUE_DRIVER ?? "inline";
const googleLoginPartiallyConfigured = [
  "GOOGLE_LOGIN_CLIENT_ID",
  "GOOGLE_LOGIN_CLIENT_SECRET",
  "GOOGLE_LOGIN_REDIRECT_URI"
].some((key) => Boolean(process.env[key]));

function isLoopbackHost(hostname) {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname) || hostname.endsWith(".localhost");
}

function validatePublicUrl(key) {
  const value = process.env[key];
  if (!value) return;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || isLoopbackHost(url.hostname)) {
      missing.push(key);
    }
  } catch {
    missing.push(key);
  }
}

if (mode === "production") {
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  if (
    sessionSecret.length < 32 ||
    ["dev-only-session-secret", "dev-session-secret", "change-me-in-production"].includes(sessionSecret)
  ) {
    missing.push("SESSION_SECRET");
  }
  validatePublicUrl("CORS_ORIGIN");
  validatePublicUrl("VITE_API_BASE_URL");
}

if (provider === "meta") {
  for (const key of ["META_WHATSAPP_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID", "META_WEBHOOK_VERIFY_TOKEN", "META_APP_SECRET"]) {
    if (!process.env[key]) missing.push(key);
  }
}

if (jobQueueDriver === "bullmq" && !process.env.REDIS_URL) {
  missing.push("REDIS_URL");
}

if (googleLoginPartiallyConfigured && !process.env.GOOGLE_LOGIN_ALLOWED_DOMAINS) {
  missing.push("GOOGLE_LOGIN_ALLOWED_DOMAINS");
}

console.log(`[env:check] mode=${mode}`);
for (const key of [...new Set([...required, ...optional])]) {
  if (process.env[key]) console.log(`[env:check] ${key}=set`);
}

if (missing.length > 0) {
  console.error(`[env:check] missing/unsafe: ${[...new Set(missing)].join(", ")}`);
  process.exit(1);
}

console.log("[env:check] ok");
