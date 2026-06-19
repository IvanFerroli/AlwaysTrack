import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredObject {
  fileKey: string;
  body: Buffer;
  mimeType: string;
}

export interface StorageProvider {
  put(input: { fileKey: string; body: Buffer; mimeType: string }): Promise<void>;
  get(fileKey: string): Promise<StoredObject>;
}

function ensureSafeKey(fileKey: string) {
  if (!fileKey || fileKey.includes("..") || path.isAbsolute(fileKey)) {
    throw new Error("INVALID_FILE_KEY");
  }
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly rootDir: string) {}

  async put(input: { fileKey: string; body: Buffer; mimeType: string }) {
    ensureSafeKey(input.fileKey);
    const targetPath = path.join(this.rootDir, input.fileKey);
    await mkdir(path.dirname(targetPath), { recursive: true, mode: 0o700 });
    await writeFile(targetPath, input.body, { mode: 0o600 });
  }

  async get(fileKey: string) {
    ensureSafeKey(fileKey);
    const body = await readFile(path.join(this.rootDir, fileKey));
    return { fileKey, body, mimeType: "application/octet-stream" };
  }
}

export interface S3CompatibleStorageOptions {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
  fetcher?: typeof fetch;
}

function sha256Hex(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function amzDate(now = new Date()) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodeKey(fileKey: string) {
  return fileKey.split("/").map(encodeURIComponent).join("/");
}

function signingKey(secretAccessKey: string, date: string, region: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, date);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

export class S3CompatibleStorageProvider implements StorageProvider {
  private readonly endpoint: URL;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: S3CompatibleStorageOptions) {
    this.endpoint = new URL(options.endpoint);
    this.fetcher = options.fetcher ?? fetch;
  }

  async put(input: { fileKey: string; body: Buffer; mimeType: string }) {
    ensureSafeKey(input.fileKey);
    const response = await this.request("PUT", input.fileKey, input.body, { "content-type": input.mimeType });
    if (!response.ok) throw new Error(`S3_PUT_FAILED:${response.status}`);
  }

  async get(fileKey: string) {
    ensureSafeKey(fileKey);
    const response = await this.request("GET", fileKey);
    if (!response.ok) throw new Error(`S3_GET_FAILED:${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    return {
      fileKey,
      body,
      mimeType: response.headers.get("content-type") ?? "application/octet-stream"
    };
  }

  private objectUrl(fileKey: string) {
    const encodedKey = encodeKey(fileKey);
    const url = new URL(this.endpoint.toString());
    if (this.options.forcePathStyle ?? true) {
      url.pathname = [url.pathname.replace(/\/$/, ""), this.options.bucket, encodedKey].filter(Boolean).join("/");
      return url;
    }
    url.hostname = `${this.options.bucket}.${url.hostname}`;
    url.pathname = [url.pathname.replace(/\/$/, ""), encodedKey].filter(Boolean).join("/");
    return url;
  }

  private async request(method: "GET" | "PUT", fileKey: string, body?: Buffer, extraHeaders: Record<string, string> = {}) {
    const url = this.objectUrl(fileKey);
    const payloadHash = sha256Hex(body ?? "");
    const timestamp = amzDate();
    const date = timestamp.slice(0, 8);
    const headers: Record<string, string> = {
      host: url.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp,
      ...extraHeaders
    };
    const sortedHeaderNames = Object.keys(headers).sort((left, right) => left.localeCompare(right));
    const canonicalHeaders = sortedHeaderNames.map((name) => `${name}:${headers[name]}\n`).join("");
    const signedHeaders = sortedHeaderNames.join(";");
    const canonicalRequest = [method, url.pathname, url.searchParams.toString(), canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const credentialScope = `${date}/${this.options.region}/s3/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", timestamp, credentialScope, sha256Hex(canonicalRequest)].join("\n");
    const signature = createHmac("sha256", signingKey(this.options.secretAccessKey, date, this.options.region))
      .update(stringToSign)
      .digest("hex");
    headers.authorization = `AWS4-HMAC-SHA256 Credential=${this.options.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return this.fetcher(url, { method, headers, body: body as unknown as BodyInit | undefined });
  }
}
