#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isAllowedEvent, redactEventForStatus } from "./allowlist.js";
import { espansoYamlFor } from "./espanso.js";
import { processEvents } from "./processor.js";
import { appendRawEvent, dataDir, ensureStorage, purgeOldRawLogs, readTodayCandidates, readTodayRawEvents, writeTodayCandidates, type CaptureEvent } from "./storage.js";

const [, , command, ...args] = process.argv;

function argValue(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function postJson<T>(path: string, payload?: unknown): Promise<T> {
  const baseUrl = process.env.ALWAYSTRACK_API_URL || "http://localhost:3333";
  const token = process.env.ALWAYSTRACK_API_TOKEN;
  const response = await fetch(`${baseUrl}${path}`, {
    method: payload ? "POST" : "GET",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: payload ? JSON.stringify(payload) : undefined
  });
  const result = await response.json() as { ok: boolean; data?: T; error?: { message: string } };
  if (!result.ok) throw new Error(result.error?.message || "AlwaysTrack API request failed");
  return result.data as T;
}

async function start() {
  await ensureStorage();
  await writeFile(join(dataDir(), "running.json"), `${JSON.stringify({ startedAt: new Date().toISOString(), rawLogsRemote: false }, null, 2)}\n`, "utf8");
  console.log(`SmartScript companion iniciado. Storage local: ${dataDir()}`);
}

async function stop() {
  await ensureStorage();
  await writeFile(join(dataDir(), "running.json"), `${JSON.stringify({ stoppedAt: new Date().toISOString(), rawLogsRemote: false }, null, 2)}\n`, "utf8");
  console.log("SmartScript companion parado. Nenhuma captura ocorre com o companion parado.");
}

async function status() {
  await ensureStorage();
  await purgeOldRawLogs();
  const events = await readTodayRawEvents();
  const candidates = await readTodayCandidates();
  console.log(JSON.stringify({ storage: dataDir(), rawLogsRemote: false, todayEvents: events.length, todayCandidates: candidates?.candidates.length ?? 0 }, null, 2));
}

async function captureFixture() {
  const file = argValue("--fixture");
  if (!file) throw new Error("Informe --fixture com eventos anonimos.");
  const events = JSON.parse(await readFile(file, "utf8")) as CaptureEvent[];
  let accepted = 0;
  for (const event of events) {
    if (!isAllowedEvent(event)) continue;
    await appendRawEvent(event);
    accepted += 1;
  }
  console.log(JSON.stringify({ accepted, discarded: events.length - accepted, sample: events[0] ? redactEventForStatus(events[0]) : null }, null, 2));
}

async function processToday() {
  const events = await readTodayRawEvents();
  const allowed = events.filter((event) => isAllowedEvent(event));
  const pkg = processEvents(allowed);
  await writeTodayCandidates(pkg);
  await purgeOldRawLogs();
  console.log(JSON.stringify({ batchId: pkg.batchId, candidates: pkg.candidates.length, rawLogsRemote: false }, null, 2));
}

async function importToday() {
  const pkg = await readTodayCandidates();
  if (!pkg) throw new Error("Nenhum pacote processado hoje. Rode smartscript process --today.");
  const payload = { batchId: pkg.batchId, processedAt: pkg.processedAt, candidates: pkg.candidates };
  const result = await postJson<{ items: unknown[] }>("/v1/script-library/smartscript/import", payload);
  console.log(JSON.stringify({ imported: result.items.length, rawLogsSent: false }, null, 2));
}

async function exportEspanso() {
  const out = argValue("--out") || join(dataDir(), "espanso", "alwaystrack-smartscript.yml");
  const result = await postJson<{ yaml: string; items: Array<{ title: string; trigger: string }> }>("/v1/script-library/smartscript/export/espanso");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, result.yaml || espansoYamlFor([]), "utf8");
  console.log(JSON.stringify({ out, exported: result.items.length, sourceOfTruth: "AlwaysTrack" }, null, 2));
}

async function main() {
  if (command === "start") return start();
  if (command === "stop") return stop();
  if (command === "status" || !command) return status();
  if (command === "capture-fixture") return captureFixture();
  if (command === "process" && args.includes("--today")) return processToday();
  if (command === "import" && args.includes("--today")) return importToday();
  if (command === "export-espanso") return exportEspanso();
  throw new Error("Comando SmartScript desconhecido. Use start, stop, status, process --today, import --today, export-espanso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
