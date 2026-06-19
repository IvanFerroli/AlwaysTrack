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
  ? ["NODE_ENV", "DATABASE_URL", "SESSION_SECRET", "CORS_ORIGIN", "VITE_API_BASE_URL"]
  : [];

const optional = [
  "APP_NAME",
  "APP_MODE",
  "API_PORT",
  "SESSION_COOKIE_NAME",
  "VITE_API_BASE_URL",
  "VITE_APP_NAME",
  "STORAGE_PROVIDER",
  "STORAGE_LOCAL_DIR",
  "STORAGE_S3_ENDPOINT",
  "STORAGE_S3_BUCKET",
  "STORAGE_S3_REGION",
  "STORAGE_S3_ACCESS_KEY_ID",
  "STORAGE_S3_SECRET_ACCESS_KEY",
  "STORAGE_S3_FORCE_PATH_STYLE",
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
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_LOGIN_MAX",
  "RATE_LIMIT_UPLOAD_MAX",
  "RATE_LIMIT_AI_MAX",
  "RATE_LIMIT_SEARCH_MAX",
  "RATE_LIMIT_INTERACTION_MAX",
  "RATE_LIMIT_ADMIN_MAX",
  "JOB_QUEUE_DRIVER",
  "REDIS_URL",
  "JOB_CONCURRENCY",
  "GOOGLE_LOGIN_CLIENT_ID",
  "GOOGLE_LOGIN_CLIENT_SECRET",
  "GOOGLE_LOGIN_REDIRECT_URI",
  "GOOGLE_LOGIN_ALLOWED_DOMAINS",
  "BETA_ALLOWED_EMAILS",
  "DOCUMENT_AI_PROVIDER",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_TOKEN_ENCRYPTION_KEY"
];

const missing = required.filter((key) => !process.env[key] || process.env[key] === "change-me-in-production");
const provider = process.env.NOTIFICATION_PROVIDER ?? "fake";
const appMode = process.env.APP_MODE ?? (process.env.NODE_ENV === "production" ? "production" : "local");
const jobQueueDriver = process.env.JOB_QUEUE_DRIVER ?? "inline";
const googleLoginPartiallyConfigured = [
  "GOOGLE_LOGIN_CLIENT_ID",
  "GOOGLE_LOGIN_CLIENT_SECRET",
  "GOOGLE_LOGIN_REDIRECT_URI"
].some((key) => Boolean(process.env[key]));
const googleOauthPartiallyConfigured = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_TOKEN_ENCRYPTION_KEY"
].some((key) => Boolean(process.env[key]));
const googleServiceAccountPartiallyConfigured = [
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY"
].some((key) => Boolean(process.env[key]));

function isLoopbackHost(hostname) {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname) || hostname.endsWith(".localhost");
}

function validatePublicUrl(key) {
  const value = process.env[key];
  if (!value) return;
  for (const entry of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    try {
      const url = new URL(entry);
      if (url.protocol !== "https:" || isLoopbackHost(url.hostname)) {
        missing.push(key);
      }
    } catch {
      missing.push(key);
    }
  }
}

function validateHttpsUrl(key) {
  const value = process.env[key];
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || isLoopbackHost(url.hostname)) {
      missing.push(key);
    }
  } catch {
    missing.push(key);
  }
}

if (mode === "production") {
  if (process.env.NODE_ENV !== "production") {
    missing.push("NODE_ENV");
  }
  if (process.env.DATABASE_URL?.startsWith("file:")) {
    missing.push("DATABASE_URL");
  }
  const sessionSecret = process.env.SESSION_SECRET ?? "";
  if (
    sessionSecret.length < 32 ||
    ["dev-only-session-secret", "dev-session-secret", "change-me-in-production"].includes(sessionSecret)
  ) {
    missing.push("SESSION_SECRET");
  }
  validatePublicUrl("CORS_ORIGIN");
  validatePublicUrl("VITE_API_BASE_URL");
  validateHttpsUrl("GOOGLE_REDIRECT_URI");
  validateHttpsUrl("GOOGLE_LOGIN_REDIRECT_URI");
}

if (provider === "meta") {
  for (const key of ["META_WHATSAPP_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID", "META_WEBHOOK_VERIFY_TOKEN", "META_APP_SECRET"]) {
    if (!process.env[key]) missing.push(key);
  }
}

if (jobQueueDriver === "bullmq" && !process.env.REDIS_URL) {
  missing.push("REDIS_URL");
}

if (appMode === "beta-local" && !process.env.BETA_ALLOWED_EMAILS) {
  missing.push("BETA_ALLOWED_EMAILS");
}

if (mode === "production" && process.env.STORAGE_PROVIDER === "s3") {
  for (const key of ["STORAGE_S3_ENDPOINT", "STORAGE_S3_BUCKET", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) {
    if (!process.env[key]) missing.push(key);
  }
}

if (googleLoginPartiallyConfigured && !process.env.GOOGLE_LOGIN_ALLOWED_DOMAINS) {
  missing.push("GOOGLE_LOGIN_ALLOWED_DOMAINS");
}

if (googleOauthPartiallyConfigured) {
  for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "GOOGLE_TOKEN_ENCRYPTION_KEY"]) {
    if (!process.env[key]) missing.push(key);
  }
}

if (googleServiceAccountPartiallyConfigured) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY)) {
    missing.push("GOOGLE_APPLICATION_CREDENTIALS");
    missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    missing.push("GOOGLE_PRIVATE_KEY");
  }
}

if (process.env.DOCUMENT_AI_PROVIDER === "openai" && !process.env.OPENAI_API_KEY) {
  missing.push("OPENAI_API_KEY");
}

if (process.env.DOCUMENT_AI_PROVIDER === "gemini" && !process.env.GEMINI_API_KEY) {
  missing.push("GEMINI_API_KEY");
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
