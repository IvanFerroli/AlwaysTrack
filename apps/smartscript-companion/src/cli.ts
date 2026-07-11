#!/usr/bin/env node
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { isAllowedEvent, redactEventForStatus } from "./allowlist.js";
import { espansoYamlFor } from "./espanso.js";
import { processEvents } from "./processor.js";
import { appendRawEvent, dataDir, ensureStorage, purgeOldRawLogs, readJsonFile, readTodayCandidates, readTodayRawEvents, writeTodayCandidates, type CaptureEvent } from "./storage.js";

const [, , command, ...args] = process.argv;
const execFileAsync = promisify(execFile);
const defaultSessionCookieName = "alwaystrack_session";
const defaultFixturePath = fileURLToPath(new URL("../fixtures/alwayschat-sample.json", import.meta.url));

function argValue(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function apiBaseUrl() {
  return process.env.ALWAYSTRACK_API_URL || "http://localhost:3333";
}

function sessionCookieName() {
  return process.env.ALWAYSTRACK_SESSION_COOKIE_NAME || defaultSessionCookieName;
}

function sessionCookiePath() {
  return join(dataDir(), "session-cookie.json");
}

function normalizeSessionCookie(value: string) {
  const trimmed = value.trim();
  return trimmed.includes("=") ? trimmed : `${sessionCookieName()}=${trimmed}`;
}

async function readStoredSessionCookie() {
  const configured = process.env.ALWAYSTRACK_API_COOKIE || process.env.ALWAYSTRACK_SESSION_COOKIE;
  if (configured) return normalizeSessionCookie(configured);
  const stored = await readJsonFile<{ cookie?: string } | null>(sessionCookiePath(), null);
  return stored?.cookie ? normalizeSessionCookie(stored.cookie) : undefined;
}

async function requestHeaders() {
  const token = process.env.ALWAYSTRACK_API_TOKEN;
  const cookie = await readStoredSessionCookie();
  return {
    "content-type": "application/json",
    ...(token ? { authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
    ...(cookie ? { cookie } : {})
  };
}

async function postJson<T>(path: string, payload?: unknown): Promise<T> {
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: payload ? "POST" : "GET",
    headers: await requestHeaders(),
    body: payload ? JSON.stringify(payload) : undefined
  });
  const result = await response.json().catch(() => null) as { ok: boolean; data?: T; error?: { message: string } } | null;
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error?.message || `AlwaysTrack API request failed (${response.status})`);
  }
  return result.data as T;
}

