import type { IncomingMessage } from "node:http";

const DEFAULT_MAX_FORM_BYTES = 1_000_000;

export async function readFormBody(
  request: IncomingMessage,
  maxBytes = DEFAULT_MAX_FORM_BYTES
): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > maxBytes) {
      throw new Error("REQUEST_BODY_TOO_LARGE");
    }
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  return new URLSearchParams(raw);
}
