export type HealthStatus = "ok" | "degraded";

export type ServiceId = "web" | "api";

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorPayload };

export interface HealthPayload {
  service: ServiceId;
  status: HealthStatus;
  timestamp: string;
  uptimeMs: number;
}

export interface PingPayload {
  message: "pong";
  timestamp: string;
}
