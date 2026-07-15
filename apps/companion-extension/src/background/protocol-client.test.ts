import { companionHelloSchema, companionProtocolVersion } from "@alwaystrack/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConnectionState } from "./connection-state.js";
import { CompanionProtocolClient } from "./protocol-client.js";

class FakeSocket extends EventTarget {
  readonly sent: string[] = [];
  closeImmediately = true;
  closeCode?: number;
  closeReason?: string;

  send(data: string): void { this.sent.push(data); }
  open(): void { this.dispatchEvent(new Event("open")); }
  receive(data: unknown): void {
    const event = new Event("message");
    Object.defineProperty(event, "data", { value: JSON.stringify(data) });
    this.dispatchEvent(event);
  }
  close(code = 1000, reason = ""): void {
    this.closeCode = code;
    this.closeReason = reason;
    if (this.closeImmediately) this.emitClose(reason);
  }
  emitClose(reason = ""): void {
    const event = new Event("close");
    Object.defineProperty(event, "reason", { value: reason });
    this.dispatchEvent(event);
  }
  disconnect(): void { this.emitClose(); }
}

const paired = (reconnectToken: string) => ({
  type: "COMPANION_PAIRED",
  protocolVersion: companionProtocolVersion,
  messageId: "paired-message",
  timestamp: "2026-07-15T12:00:00.000Z",
  installationId: "installation-1",
  browserProfileId: "profile-1",
  userId: "user-1",
  payload: { sessionId: "session-1", expiresAt: "2026-07-15T12:01:00.000Z", reconnectToken }
});

afterEach(() => vi.useRealTimers());

describe("CompanionProtocolClient", () => {
  it("sends the shared HELLO contract and reconnects once with the rotated token", () => {
    vi.useFakeTimers();
    const sockets: FakeSocket[] = [];
    const states: ConnectionState[] = [];
    const client = new CompanionProtocolClient({
      extensionInstanceId: "extension-1",
      createMessageId: () => "hello-message",
      now: () => new Date("2026-07-15T12:00:00.000Z"),
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      onState: (state) => states.push(state)
    });

    client.pair("initial-token");
    sockets[0].open();
    const firstHello = JSON.parse(sockets[0].sent[0]) as Record<string, any>;
    expect(companionHelloSchema.safeParse(firstHello).success).toBe(true);
    expect(firstHello.payload.token).toBe("initial-token");
    sockets[0].receive(paired("rotated-token"));
    expect(states.at(-1)).toBe("CONNECTED");

    sockets[0].disconnect();
    vi.runOnlyPendingTimers();
    sockets[1].open();
    const reconnectHello = JSON.parse(sockets[1].sent[0]) as Record<string, any>;
    expect(reconnectHello.payload.token).toBe("rotated-token");
    expect(reconnectHello.extensionInstanceId).toBe("extension-1");
    client.stop();
  });

  it("fails closed when PAIRED is incomplete", () => {
    const socket = new FakeSocket();
    const states: ConnectionState[] = [];
    const client = new CompanionProtocolClient({
      extensionInstanceId: "extension-1",
      createSocket: () => socket as unknown as WebSocket,
      onState: (state) => states.push(state)
    });

    client.pair("initial-token");
    socket.open();
    socket.receive({ ...paired("rotated-token"), payload: { sessionId: "session-1" } });
    expect({ code: socket.closeCode, reason: socket.closeReason }).toEqual({ code: 1008, reason: "INVALID_MESSAGE" });
    expect(states.at(-1)).toBe("PAIRING_REQUIRED");
  });

  it("keeps an authenticated connection open for operational messages", () => {
    const socket = new FakeSocket();
    const client = new CompanionProtocolClient({
      extensionInstanceId: "extension-1",
      createSocket: () => socket as unknown as WebSocket,
      onState: () => undefined
    });

    client.pair("initial-token");
    socket.open();
    socket.receive(paired("rotated-token"));
    socket.receive({ type: "START_CASE" });
    expect(socket.closeCode).toBeUndefined();
    client.stop();
  });

  it("ignores a delayed close from a replaced socket", () => {
    vi.useFakeTimers();
    const sockets: FakeSocket[] = [];
    const client = new CompanionProtocolClient({
      extensionInstanceId: "extension-1",
      createSocket: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      onState: () => undefined
    });

    client.pair("initial-token");
    sockets[0].closeImmediately = false;
    client.pair("replacement-token");
    sockets[0].emitClose();
    vi.runOnlyPendingTimers();

    expect(sockets).toHaveLength(2);
    client.stop();
  });
});
