export interface WebEnv {
  nodeEnv: string;
  port: number;
  apiBaseUrl: string;
}

function readPort(raw: string | undefined): number {
  const value = Number(raw ?? "3000");
  if (!Number.isInteger(value) || value <= 0) {
    return 3000;
  }
  return value;
}

export function loadWebEnv(env: NodeJS.ProcessEnv = process.env): WebEnv {
  return {
    nodeEnv: env.NODE_ENV ?? "development",
    port: readPort(env.PORT),
    apiBaseUrl: env.API_BASE_URL ?? "http://localhost:3001"
  };
}
