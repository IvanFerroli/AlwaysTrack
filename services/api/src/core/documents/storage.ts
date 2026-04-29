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
