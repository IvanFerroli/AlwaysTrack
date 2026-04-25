export interface ApiEnv {
  nodeEnv: string;
  host: string;
  port: number;
}

function readPort(raw: string | undefined): number {
  const value = Number(raw ?? "3001");
  if (!Number.isInteger(value) || value <= 0) {
    return 3001;
  }
  return value;
}

export function loadApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return {
    nodeEnv: env.NODE_ENV ?? "development",
    host: env.HOST ?? "127.0.0.1",
    port: readPort(env.PORT)
  };
}
