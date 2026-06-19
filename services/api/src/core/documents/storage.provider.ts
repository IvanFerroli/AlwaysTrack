import path from "node:path";
import { loadEnv } from "../../config/env.js";
import { LocalStorageProvider, S3CompatibleStorageProvider, type StorageProvider } from "./storage.js";

let provider: StorageProvider | null = null;

export function getStorageProvider() {
  if (provider) return provider;
  const env = loadEnv();
  if (env.storageProvider === "s3") {
    if (!env.storageS3Endpoint || !env.storageS3Bucket || !env.storageS3AccessKeyId || !env.storageS3SecretAccessKey) {
      throw new Error("STORAGE_S3_NOT_CONFIGURED");
    }
    provider = new S3CompatibleStorageProvider({
      endpoint: env.storageS3Endpoint,
      bucket: env.storageS3Bucket,
      region: env.storageS3Region ?? "us-east-1",
      accessKeyId: env.storageS3AccessKeyId,
      secretAccessKey: env.storageS3SecretAccessKey,
      forcePathStyle: env.storageS3ForcePathStyle
    });
    return provider;
  }
  provider = new LocalStorageProvider(path.resolve(process.cwd(), env.storageLocalDir));
  return provider;
}
