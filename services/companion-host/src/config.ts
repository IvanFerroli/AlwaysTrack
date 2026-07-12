export interface CompanionHostConfig {
  host: "127.0.0.1";
  port: number;
}

export function loadCompanionHostConfig(env: NodeJS.ProcessEnv = process.env): CompanionHostConfig {
  const host = env.COMPANION_HOST_BIND?.trim() || "127.0.0.1";
  if (host !== "127.0.0.1") throw new Error("COMPANION_HOST_BIND must be 127.0.0.1");

  const port = Number(env.COMPANION_HOST_PORT?.trim() || "38472");
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("COMPANION_HOST_PORT must be an integer between 0 and 65535");
  }
  return { host, port };
}
