import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface ApiEnv {
  databaseUrl: string;
  sessionSecret: string;
  port: number;
  corsOrigin?: string;
  storageProvider: "local";
  storageLocalDir: string;
  documentMaxBytes: number;
  notificationProvider: "fake" | "meta";
  metaWhatsAppToken?: string;
  metaWhatsAppPhoneNumberId?: string;
  metaWebhookVerifyToken?: string;
  metaAppSecret?: string;
  supportPhone?: string;
  notificationJobLimit: number;
  documentAiProvider: "fake" | "openai";
  documentAiModel: string;
  openAiApiKey?: string;
}

let dotEnvLoaded = false;

function loadDotEnv() {
  if (dotEnvLoaded) return;
  dotEnvLoaded = true;
  if (process.env.NODE_ENV === "test") return;

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env")
  ];
  const envPath = candidates.find((candidate) => existsSync(candidate));
  if (!envPath) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

export function loadEnv(source = process.env): ApiEnv {
  loadDotEnv();
  return {
    databaseUrl: source.DATABASE_URL ?? "file:./dev.db",
    sessionSecret: source.SESSION_SECRET ?? "dev-only-session-secret",
    port: Number(source.API_PORT ?? "3333"),
    corsOrigin: source.CORS_ORIGIN,
    storageProvider: "local",
    storageLocalDir: source.STORAGE_LOCAL_DIR ?? ".storage/private",
    documentMaxBytes: Number(source.DOCUMENT_MAX_BYTES ?? String(10 * 1024 * 1024)),
    notificationProvider: source.NOTIFICATION_PROVIDER === "meta" ? "meta" : "fake",
    metaWhatsAppToken: source.META_WHATSAPP_TOKEN,
    metaWhatsAppPhoneNumberId: source.META_WHATSAPP_PHONE_NUMBER_ID,
    metaWebhookVerifyToken: source.META_WEBHOOK_VERIFY_TOKEN,
    metaAppSecret: source.META_APP_SECRET,
    supportPhone: source.SUPPORT_PHONE,
    notificationJobLimit: Number(source.NOTIFICATION_JOB_LIMIT ?? "25"),
    documentAiProvider: source.DOCUMENT_AI_PROVIDER === "openai" ? "openai" : "fake",
    documentAiModel: source.DOCUMENT_AI_MODEL ?? "gpt-4.1-mini",
    openAiApiKey: source.OPENAI_API_KEY
  };
}
