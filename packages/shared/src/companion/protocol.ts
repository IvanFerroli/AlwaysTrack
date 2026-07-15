import type { CompanionHelloEvent, CompanionPairedEvent } from "./events.js";

export const companionProtocolVersion = "1" as const;

export const companionProtocolErrorCodes = [
  "INVALID_MESSAGE",
  "ORIGIN_REJECTED",
  "PAIRING_REJECTED",
  "PAIRING_REQUIRED",
  "PAIRING_TIMEOUT",
  "VERSION_MISMATCH"
] as const;
export type CompanionProtocolErrorCode = (typeof companionProtocolErrorCodes)[number];

export interface CompanionProtocolError {
  type: "COMPANION_ERROR";
  protocolVersion: typeof companionProtocolVersion;
  messageId: string;
  timestamp: string;
  payload: { code: CompanionProtocolErrorCode };
}

export type CompanionReconnectGrant = CompanionPairedEvent["payload"];

export type RuntimeSchemaResult<T> = { success: true; data: T } | { success: false };

export interface RuntimeSchema<T> {
  safeParse(value: unknown): RuntimeSchemaResult<T>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function schema<T>(validate: (value: unknown) => value is T): RuntimeSchema<T> {
  return {
    safeParse(value) {
      return validate(value) ? { success: true, data: value } : { success: false };
    }
  };
}

export const companionHelloSchema = schema<CompanionHelloEvent>((value): value is CompanionHelloEvent => {
  if (!isRecord(value) || !isRecord(value.payload)) return false;
  return value.type === "COMPANION_HELLO"
    && value.protocolVersion === companionProtocolVersion
    && isNonEmptyString(value.messageId)
    && isTimestamp(value.timestamp)
    && isNonEmptyString(value.extensionInstanceId)
    && isNonEmptyString(value.payload.token)
    && Array.isArray(value.payload.supportedProtocolVersions)
    && value.payload.supportedProtocolVersions.length > 0
    && value.payload.supportedProtocolVersions.every((version) => version === companionProtocolVersion);
});

export const companionReconnectSchema = schema<CompanionReconnectGrant>((value): value is CompanionReconnectGrant => {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.sessionId)
    && isTimestamp(value.expiresAt)
    && isNonEmptyString(value.reconnectToken);
});

export const companionPairedSchema = schema<CompanionPairedEvent>((value): value is CompanionPairedEvent => {
  if (!isRecord(value)) return false;
  return value.type === "COMPANION_PAIRED"
    && value.protocolVersion === companionProtocolVersion
    && isNonEmptyString(value.messageId)
    && isTimestamp(value.timestamp)
    && isNonEmptyString(value.installationId)
    && isNonEmptyString(value.browserProfileId)
    && isNonEmptyString(value.userId)
    && companionReconnectSchema.safeParse(value.payload).success;
});

export const companionProtocolErrorSchema = schema<CompanionProtocolError>((value): value is CompanionProtocolError => {
  if (!isRecord(value) || !isRecord(value.payload)) return false;
  return value.type === "COMPANION_ERROR"
    && value.protocolVersion === companionProtocolVersion
    && isNonEmptyString(value.messageId)
    && isTimestamp(value.timestamp)
    && companionProtocolErrorCodes.includes(value.payload.code as CompanionProtocolErrorCode);
});

export function parseCompanionJson(data: unknown): unknown {
  try {
    return JSON.parse(String(data)) as unknown;
  } catch {
    return undefined;
  }
}
