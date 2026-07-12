import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

function waitForReady(child: ReturnType<typeof spawn>): Promise<{ port: number }> {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Host readiness timeout: ${output}`)), 5_000);
    child.once("error", reject);
    const stdout = child.stdout;
    if (!stdout) {
      clearTimeout(timeout);
      reject(new Error("Host subprocess stdout is unavailable"));
      return;
    }
    stdout.on("data", (chunk) => {
      output += chunk.toString();
      for (const line of output.split("\n")) {
        if (!line.includes("companion_host.ready")) continue;
        clearTimeout(timeout);
        resolve(JSON.parse(line) as { port: number });
      }
    });
  });
}

function waitForExit(child: ReturnType<typeof spawn>): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Host shutdown timeout")), 5_000);
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
}

describe.each(["SIGINT", "SIGTERM"] as const)("Companion Host process shutdown with %s", (signal) => {
  it("exits cleanly and releases its ephemeral port", async () => {
    const child = spawn(process.execPath, ["--import", "tsx", "src/main.ts"], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, COMPANION_HOST_PORT: "0", COMPANION_HOST_ALLOWED_ORIGIN: "chrome-extension://abcdefghijklmnopabcdefghijklmnop" },
      stdio: ["ignore", "pipe", "pipe"]
    });

    const { port } = await waitForReady(child);
    expect((await fetch(`http://127.0.0.1:${port}/health`)).status).toBe(200);
    const exited = waitForExit(child);
    child.kill(signal);
    expect(await exited).toEqual({ code: 0, signal: null });
    await expect(fetch(`http://127.0.0.1:${port}/health`)).rejects.toThrow();
  });
});
