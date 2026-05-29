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
  ? ["DATABASE_URL", "SESSION_SECRET", "CORS_ORIGIN"]
  : [];

const optional = [
  "API_PORT",
  "SESSION_COOKIE_NAME",
  "VITE_API_BASE_URL",
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
  "NOTIFICATION_JOB_LIMIT"
];

const missing = required.filter((key) => !process.env[key] || process.env[key] === "change-me-in-production");
const provider = process.env.NOTIFICATION_PROVIDER ?? "fake";

if (provider === "meta") {
  for (const key of ["META_WHATSAPP_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID", "META_WEBHOOK_VERIFY_TOKEN", "META_APP_SECRET"]) {
    if (!process.env[key]) missing.push(key);
  }
}

console.log(`[env:check] mode=${mode}`);
for (const key of [...required, ...optional]) {
  if (process.env[key]) console.log(`[env:check] ${key}=set`);
}

if (missing.length > 0) {
  console.error(`[env:check] missing/unsafe: ${[...new Set(missing)].join(", ")}`);
  process.exit(1);
}

console.log("[env:check] ok");
