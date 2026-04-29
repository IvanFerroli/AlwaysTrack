export interface ApiEnv {
  databaseUrl: string;
  sessionSecret: string;
  port: number;
}

export function loadEnv(source = process.env): ApiEnv {
  return {
    databaseUrl: source.DATABASE_URL ?? "file:./dev.db",
    sessionSecret: source.SESSION_SECRET ?? "dev-only-session-secret",
    port: Number(source.API_PORT ?? "3333")
  };
}
