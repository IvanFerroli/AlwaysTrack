import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProtocolClientOptions } from "./protocol-client.js";

interface ListenerSet<T extends (...args: any[]) => void> {
  listeners: Set<T>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
}

function event<T extends (...args: any[]) => void>(): ListenerSet<T> {
  const listeners = new Set<T>();
  return {
    listeners,
    addListener: vi.fn((listener: T) => listeners.add(listener)),
    removeListener: vi.fn((listener: T) => listeners.delete(listener))
  };
}

function chromeFixture() {
  return {
    runtime: {
      onInstalled: event<() => void>(),
      onMessage: event<(message: unknown) => void>(),
      sendMessage: vi.fn(() => Promise.resolve())
    },
    sidePanel: { setPanelBehavior: vi.fn(() => Promise.resolve()) }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("MV3 service worker bootstrap", () => {
  it("registers operational listeners, forwards pairing and tears down cleanly", async () => {
    const fixture = chromeFixture();
    vi.stubGlobal("chrome", fixture);
    const lifecycle = { pair: vi.fn(), start: vi.fn(), stop: vi.fn() };
    const module = await import("./service-worker.js");

    // Exercise a separately owned lifecycle so teardown can be asserted without
    // interfering with the automatically bootstrapped MV3 instance.
    let options: ProtocolClientOptions | undefined;
    const teardown = module.bootstrapServiceWorker(fixture as unknown as CompanionChromeApi, (candidate) => {
      options = candidate;
      return lifecycle;
    });

    expect(lifecycle.start).toHaveBeenCalledOnce();
    expect(fixture.runtime.onInstalled.listeners).toHaveLength(2);
    expect(fixture.runtime.onMessage.listeners).toHaveLength(2);

    const installed = [...fixture.runtime.onInstalled.listeners].at(-1)!;
    installed();
    await vi.waitFor(() => expect(fixture.sidePanel.setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true }));

    const onMessage = [...fixture.runtime.onMessage.listeners].at(-1)!;
    onMessage({ type: "IGNORED", token: "not-used" });
    onMessage({ type: "PAIR_COMPANION" });
    onMessage({ type: "PAIR_COMPANION", token: "pair-token" });
    expect(lifecycle.pair).toHaveBeenCalledOnce();
    expect(lifecycle.pair).toHaveBeenCalledWith("pair-token");

    options!.onState("CONNECTED");
    await expect(fixture.runtime.sendMessage.mock.results.at(-1)!.value).resolves.toBeUndefined();
    expect(fixture.runtime.sendMessage).toHaveBeenLastCalledWith({ type: "COMPANION_CONNECTION_STATE", state: "CONNECTED" });

    teardown();
    expect(lifecycle.stop).toHaveBeenCalledOnce();
    expect(fixture.runtime.onInstalled.listeners).toHaveLength(1);
    expect(fixture.runtime.onMessage.listeners).toHaveLength(1);
  });

  it("reports side-panel setup failure without rejecting the install listener", async () => {
    const fixture = chromeFixture();
    fixture.sidePanel.setPanelBehavior.mockRejectedValueOnce(new Error("fixture failure"));
    vi.stubGlobal("chrome", fixture);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await import("./service-worker.js");

    [...fixture.runtime.onInstalled.listeners][0]();
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith("companion.side_panel_setup_failed"));
  });
});
