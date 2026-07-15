import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  closeCompanionServer: vi.fn(),
  loadCompanionHostConfig: vi.fn(() => ({ host: "127.0.0.1", port: 0 })),
  startCompanionServer: vi.fn()
}));

vi.mock("./config.js", () => ({ loadCompanionHostConfig: mocks.loadCompanionHostConfig }));
vi.mock("./server/health-server.js", () => ({
  closeCompanionServer: mocks.closeCompanionServer,
  startCompanionServer: mocks.startCompanionServer
}));

describe("Companion Host bootstrap", () => {
  const signalHandlers = new Map<string, (...args: never[]) => void>();
  let originalExitCode: typeof process.exitCode;

  beforeEach(() => {
    vi.resetModules();
    mocks.closeCompanionServer.mockReset().mockResolvedValue(undefined);
    mocks.loadCompanionHostConfig.mockClear();
    mocks.startCompanionServer.mockReset().mockResolvedValue({
      server: { address: () => ({ address: "127.0.0.1", port: 38472 }) },
      gateway: { close: vi.fn() }
    });
    signalHandlers.clear();
    vi.spyOn(process, "once").mockImplementation(((event: string, listener: (...args: never[]) => void) => {
      signalHandlers.set(event, listener);
      return process;
    }) as typeof process.once);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it.each(["SIGINT", "SIGTERM"] as const)("starts and shuts down once for %s without real resources", async (signal) => {
    let release!: () => void;
    mocks.closeCompanionServer.mockImplementation(() => new Promise<void>((resolve) => { release = resolve; }));

    await import("./main.js");

    expect(mocks.loadCompanionHostConfig).toHaveBeenCalledOnce();
    expect(mocks.startCompanionServer).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalledWith(JSON.stringify({
      event: "companion_host.ready",
      host: "127.0.0.1",
      port: 38472,
      protocol: "websocket"
    }));

    signalHandlers.get(signal)?.();
    signalHandlers.get(signal)?.();
    expect(mocks.closeCompanionServer).toHaveBeenCalledOnce();
    release();
    await vi.waitFor(() => expect(console.log).toHaveBeenCalledWith(JSON.stringify({ event: "companion_host.stopped", signal })));
  });

  it.each([
    [new Error("close failed"), "close failed"],
    ["opaque failure", "UNKNOWN"]
  ])("reports shutdown failure without leaking the rejection", async (failure, expectedMessage) => {
    mocks.closeCompanionServer.mockRejectedValue(failure);
    await import("./main.js");

    signalHandlers.get("SIGTERM")?.();

    await vi.waitFor(() => expect(console.error).toHaveBeenCalledWith(JSON.stringify({
      event: "companion_host.stop_failed",
      signal: "SIGTERM",
      message: expectedMessage
    })));
    expect(process.exitCode).toBe(1);
  });
});
