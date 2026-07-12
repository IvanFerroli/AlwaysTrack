import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import WebSocket from "ws";
import { loadCompanionHostConfig } from "../config.js";
import { InMemoryPairingAuthority } from "../security/index.js";
import { closeCompanionServer, startCompanionServer, type RunningCompanionServer } from "./health-server.js";

const origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";
let running: RunningCompanionServer | undefined;

afterEach(async () => {
  if (running) await closeCompanionServer(running);
  running = undefined;
});

function config(overrides: NodeJS.ProcessEnv = {}) {
  return loadCompanionHostConfig({
    COMPANION_HOST_PORT: "0",
    COMPANION_HOST_ALLOWED_ORIGIN: origin,
    ...overrides
  });
}

function wsUrl(query = ""): string {
  const address = running!.server.address() as AddressInfo;
  return `ws://127.0.0.1:${address.port}/companion${query}`;
}

function connect(token: string, requestOrigin = origin): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const websocket = new WebSocket(wsUrl(), { origin: requestOrigin });
    websocket.once("open", () => {
      websocket.send(JSON.stringify({ type: "COMPANION_HELLO", token, protocolVersion: "1" }));
      resolve(websocket);
    });
    websocket.once("error", reject);
  });
}

function nextJson(websocket: WebSocket): Promise<Record<string, any>> {
  return new Promise((resolve) => websocket.once("message", (data) => resolve(JSON.parse(data.toString()))));
}

function closed(websocket: WebSocket): Promise<{ code: number; reason: string }> {
  return new Promise((resolve) => websocket.once("close", (code, reason) => resolve({ code, reason: reason.toString() })));
}

function message(messageId: string = crypto.randomUUID(), type = "BROWSER_READY", protocolVersion = "1") {
  return { type, protocolVersion, messageId, timestamp: new Date().toISOString(), payload: {} };
}

describe("Companion WebSocket gateway", () => {
  it("pairs on the loopback HTTP server and rotates the consumed token", async () => {
    const authority = new InMemoryPairingAuthority(60_000);
    const initial = authority.issue({ installationId: "install-1", browserProfileId: "profile-1", userId: "user-1" });
    running = await startCompanionServer(config(), { pairingAuthority: authority });

    const first = await connect(initial.token);
    const paired = await nextJson(first);
    expect(paired).toMatchObject({ type: "COMPANION_PAIRED", protocolVersion: "1", installationId: "install-1" });
    expect(paired.payload.reconnectToken).not.toBe(initial.token);
    first.close();

    const reused = await connect(initial.token);
    expect(await closed(reused)).toEqual({ code: 1008, reason: "PAIRING_REJECTED" });
    const reconnected = await connect(paired.payload.reconnectToken);
    expect((await nextJson(reconnected)).payload.reconnectToken).not.toBe(paired.payload.reconnectToken);
    reconnected.close();
  });

  it("pairs through COMPANION_HELLO and rejects reuse of its token", async () => {
    const authority = new InMemoryPairingAuthority(60_000);
    const grant = authority.issue();
    running = await startCompanionServer(config(), { pairingAuthority: authority });
    const websocket = await connect(grant.token);
    expect(await nextJson(websocket)).toMatchObject({ type: "COMPANION_PAIRED" });
    websocket.close();

    const replay = await connect(grant.token);
    const close = closed(replay);
    expect(await close).toEqual({ code: 1008, reason: "PAIRING_REJECTED" });
  });

  it("requires the exact configured Origin on pairing and upgrade", async () => {
    const authority = new InMemoryPairingAuthority(60_000);
    running = await startCompanionServer(config(), { pairingAuthority: authority });
    const address = running.server.address() as AddressInfo;

    const forbidden = await fetch(`http://127.0.0.1:${address.port}/pairing`, { method: "POST", headers: { origin: `${origin}/` } });
    expect(forbidden.status).toBe(403);
    const issued = await fetch(`http://127.0.0.1:${address.port}/pairing`, { method: "POST", headers: { origin } });
    expect(issued.status).toBe(201);
    const grant = await issued.json() as { token: string };
    await expect(connect(grant.token, "chrome-extension://different")).rejects.toThrow("Unexpected server response: 403");
  });

  it("does not authenticate from a query token and times out without HELLO", async () => {
    const authority = new InMemoryPairingAuthority(60_000);
    const grant = authority.issue();
    running = await startCompanionServer(config({ COMPANION_HOST_PREAUTH_TIMEOUT_MS: "20" }), { pairingAuthority: authority });
    const websocket = new WebSocket(wsUrl(`?token=${encodeURIComponent(grant.token)}`), { origin });
    await new Promise<void>((resolve, reject) => {
      websocket.once("open", resolve);
      websocket.once("error", reject);
    });
    expect(await closed(websocket)).toEqual({ code: 1008, reason: "PAIRING_TIMEOUT" });
    expect(authority.consume(grant.token)).toBeDefined();
  });

  it.each([
    ["wrong direction", message("direction", "START_CASE"), 1008, "INVALID_DIRECTION"],
    ["unsupported version", message("version", "BROWSER_READY", "2"), 1002, "UNSUPPORTED_VERSION"],
    ["malformed JSON", "{", 1008, "INVALID_MESSAGE"]
  ])("closes on %s", async (_name, payload, code, reason) => {
    const authority = new InMemoryPairingAuthority(60_000);
    const grant = authority.issue();
    running = await startCompanionServer(config(), { pairingAuthority: authority });
    const websocket = await connect(grant.token);
    await nextJson(websocket);
    const close = closed(websocket);
    websocket.send(typeof payload === "string" ? payload : JSON.stringify(payload));
    expect(await close).toEqual({ code, reason });
  });

  it("rejects replayed messageIds across reconnections", async () => {
    const authority = new InMemoryPairingAuthority(60_000);
    const grant = authority.issue();
    const onMessage = vi.fn();
    running = await startCompanionServer(config(), { pairingAuthority: authority, onMessage });
    const first = await connect(grant.token);
    const paired = await nextJson(first);
    first.send(JSON.stringify(message("same-id")));
    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1));
    first.close();

    const second = await connect(paired.payload.reconnectToken);
    await nextJson(second);
    const close = closed(second);
    second.send(JSON.stringify(message("same-id")));
    expect(await close).toEqual({ code: 1008, reason: "REPLAYED_MESSAGE" });
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it("enforces connection rate and maximum payload", async () => {
    const authority = new InMemoryPairingAuthority(60_000);
    running = await startCompanionServer(config({ COMPANION_HOST_RATE_LIMIT: "1", COMPANION_HOST_MAX_PAYLOAD_BYTES: "128" }), { pairingAuthority: authority });
    const first = await connect(authority.issue().token);
    await nextJson(first);
    await expect(connect(authority.issue().token)).rejects.toThrow("Unexpected server response: 429");
    const close = closed(first);
    first.send(JSON.stringify({ ...message(), padding: "x".repeat(256) }));
    expect((await close).code).toBe(1009);
  });

  it("closes active clients and releases the HTTP port on shutdown", async () => {
    const authority = new InMemoryPairingAuthority(60_000);
    running = await startCompanionServer(config(), { pairingAuthority: authority });
    const address = running.server.address() as AddressInfo;
    const websocket = await connect(authority.issue().token);
    await nextJson(websocket);
    const close = closed(websocket);
    const shutdown = closeCompanionServer(running);
    expect(await close).toEqual({ code: 1001, reason: "HOST_SHUTDOWN" });
    await shutdown;
    running = undefined;
    await expect(fetch(`http://127.0.0.1:${address.port}/health`)).rejects.toThrow();
  });
});
