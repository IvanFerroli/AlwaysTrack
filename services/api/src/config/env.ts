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
}

export function loadEnv(source = process.env): ApiEnv {
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
    notificationJobLimit: Number(source.NOTIFICATION_JOB_LIMIT ?? "25")
  };
}
