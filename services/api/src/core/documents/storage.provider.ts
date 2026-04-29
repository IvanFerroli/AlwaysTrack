import path from "node:path";
import { loadEnv } from "../../config/env.js";
import { LocalStorageProvider, type StorageProvider } from "./storage.js";

let provider: StorageProvider | null = null;

export function getStorageProvider() {
  if (provider) return provider;
  const env = loadEnv();
  provider = new LocalStorageProvider(path.resolve(process.cwd(), env.storageLocalDir));
  return provider;
}
