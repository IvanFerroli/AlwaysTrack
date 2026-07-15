import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCli } from "./cli.js";

const fixturePath = new URL("../fixtures/cli-e2e-synthetic.json", import.meta.url).pathname;

describe.sequential("SmartScript in-process command runner", () => {
  let temporaryRoot = "";
  let storageDir = "";
  let previousEnv: NodeJS.ProcessEnv;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "alwaystrack-smartscript-cli-"));
    storageDir = join(temporaryRoot, "storage");
    previousEnv = { ...process.env };
    process.env.SMARTSCRIPT_DATA_DIR = storageDir;
    process.env.SMARTSCRIPT_ESPANSO_MATCH_PATH = join(temporaryRoot, "espanso", "matches.yml");
    process.env.PATH = "";
    delete process.env.ALWAYSTRACK_API_COOKIE;
    delete process.env.ALWAYSTRACK_SESSION_COOKIE;
    delete process.env.ALWAYSTRACK_API_TOKEN;
    log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    process.env = previousEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("dispatches local lifecycle, capture and processing commands", async () => {
    await runCli(["start"]);
    await runCli(["start"]);
    await runCli(["status"]);
    await runCli(["capture-fixture", "--fixture", fixturePath, "--today"]);
    const processed = await runCli(["process", "--today"]);
    await runCli(["stop"]);
    await runCli(["logout"]);

    expect(processed).toMatchObject({ candidates: 1, rawLogsRemote: false });
    expect(JSON.parse(await readFile(join(storageDir, "running.json"), "utf8"))).toHaveProperty("stoppedAt");
    expect(log).toHaveBeenCalled();
  });

  it("handles login, authenticated import and Espanso export through controlled fetch", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.endsWith("/v1/auth/login")) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json", "set-cookie": "alwaystrack_session=test-session; Path=/; HttpOnly" }
        });
      }
      if (url.endsWith("/import")) {
        return new Response(JSON.stringify({ ok: true, data: { items: [{ id: "item-1" }] } }), { status: 200 });
      }
      return new Response(JSON.stringify({
        ok: true,
        data: { yaml: "matches:\n", items: [{ title: "Status", trigger: ":status" }] }
      }), { status: 200 });
    }));

    await runCli(["login", "--email", "synthetic@example.test", "--password", "test-only"]);
    await runCli(["capture-fixture", "--fixture", fixturePath, "--today"]);
    await runCli(["process", "--today"]);
    await expect(runCli(["import", "--today"])).resolves.toMatchObject({ imported: 1, rawLogsSent: false });
    await expect(runCli(["export-espanso"])).resolves.toMatchObject({ exported: 1, sourceOfTruth: "AlwaysTrack" });

    expect(requests.find(({ url }) => url.endsWith("/import"))?.init?.headers).toMatchObject({
      cookie: "alwaystrack_session=test-session"
    });
    expect(await readFile(process.env.SMARTSCRIPT_ESPANSO_MATCH_PATH!, "utf8")).toBe("matches:\n");
  });

  it("rejects invalid or incomplete commands without exiting the test process", async () => {
    await expect(runCli(["capture-fixture"])).rejects.toThrow("Informe --fixture");
    await expect(runCli(["import", "--today"])).rejects.toThrow("Nenhum pacote processado hoje");
    await expect(runCli(["unknown"])).rejects.toThrow("Comando SmartScript desconhecido");

    await writeFile(join(temporaryRoot, "not-a-directory"), "blocked\n", "utf8");
    process.env.SMARTSCRIPT_DATA_DIR = join(temporaryRoot, "not-a-directory");
    await expect(runCli(["status"])).rejects.toThrow();
  });
});
