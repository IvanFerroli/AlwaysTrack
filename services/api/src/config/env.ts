import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface ApiEnv {
  appName: string;
  appMode?: "local" | "beta-local" | "production";
  databaseUrl: string;
  sessionSecret: string;
  sessionCookieName: string;
  port: number;
  corsOrigin?: string;
  corsOrigins?: string[];
  storageProvider: "local" | "s3";
  storageLocalDir: string;
  storageS3Endpoint?: string;
  storageS3Bucket?: string;
  storageS3Region?: string;
  storageS3AccessKeyId?: string;
  storageS3SecretAccessKey?: string;
  storageS3ForcePathStyle?: boolean;
  documentMaxBytes: number;
  notificationProvider: "fake" | "meta";
  metaWhatsAppToken?: string;
  metaWhatsAppPhoneNumberId?: string;
  metaWebhookVerifyToken?: string;
  metaAppSecret?: string;
  supportPhone?: string;
  notificationJobLimit: number;
  documentAiProvider: "fake" | "openai" | "gemini";
  documentAiModel: string;
  openAiApiKey?: string;
  geminiApiKey?: string;
  googleServiceAccountEmail?: string;
  googlePrivateKey?: string;
  googleSheetsTemplateShareEmail?: string;
  googleSheetsTemplateShareRole?: "reader" | "commenter" | "writer";
  googleApplicationCredentials?: string;
  googleSheetsTemplateFolderId?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  googleTokenEncryptionKey?: string;
  googleLoginClientId?: string;
  googleLoginClientSecret?: string;
  googleLoginRedirectUri?: string;
  googleLoginAllowedDomains?: string[];
  betaAllowedEmails?: string[];
  enableLegacySylembra?: boolean;
  httpMetricsSlowMs?: number;
  prismaSlowQueryMs?: number;
  jobQueueDriver?: "inline" | "bullmq";
  redisUrl?: string;
  jobConcurrency?: number;
  rateLimitWindowMs?: number;
  rateLimitLoginMax?: number;
  rateLimitUploadMax?: number;
  rateLimitAiMax?: number;
  rateLimitSearchMax?: number;
  rateLimitInteractionMax?: number;
  rateLimitAdminMax?: number;
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
  const corsOrigins = (source.CORS_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    appName: source.APP_NAME?.trim() || "AlwaysTrack",
    appMode:
      source.APP_MODE === "beta-local" || source.APP_MODE === "production"
        ? source.APP_MODE
        : source.NODE_ENV === "production"
          ? "production"
          : "local",
    databaseUrl: source.DATABASE_URL ?? "file:./dev.db",
    sessionSecret: source.SESSION_SECRET ?? "dev-only-session-secret",
    sessionCookieName: source.SESSION_COOKIE_NAME ?? "alwaystrack_session",
    port: Number(source.API_PORT ?? "3333"),
    corsOrigin: source.CORS_ORIGIN,
    corsOrigins,
    storageProvider: source.STORAGE_PROVIDER === "s3" ? "s3" : "local",
    storageLocalDir: source.STORAGE_LOCAL_DIR ?? ".storage/private",
    storageS3Endpoint: source.STORAGE_S3_ENDPOINT,
    storageS3Bucket: source.STORAGE_S3_BUCKET,
    storageS3Region: source.STORAGE_S3_REGION ?? "us-east-1",
    storageS3AccessKeyId: source.STORAGE_S3_ACCESS_KEY_ID,
    storageS3SecretAccessKey: source.STORAGE_S3_SECRET_ACCESS_KEY,
    storageS3ForcePathStyle: source.STORAGE_S3_FORCE_PATH_STYLE !== "false",
    documentMaxBytes: Number(source.DOCUMENT_MAX_BYTES ?? String(10 * 1024 * 1024)),
    notificationProvider: source.NOTIFICATION_PROVIDER === "meta" ? "meta" : "fake",
    metaWhatsAppToken: source.META_WHATSAPP_TOKEN,
    metaWhatsAppPhoneNumberId: source.META_WHATSAPP_PHONE_NUMBER_ID,
    metaWebhookVerifyToken: source.META_WEBHOOK_VERIFY_TOKEN,
    metaAppSecret: source.META_APP_SECRET,
    supportPhone: source.SUPPORT_PHONE,
    notificationJobLimit: Number(source.NOTIFICATION_JOB_LIMIT ?? "25"),
    documentAiProvider: source.DOCUMENT_AI_PROVIDER === "openai" ? "openai" : source.DOCUMENT_AI_PROVIDER === "gemini" ? "gemini" : "fake",
    documentAiModel: source.DOCUMENT_AI_MODEL ?? "gemini-2.5-flash",
    openAiApiKey: source.OPENAI_API_KEY,
    geminiApiKey: source.GEMINI_API_KEY,
    googleServiceAccountEmail: source.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    googlePrivateKey: source.GOOGLE_PRIVATE_KEY,
    googleSheetsTemplateShareEmail: source.GOOGLE_SHEETS_TEMPLATE_SHARE_EMAIL,
    googleSheetsTemplateShareRole:
      source.GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE === "reader" ||
      source.GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE === "commenter" ||
      source.GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE === "writer"
        ? source.GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE
        : "writer",
    googleApplicationCredentials: source.GOOGLE_APPLICATION_CREDENTIALS,
    googleSheetsTemplateFolderId: source.GOOGLE_SHEETS_TEMPLATE_FOLDER_ID,
    googleClientId: source.GOOGLE_CLIENT_ID,
    googleClientSecret: source.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: source.GOOGLE_REDIRECT_URI,
    googleTokenEncryptionKey: source.GOOGLE_TOKEN_ENCRYPTION_KEY,
    googleLoginClientId: source.GOOGLE_LOGIN_CLIENT_ID || source.GOOGLE_CLIENT_ID,
    googleLoginClientSecret: source.GOOGLE_LOGIN_CLIENT_SECRET || source.GOOGLE_CLIENT_SECRET,
    googleLoginRedirectUri: source.GOOGLE_LOGIN_REDIRECT_URI,
    googleLoginAllowedDomains: (source.GOOGLE_LOGIN_ALLOWED_DOMAINS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
    betaAllowedEmails: (source.BETA_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
    enableLegacySylembra: source.ENABLE_LEGACY_SYLEMBRA === "true",
    httpMetricsSlowMs: Number(source.HTTP_METRICS_SLOW_MS ?? "500"),
    prismaSlowQueryMs: Number(source.PRISMA_SLOW_QUERY_MS ?? "200"),
    jobQueueDriver: source.JOB_QUEUE_DRIVER === "bullmq" ? "bullmq" : "inline",
    redisUrl: source.REDIS_URL,
    jobConcurrency: Number(source.JOB_CONCURRENCY ?? "2"),
    rateLimitWindowMs: Number(source.RATE_LIMIT_WINDOW_MS ?? String(60 * 1000)),
    rateLimitLoginMax: Number(source.RATE_LIMIT_LOGIN_MAX ?? "10"),
    rateLimitUploadMax: Number(source.RATE_LIMIT_UPLOAD_MAX ?? "20"),
    rateLimitAiMax: Number(source.RATE_LIMIT_AI_MAX ?? "10"),
    rateLimitSearchMax: Number(source.RATE_LIMIT_SEARCH_MAX ?? "120"),
    rateLimitInteractionMax: Number(source.RATE_LIMIT_INTERACTION_MAX ?? "60"),
    rateLimitAdminMax: Number(source.RATE_LIMIT_ADMIN_MAX ?? "90")
  };
}
