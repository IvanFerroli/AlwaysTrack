export class ExternalHttpError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
  }
}

const sensitiveKeyPattern = /token|secret|password|authorization|cookie|credential|api[_-]?key|private[_-]?key/i;

export function redactExternalData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactExternalData);
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    output[key] = sensitiveKeyPattern.test(key) ? "[redacted]" : redactExternalData(item);
  }
  return output;
}

export async function externalFetch(
  fetcher: typeof fetch,
  url: string | URL,
  init: RequestInit = {},
  options: { timeoutMs?: number; operation?: string } = {}
) {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const signal = init.signal ?? AbortSignal.timeout(timeoutMs);
  try {
    return await fetcher(url, { ...init, signal });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ExternalHttpError(`${options.operation ?? "external request"} timed out after ${timeoutMs}ms`, error);
    }
    throw error;
  }
}