async function login() {
  const email = argValue("--email") || process.env.ALWAYSTRACK_EMAIL;
  const password = argValue("--password") || process.env.ALWAYSTRACK_PASSWORD;
  if (!email || !password) {
    throw new Error("Informe --email/--password ou ALWAYSTRACK_EMAIL/ALWAYSTRACK_PASSWORD para autenticar o companion.");
  }
  const baseUrl = apiBaseUrl();
  const response = await fetch(`${baseUrl}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const result = await response.json().catch(() => null) as { ok: boolean; error?: { message: string } } | null;
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error?.message || `AlwaysTrack login failed (${response.status})`);
  }
  const headerApi = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = headerApi.getSetCookie?.() ?? (response.headers.get("set-cookie") ? [response.headers.get("set-cookie") as string] : []);
  const cookiePrefix = `${sessionCookieName()}=`;
  const sessionCookie = setCookies.find((value) => value.startsWith(cookiePrefix) || value.includes(` ${cookiePrefix}`)) ?? setCookies[0];
  const cookie = sessionCookie?.split(";")[0];
  if (!cookie) throw new Error("Login aceito, mas a API nao retornou cookie de sessao.");
  await ensureStorage();
  await writeFile(sessionCookiePath(), `${JSON.stringify({ cookie, apiUrl: baseUrl, createdAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ loggedIn: true, cookieStored: true, apiUrl: baseUrl, sessionCookieName: sessionCookieName() }, null, 2));
}

async function logout() {
  await rm(sessionCookiePath(), { force: true });
  console.log(JSON.stringify({ loggedOut: true, cookieStored: false }, null, 2));
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
  const storedAuth = await readJsonFile<{ cookie?: string } | null>(sessionCookiePath(), null);
  console.log(JSON.stringify({
    storage: dataDir(),
    rawLogsRemote: false,
    todayEvents: events.length,
    todayCandidates: candidates?.candidates.length ?? 0,
    auth: {
      envCookie: Boolean(process.env.ALWAYSTRACK_API_COOKIE || process.env.ALWAYSTRACK_SESSION_COOKIE),
      envToken: Boolean(process.env.ALWAYSTRACK_API_TOKEN),
      storedCookie: Boolean(storedAuth?.cookie)
    }
  }, null, 2));
}

async function captureFixture() {
  const file = argValue("--fixture");
  return captureFixtureFile(file, { rewriteAsToday: args.includes("--today") });
}

async function captureFixtureFile(file: string | undefined, options: { rewriteAsToday?: boolean } = {}) {
  if (!file) throw new Error("Informe --fixture com eventos anonimos.");
  const events = JSON.parse(await readFile(file, "utf8")) as CaptureEvent[];
  const baseTime = Date.now();
  let accepted = 0;
  let sample: ReturnType<typeof redactEventForStatus> | null = null;
  for (const [index, event] of events.entries()) {
    const eventForStorage = options.rewriteAsToday ? { ...event, timestamp: new Date(baseTime + index * 60_000).toISOString() } : event;
    if (!isAllowedEvent(eventForStorage)) continue;
    await appendRawEvent(eventForStorage);
    sample ??= redactEventForStatus(eventForStorage);
    accepted += 1;
  }
  const result = { accepted, discarded: events.length - accepted, sample };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function processToday() {
  const events = await readTodayRawEvents();
  const allowed = events.filter((event) => isAllowedEvent(event));
  const pkg = processEvents(allowed);
  await writeTodayCandidates(pkg);
  await purgeOldRawLogs();
  const result = { batchId: pkg.batchId, candidates: pkg.candidates.length, rawLogsRemote: false };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function importToday() {
  const pkg = await readTodayCandidates();
  if (!pkg) throw new Error("Nenhum pacote processado hoje. Rode smartscript process --today.");
  const payload = { batchId: pkg.batchId, processedAt: pkg.processedAt, candidates: pkg.candidates };
  const result = await postJson<{ items: unknown[] }>("/v1/script-library/smartscript/import", payload);
  const summary = { imported: result.items.length, rawLogsSent: false };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

async function exportEspanso() {
  const out = argValue("--out") || await defaultEspansoMatchPath();
  const result = await postJson<{ yaml: string; items: Array<{ title: string; trigger: string }> }>("/v1/script-library/smartscript/export/espanso");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, result.yaml || espansoYamlFor([]), "utf8");
  const daemon = await startOrReloadEspanso();
  const summary = { out, exported: result.items.length, sourceOfTruth: "AlwaysTrack", espansoDetected: daemon.detected, espansoReloaded: daemon.reloaded };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

function windowsPathToWslPath(value: string) {
  const normalized = value.trim().replaceAll("\\", "/");
  const match = normalized.match(/^([A-Za-z]):\/(.*)$/);
  return match ? `/mnt/${match[1].toLowerCase()}/${match[2]}` : normalized;
}

async function powershellEnv(name: string) {
  try {
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Write-Output $env:${name}`], { timeout: 5000 });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function defaultEspansoMatchPath() {
  if (process.env.SMARTSCRIPT_ESPANSO_MATCH_PATH) return process.env.SMARTSCRIPT_ESPANSO_MATCH_PATH;
  if (process.env.APPDATA) return join(process.env.APPDATA, "espanso", "match", "alwaystrack-smartscript.yml");
  const windowsAppData = await powershellEnv("APPDATA");
  if (windowsAppData) return join(windowsPathToWslPath(windowsAppData), "espanso", "match", "alwaystrack-smartscript.yml");
  return join(homedir(), ".config", "espanso", "match", "alwaystrack-smartscript.yml");
}

async function findWindowsEspansoDaemon() {
  const localAppData = await powershellEnv("LOCALAPPDATA");
  if (!localAppData) return "";
  const candidate = `${localAppData}\\Programs\\Espanso\\espansod.exe`;
  return existsSync(windowsPathToWslPath(candidate)) ? candidate : "";
}

async function startOrReloadEspanso() {
  const daemon = await findWindowsEspansoDaemon();
  if (!daemon) return { detected: false, reloaded: false };
  const escapedDaemon = daemon.replaceAll("'", "''");
  try {
    await execFileAsync("powershell.exe", ["-NoProfile", "-Command", `Start-Process '${escapedDaemon}' -ArgumentList 'launcher' -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500; & '${escapedDaemon}' cmd restart`], { timeout: 8000 });
    return { detected: true, reloaded: true };
  } catch {
    return { detected: true, reloaded: false };
  }
}

async function prepareEspanso() {
  const out = argValue("--out") || await defaultEspansoMatchPath();
  const initialYaml = espansoYamlFor([{ title: "AlwaysTrack SmartScript Test", trigger: ":at-test", body: "AlwaysTrack SmartScript ok" }]);
  await mkdir(dirname(out), { recursive: true });
  if (!existsSync(out)) {
    await writeFile(out, initialYaml, "utf8");
  }
  const daemon = await startOrReloadEspanso();
  console.log(JSON.stringify({ matchFile: out, testTrigger: ":at-test", espansoDetected: daemon.detected, espansoReloaded: daemon.reloaded }, null, 2));
}

async function smartScriptCounts() {
  const result = await postJson<{ counts?: Partial<Record<"IN_USE" | "GENERATED_TODAY" | "IN_REVIEW", number>> }>("/v1/script-library/smartscript/items");
  return {
    inUse: result.counts?.IN_USE ?? 0,
    generatedToday: result.counts?.GENERATED_TODAY ?? 0,
    inReview: result.counts?.IN_REVIEW ?? 0
  };
}

async function bootstrapLocal() {
  await start();
  await prepareEspanso();
  await login();
  const before = await smartScriptCounts();
  const shouldImportDemo = !args.includes("--no-demo") && before.inUse + before.generatedToday + before.inReview === 0;
  let demo: Awaited<ReturnType<typeof captureFixtureFile>> | null = null;
  let processResult: Awaited<ReturnType<typeof processToday>> | null = null;
  let importResult: Awaited<ReturnType<typeof importToday>> | null = null;
  if (shouldImportDemo) {
    demo = await captureFixtureFile(argValue("--fixture") || defaultFixturePath, { rewriteAsToday: true });
    processResult = await processToday();
    importResult = await importToday();
  }
  const after = await smartScriptCounts();
  const exportResult = after.inUse > 0 ? await exportEspanso() : null;
  console.log(JSON.stringify({
    ready: true,
    sourceOfTruth: "AlwaysTrack",
    demoImported: Boolean(importResult),
    demoSkipped: !shouldImportDemo,
    before,
    after,
    demo,
    processed: processResult,
    imported: importResult,
    exported: exportResult,
    nextUi: "Scriptoteca > SmartScript"
  }, null, 2));
}

async function main() {
  if (command === "bootstrap-local") return bootstrapLocal();
  if (command === "login") return login();
  if (command === "logout") return logout();
  if (command === "start") return start();
  if (command === "stop") return stop();
  if (command === "status" || !command) return status();
  if (command === "prepare-espanso") return prepareEspanso();
  if (command === "capture-fixture") return captureFixture();
  if (command === "process" && args.includes("--today")) return processToday();
  if (command === "import" && args.includes("--today")) return importToday();
  if (command === "export-espanso") return exportEspanso();
  throw new Error("Comando SmartScript desconhecido. Use bootstrap-local, login, logout, start, stop, status, prepare-espanso, process --today, import --today, export-espanso.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
