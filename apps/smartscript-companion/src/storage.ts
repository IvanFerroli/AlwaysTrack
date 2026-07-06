import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface CaptureEvent {
  id: string;
  timestamp: string;
  type: "clipboard" | "active-window" | "alwayschat-sent" | "chatgpt-copy" | "alwayschat-paste";
  source: string;
  destination?: string;
  text: string;
}

export interface CandidatePackage {
  batchId: string;
  processedAt: string;
  candidates: Array<{
    title: string;
    body: string;
    trigger: string;
    channel: string;
    tags: string[];
    source: string;
    occurrenceCount: number;
  }>;
}

export function dataDir() {
  return process.env.SMARTSCRIPT_DATA_DIR || join(homedir(), ".alwaystrack", "smartscript");
}

export function rawDir() {
  return join(dataDir(), "raw");
}

export function processedDir() {
  return join(dataDir(), "processed");
}

export async function ensureStorage() {
  await mkdir(rawDir(), { recursive: true });
  await mkdir(processedDir(), { recursive: true });
}

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true }).catch(() => undefined);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function appendRawEvent(event: CaptureEvent) {
  await ensureStorage();
  const path = join(rawDir(), `${event.timestamp.slice(0, 10)}.json`);
  const events = await readJsonFile<CaptureEvent[]>(path, []);
  events.push(event);
  await writeFile(path, `${JSON.stringify(events, null, 2)}\n`, "utf8");
}

export async function readTodayRawEvents(date = new Date()) {
  await ensureStorage();
  return readJsonFile<CaptureEvent[]>(join(rawDir(), `${date.toISOString().slice(0, 10)}.json`), []);
}

export async function writeTodayCandidates(pkg: CandidatePackage, date = new Date()) {
  await ensureStorage();
  await writeFile(join(processedDir(), `${date.toISOString().slice(0, 10)}.candidates.json`), `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

export async function readTodayCandidates(date = new Date()) {
  await ensureStorage();
  return readJsonFile<CandidatePackage | null>(join(processedDir(), `${date.toISOString().slice(0, 10)}.candidates.json`), null);
}

export async function purgeOldRawLogs(now = new Date()) {
  await ensureStorage();
  const keepAfter = now.getTime() - 24 * 60 * 60 * 1000;
  for (const file of await readdir(rawDir()).catch(() => [])) {
    const path = join(rawDir(), file);
    const info = await stat(path).catch(() => null);
    if (info && info.mtimeMs < keepAfter) await rm(path, { force: true });
  }
}
