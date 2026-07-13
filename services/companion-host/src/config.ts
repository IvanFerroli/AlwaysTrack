export interface CompanionHostConfig {
  host: "127.0.0.1";
  port: number;
  allowedOrigin: string;
  protocolVersion: string;
  pairingTokenTtlMs: number;
  sessionTokenTtlMs: number;
  maxPayloadBytes: number;
  connectionRateLimit: number;
  connectionRateWindowMs: number;
  preAuthTimeoutMs: number;
  runtimeEnabled: boolean;
  connectorConcurrency: number;
  connectorTimeoutMs: number;
  operationalCacheTtlMs: number;
  stableCacheTtlMs: number;
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = Number(value?.trim() || fallback);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

export function loadCompanionHostConfig(env: NodeJS.ProcessEnv = process.env): CompanionHostConfig {
  const host = env.COMPANION_HOST_BIND?.trim() || "127.0.0.1";
  if (host !== "127.0.0.1") throw new Error("COMPANION_HOST_BIND must be 127.0.0.1");

  const port = Number(env.COMPANION_HOST_PORT?.trim() || "38472");
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("COMPANION_HOST_PORT must be an integer between 0 and 65535");
  }
  const allowedOrigin = env.COMPANION_HOST_ALLOWED_ORIGIN?.trim() || "";
  if (!/^chrome-extension:\/\/[a-p]{32}$/.test(allowedOrigin)) {
    throw new Error("COMPANION_HOST_ALLOWED_ORIGIN must be an exact Chrome extension origin");
  }

  return {
    host,
    port,
    allowedOrigin,
    protocolVersion: env.COMPANION_HOST_PROTOCOL_VERSION?.trim() || "1",
    pairingTokenTtlMs: positiveInteger(env.COMPANION_HOST_PAIRING_TTL_MS, 60_000, "COMPANION_HOST_PAIRING_TTL_MS"),
    sessionTokenTtlMs: positiveInteger(env.COMPANION_HOST_SESSION_TTL_MS, 86_400_000, "COMPANION_HOST_SESSION_TTL_MS"),
    maxPayloadBytes: positiveInteger(env.COMPANION_HOST_MAX_PAYLOAD_BYTES, 64 * 1024, "COMPANION_HOST_MAX_PAYLOAD_BYTES"),
    connectionRateLimit: positiveInteger(env.COMPANION_HOST_RATE_LIMIT, 20, "COMPANION_HOST_RATE_LIMIT"),
    connectionRateWindowMs: positiveInteger(env.COMPANION_HOST_RATE_WINDOW_MS, 60_000, "COMPANION_HOST_RATE_WINDOW_MS"),
    preAuthTimeoutMs: positiveInteger(env.COMPANION_HOST_PREAUTH_TIMEOUT_MS, 5_000, "COMPANION_HOST_PREAUTH_TIMEOUT_MS"),
    runtimeEnabled: env.COMPANION_HOST_RUNTIME_ENABLED === "true",
    connectorConcurrency: positiveInteger(env.COMPANION_HOST_CONNECTOR_CONCURRENCY, 3, "COMPANION_HOST_CONNECTOR_CONCURRENCY"),
    connectorTimeoutMs: positiveInteger(env.COMPANION_HOST_CONNECTOR_TIMEOUT_MS, 30_000, "COMPANION_HOST_CONNECTOR_TIMEOUT_MS"),
    operationalCacheTtlMs: positiveInteger(env.COMPANION_HOST_OPERATIONAL_CACHE_TTL_MS, 120_000, "COMPANION_HOST_OPERATIONAL_CACHE_TTL_MS"),
    stableCacheTtlMs: positiveInteger(env.COMPANION_HOST_STABLE_CACHE_TTL_MS, 300_000, "COMPANION_HOST_STABLE_CACHE_TTL_MS")
  };
}
