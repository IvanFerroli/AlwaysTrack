export type CaseFlowJsonKind =
  | "CASE_SOURCE_METADATA"
  | "CONNECTOR_DOMAINS"
  | "CONNECTOR_CAPABILITIES"
  | "CONNECTOR_FORBIDDEN_ACTIONS"
  | "CONNECTOR_SEARCH_KEYS"
  | "CONNECTOR_EXTRACTED_FIELDS"
  | "CONNECTOR_WARNINGS"
  | "CONNECTOR_DIAGNOSTICS"
  | "EVIDENCE_VALUE"
  | "EVIDENCE_NORMALIZED_VALUE"
  | "EVIDENCE_CONFLICT_FACT_IDS"
  | "CONNECTOR_HEALTH_DIAGNOSTICS";

type JsonPrimitive = boolean | number | string | null;
export type ControlledJsonValue = JsonPrimitive | ControlledJsonValue[] | { [key: string]: ControlledJsonValue };

const MAX_JSON_BYTES = 32 * 1024;
const FORBIDDEN_KEY = /(?:password|passwd|secret|token|cookie|authorization|session|html|dom|credential(?!hash))/i;
const HTML = /<(?:!doctype|html|head|body|script|style|iframe|form|input|button|div|span|table|a)(?:\s|>)/i;

const arrayKinds = new Set<CaseFlowJsonKind>([
  "CONNECTOR_DOMAINS",
  "CONNECTOR_CAPABILITIES",
  "CONNECTOR_FORBIDDEN_ACTIONS",
  "CONNECTOR_SEARCH_KEYS",
  "CONNECTOR_EXTRACTED_FIELDS",
  "CONNECTOR_WARNINGS",
  "EVIDENCE_CONFLICT_FACT_IDS"
]);

function assertControlled(value: ControlledJsonValue, path = "$"): void {
  if (typeof value === "string") {
    if (HTML.test(value)) throw new Error(`Raw HTML is not allowed in CaseFlow JSON at ${path}`);
    return;
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Non-finite numbers are not allowed in CaseFlow JSON at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertControlled(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object") throw new Error(`Unsupported CaseFlow JSON value at ${path}`);

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key)) throw new Error(`Sensitive CaseFlow JSON key is not allowed at ${path}.${key}`);
    assertControlled(child, `${path}.${key}`);
  }
}

export function stringifyCaseFlowJson(kind: CaseFlowJsonKind, value: ControlledJsonValue): string {
  if (arrayKinds.has(kind) && !Array.isArray(value)) throw new Error(`${kind} must be a JSON array`);
  assertControlled(value);

  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > MAX_JSON_BYTES) {
    throw new Error(`CaseFlow JSON exceeds ${MAX_JSON_BYTES} bytes for ${kind}`);
  }
  return serialized;
}

export function parseCaseFlowJson(value: string): ControlledJsonValue {
  const parsed: unknown = JSON.parse(value);
  assertControlled(parsed as ControlledJsonValue);
  return parsed as ControlledJsonValue;
}

export function assertCredentialHash(value: string): string {
  const normalized = value.trim();
  if (!/^[a-z0-9_-]+\$[A-Za-z0-9+/=_-]{32,512}$/i.test(normalized)) {
    throw new Error("Companion credential metadata must contain an algorithm-prefixed hash only");
  }
  return normalized;
}
