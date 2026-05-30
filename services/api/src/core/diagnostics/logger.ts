type LogLevel = "info" | "warn" | "error";

const sensitiveKeyPattern = /(^|_)(token|secret|password|authorization|cookie|credential|api_key|private_key)$|apiKey$|privateKey$|clientSecret$/i;

function sanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Buffer.isBuffer(value)) return `[buffer:${value.length}]`;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack?.split("\n").slice(0, 6).join("\n") };
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, sensitiveKeyPattern.test(key) ? "[redacted]" : sanitize(item)])
    );
  }
  if (typeof value === "string") {
    const redacted = value
      .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted-google-key]")
      .replace(/Bearer\s+[0-9A-Za-z._-]+/gi, "Bearer [redacted]")
      .replace(/GOCSPX-[0-9A-Za-z_-]+/g, "[redacted-google-secret]");
    return redacted.length > 500 ? `${redacted.slice(0, 500)}...` : redacted;
  }
  return value;
}

export function logEvent(level: LogLevel, event: string, metadata: Record<string, unknown> = {}) {
  try {
    const cleanMetadata = sanitize(metadata) as Record<string, unknown>;
    const payload = {
      ts: new Date().toISOString(),
      level,
      event,
      ...cleanMetadata
    };
    const line = JSON.stringify(payload);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  } catch {
    // Diagnostics must never affect the operational flow.
  }
}
