import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { access, mkdir, mkdtemp, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const workspaceRoot = fileURLToPath(new URL("../../..", import.meta.url));
const cliPath = join(workspaceRoot, "apps/smartscript-companion/src/cli.ts");
const fixturePath = join(workspaceRoot, "apps/smartscript-companion/fixtures/cli-e2e-synthetic.json");
const fakeCookie = "alwaystrack_session=fake-e2e-session-cookie";
const privateValues = ["Fulano Silva", "123456", "Rua Exemplo, 123", "fulano@example.com", "1198765-4321"];

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface RecordedRequest {
  path: string;
  body: unknown;
  cookie?: string;
}

function parseJsonOutput(output: string) {
  return JSON.parse(output) as Record<string, unknown>;
}

async function pathExists(path: string) {
  return access(path).then(() => true, () => false);
}

describe.sequential("SmartScript CLI controlled E2E", () => {
  let temporaryRoot = "";
  let storageDir = "";
  let espansoPath = "";
  let apiUrl = "";
  let apiAvailable = true;
  let server: Server;
  let requests: RecordedRequest[] = [];

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "alwaystrack-smartscript-e2e-"));
    storageDir = join(temporaryRoot, "storage");
    espansoPath = join(temporaryRoot, "espanso", "match", "alwaystrack-smartscript.yml");
    apiAvailable = true;
    requests = [];
    server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        const rawBody = Buffer.concat(chunks).toString("utf8");
        requests.push({
          path: request.url ?? "",
          body: rawBody ? JSON.parse(rawBody) : null,
          cookie: request.headers.cookie
        });
        response.setHeader("content-type", "application/json");
        if (!apiAvailable) {
          response.statusCode = 503;
          response.end(JSON.stringify({ ok: false, error: { message: "API fake indisponivel" } }));
          return;
        }
        if (request.url === "/v1/script-library/smartscript/import") {
          response.end(JSON.stringify({ ok: true, data: { items: [{ id: "fake-item-1" }] } }));
          return;
        }
        if (request.url === "/v1/script-library/smartscript/export/espanso") {
          response.end(JSON.stringify({
            ok: true,
            data: {
              yaml: "matches:\n  - trigger: \":status-e2e\"\n    replace: \"Resposta sintetica revisada\"\n",
              items: [{ title: "Status E2E", trigger: ":status-e2e" }]
            }
          }));
          return;
        }
        response.statusCode = 404;
        response.end(JSON.stringify({ ok: false, error: { message: "Rota fake ausente" } }));
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("API fake sem porta TCP");
    apiUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(temporaryRoot, { recursive: true, force: true });
    expect(await pathExists(temporaryRoot)).toBe(false);
  });

  function runCli(args: string[], overrides: NodeJS.ProcessEnv = {}) {
    return new Promise<CliResult>((resolve, reject) => {
      const child = spawn(process.execPath, ["--import", "tsx", cliPath, ...args], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          HOME: temporaryRoot,
          PATH: "",
          SMARTSCRIPT_DATA_DIR: storageDir,
          SMARTSCRIPT_ESPANSO_MATCH_PATH: espansoPath,
          ALWAYSTRACK_API_URL: apiUrl,
          ALWAYSTRACK_API_COOKIE: fakeCookie,
          ALWAYSTRACK_API_TOKEN: "",
          ALWAYSTRACK_SESSION_COOKIE: "",
          ...overrides
        },
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
      child.once("error", reject);
      child.once("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
  }

  function expectNoPrivateOutput(result: CliResult) {
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).not.toContain(fakeCookie);
    for (const value of privateValues) expect(output).not.toContain(value);
  }

  it("covers start, status, process, import, export, retention and idempotency in temporary storage", async () => {
    const firstStart = await runCli(["start"]);
    const secondStart = await runCli(["start"]);
    expect(firstStart.code).toBe(0);
    expect(secondStart.code).toBe(0);
    expect(firstStart.stdout).toContain(storageDir);

    const initialStatus = await runCli(["status"]);
    expect(initialStatus.code).toBe(0);
    expect(parseJsonOutput(initialStatus.stdout)).toMatchObject({
      storage: storageDir,
      rawLogsRemote: false,
      todayEvents: 0,
      todayCandidates: 0,
      auth: { envCookie: true, envToken: false, storedCookie: false }
    });

    const capture = await runCli(["capture-fixture", "--fixture", fixturePath, "--today"]);
    expect(capture.code).toBe(0);
    expect(parseJsonOutput(capture.stdout)).toMatchObject({ accepted: 2, discarded: 1 });
    expect(capture.stdout).not.toContain("text\":");

    const processResult = await runCli(["process", "--today"]);
    expect(processResult.code).toBe(0);
    expect(parseJsonOutput(processResult.stdout)).toMatchObject({ candidates: 1, rawLogsRemote: false });
    const date = new Date().toISOString().slice(0, 10);
    const processedPath = join(storageDir, "processed", `${date}.candidates.json`);
    const processed = await readFile(processedPath, "utf8");
    for (const value of privateValues) expect(processed).not.toContain(value);
    expect(processed).toContain("{nome_cliente}");
    expect(processed).toContain("{email_cliente}");
    expect(processed).toContain("{telefone_cliente}");

    const firstImport = await runCli(["import", "--today"]);
    const secondImport = await runCli(["import", "--today"]);
    expect(firstImport.code).toBe(0);
    expect(secondImport.code).toBe(0);
    expect(parseJsonOutput(firstImport.stdout)).toMatchObject({ imported: 1, rawLogsSent: false });
    const imports = requests.filter((request) => request.path.endsWith("/import"));
    expect(imports).toHaveLength(2);
    expect(imports[0]?.cookie).toBe(fakeCookie);
    expect(imports[0]?.body).not.toHaveProperty("events");
    const importPayload = JSON.stringify(imports[0]?.body);
    expect(importPayload).not.toContain("e2e-allowed-001");
    for (const value of privateValues) expect(importPayload).not.toContain(value);

    const firstExport = await runCli(["export-espanso"]);
    const secondExport = await runCli(["export-espanso"]);
    expect(firstExport.code).toBe(0);
    expect(secondExport.code).toBe(0);
    expect(parseJsonOutput(firstExport.stdout)).toMatchObject({
      out: espansoPath,
      exported: 1,
      espansoDetected: false,
      espansoReloaded: false
    });
    expect(await readFile(espansoPath, "utf8")).toContain(":status-e2e");

    const staleRawPath = join(storageDir, "raw", "2000-01-01.json");
    await writeFile(staleRawPath, "[]\n", "utf8");
    await utimes(staleRawPath, new Date(0), new Date(0));
    expect((await stat(staleRawPath)).isFile()).toBe(true);
    expect((await runCli(["status"])).code).toBe(0);
    expect(await pathExists(staleRawPath)).toBe(false);

    const stop = await runCli(["stop"]);
    expect(stop.code).toBe(0);
    const runningState = JSON.parse(await readFile(join(storageDir, "running.json"), "utf8")) as Record<string, unknown>;
    expect(runningState).toMatchObject({ rawLogsRemote: false });
    expect(runningState).toHaveProperty("stoppedAt");

    for (const result of [firstStart, secondStart, initialStatus, capture, processResult, firstImport, secondImport, firstExport, secondExport, stop]) {
      expectNoPrivateOutput(result);
    }
  }, 30_000);

  it("handles corrupted local files and API failure without leaking data or overwriting Espanso", async () => {
    const date = new Date().toISOString().slice(0, 10);
    await mkdir(join(storageDir, "raw"), { recursive: true });
    await mkdir(join(storageDir, "processed"), { recursive: true });
    await writeFile(join(storageDir, "session-cookie.json"), "{corrompido", "utf8");
    await writeFile(join(storageDir, "raw", `${date}.json`), "[corrompido", "utf8");
    await writeFile(join(storageDir, "processed", `${date}.candidates.json`), "{corrompido", "utf8");

    const status = await runCli(["status"]);
    expect(status.code).toBe(0);
    expect(parseJsonOutput(status.stdout)).toMatchObject({ todayEvents: 0, todayCandidates: 0 });
    const emptyProcess = await runCli(["process", "--today"]);
    expect(emptyProcess.code).toBe(0);
    expect(parseJsonOutput(emptyProcess.stdout)).toMatchObject({ candidates: 0, rawLogsRemote: false });

    await rm(join(storageDir, "processed", `${date}.candidates.json`));
    const missingImport = await runCli(["import", "--today"]);
    expect(missingImport.code).toBe(1);
    expect(missingImport.stderr).toContain("Nenhum pacote processado hoje");

    await runCli(["capture-fixture", "--fixture", fixturePath, "--today"]);
    await runCli(["process", "--today"]);
    await mkdir(dirname(espansoPath), { recursive: true });
    await writeFile(espansoPath, "conteudo-anterior\n", "utf8");
    apiAvailable = false;

    const unavailableImport = await runCli(["import", "--today"]);
    const unavailableExport = await runCli(["export-espanso"]);
    expect(unavailableImport.code).toBe(1);
    expect(unavailableExport.code).toBe(1);
    expect(unavailableImport.stderr).toContain("API fake indisponivel");
    expect(unavailableExport.stderr).toContain("API fake indisponivel");
    expect(await readFile(espansoPath, "utf8")).toBe("conteudo-anterior\n");
    for (const result of [status, emptyProcess, missingImport, unavailableImport, unavailableExport]) expectNoPrivateOutput(result);
  }, 30_000);

  it("fails filesystem commands safely when the configured storage is not a directory", async () => {
    const blockedStorage = join(temporaryRoot, "blocked-storage");
    await writeFile(blockedStorage, "arquivo sintetico\n", "utf8");
    for (const command of [["start"], ["status"], ["process", "--today"]]) {
      const result = await runCli(command, { SMARTSCRIPT_DATA_DIR: blockedStorage });
      expect(result.code).toBe(1);
      expect(result.stdout).toBe("");
      expectNoPrivateOutput(result);
    }
    expect(await readFile(blockedStorage, "utf8")).toBe("arquivo sintetico\n");
  }, 15_000);
});
