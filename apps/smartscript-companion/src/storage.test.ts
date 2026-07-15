import { access, mkdtemp, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendRawEvent,
  dataDir,
  ensureStorage,
  processedDir,
  purgeOldRawLogs,
  rawDir,
  readJsonFile,
  readTodayCandidates,
  readTodayRawEvents,
  writeJsonFile,
  writeTodayCandidates,
  type CandidatePackage,
  type CaptureEvent
} from "./storage.js";

const date = new Date("2026-07-15T12:00:00.000Z");
const event: CaptureEvent = {
  id: "event-1",
  timestamp: date.toISOString(),
  type: "alwayschat-sent",
  source: "AlwaysChat",
  destination: "AlwaysChat",
  text: "Synthetic event"
};
const candidates: CandidatePackage = {
  batchId: "batch-1",
  processedAt: date.toISOString(),
  candidates: []
};

async function exists(path: string) {
  return access(path).then(() => true, () => false);
}

describe.sequential("SmartScript storage", () => {
  let temporaryRoot = "";
  let previousDataDir: string | undefined;

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "alwaystrack-smartscript-storage-"));
    previousDataDir = process.env.SMARTSCRIPT_DATA_DIR;
    process.env.SMARTSCRIPT_DATA_DIR = join(temporaryRoot, "nested", "storage");
  });

  afterEach(async () => {
    if (previousDataDir === undefined) delete process.env.SMARTSCRIPT_DATA_DIR;
    else process.env.SMARTSCRIPT_DATA_DIR = previousDataDir;
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("creates the configured directory structure idempotently", async () => {
    expect(dataDir()).toBe(join(temporaryRoot, "nested", "storage"));
    expect(rawDir()).toBe(join(dataDir(), "raw"));
    expect(processedDir()).toBe(join(dataDir(), "processed"));

    await ensureStorage();
    await ensureStorage();

    expect((await stat(rawDir())).isDirectory()).toBe(true);
    expect((await stat(processedDir())).isDirectory()).toBe(true);
  });

  it("reads valid JSON and falls back for missing or malformed files", async () => {
    const validPath = join(temporaryRoot, "valid.json");
    const invalidPath = join(temporaryRoot, "invalid.json");
    await writeFile(validPath, '{"value":42}\n', "utf8");
    await writeFile(invalidPath, "{invalid", "utf8");

    await expect(readJsonFile(validPath, { value: 0 })).resolves.toEqual({ value: 42 });
    await expect(readJsonFile(invalidPath, { fallback: true })).resolves.toEqual({ fallback: true });
    await expect(readJsonFile(join(temporaryRoot, "missing.json"), null)).resolves.toBeNull();
  });

  it("writes formatted JSON and creates missing parents", async () => {
    const path = join(temporaryRoot, "deep", "tree", "value.json");
    await writeJsonFile(path, { enabled: true });
    expect(await readFile(path, "utf8")).toBe('{\n  "enabled": true\n}\n');
  });

  it("appends raw events by timestamp date and reads a requested day", async () => {
    await appendRawEvent(event);
    await appendRawEvent({ ...event, id: "event-2" });

    await expect(readTodayRawEvents(date)).resolves.toEqual([event, { ...event, id: "event-2" }]);
    await expect(readTodayRawEvents(new Date("2026-07-16T12:00:00.000Z"))).resolves.toEqual([]);
  });

  it("round-trips daily candidates and tolerates corrupted content", async () => {
    await writeTodayCandidates(candidates, date);
    await expect(readTodayCandidates(date)).resolves.toEqual(candidates);

    const path = join(processedDir(), "2026-07-15.candidates.json");
    await writeFile(path, "{corrupted", "utf8");
    await expect(readTodayCandidates(date)).resolves.toBeNull();
  });

  it("purges only raw entries older than 24 hours", async () => {
    await ensureStorage();
    const stalePath = join(rawDir(), "stale.json");
    const freshPath = join(rawDir(), "fresh.json");
    await writeFile(stalePath, "[]\n", "utf8");
    await writeFile(freshPath, "[]\n", "utf8");
    await utimes(stalePath, new Date("2026-07-13T11:59:59.000Z"), new Date("2026-07-13T11:59:59.000Z"));
    await utimes(freshPath, new Date("2026-07-14T12:00:01.000Z"), new Date("2026-07-14T12:00:01.000Z"));

    await purgeOldRawLogs(date);

    expect(await exists(stalePath)).toBe(false);
    expect(await exists(freshPath)).toBe(true);
  });
});
