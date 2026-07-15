import {
  companionHelloSchema,
  companionPairedSchema,
  companionProtocolErrorSchema,
  companionProtocolVersion,
  parseCompanionJson,
  type CompanionHelloEvent,
  type CompanionProtocolErrorCode
} from "@alwaystrack/shared";
import type { ConnectionState } from "./connection-state.js";
import { reconnectDelay } from "./connection-state.js";

export interface ProtocolClientOptions {
  url?: string;
  createSocket?: (url: string) => WebSocket;
  extensionInstanceId?: string;
  createMessageId?: () => string;
  now?: () => Date;
  onState(state: ConnectionState): void;
}

export class CompanionProtocolClient {
  #socket?: WebSocket;
  #timer?: ReturnType<typeof setTimeout>;
  #attempt = 0;
  #stopped = true;
  #token?: string;
  readonly #extensionInstanceId: string;
  readonly #options: ProtocolClientOptions;

  constructor(options: ProtocolClientOptions) {
    const url = options.url ?? "ws://127.0.0.1:38472";
    const parsed = new URL(url);
    if (parsed.protocol !== "ws:" || parsed.hostname !== "127.0.0.1") throw new Error("Companion URL must use ws://127.0.0.1");
    this.#options = { ...options, url };
    this.#extensionInstanceId = options.extensionInstanceId ?? crypto.randomUUID();
  }

  pair(token: string) { this.#token = token; this.start(); }
  start() {
    this.stop();
    this.#stopped = false;
    if (!this.#token) { this.#options.onState("PAIRING_REQUIRED"); return; }
    this.#connect("CONNECTING");
  }
  stop() {
    this.#stopped = true;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#socket?.close();
    this.#socket = undefined;
    this.#options.onState("DISCONNECTED");
  }
  #connect(state: ConnectionState) {
    this.#options.onState(state);
    const socket = (this.#options.createSocket ?? ((url) => new WebSocket(url)))(this.#options.url!);
    this.#socket = socket;
    let pairedConnection = false;
    socket.addEventListener("open", () => {
      if (this.#stopped || socket !== this.#socket || !this.#token) return;
      this.#attempt = 0;
      const hello: CompanionHelloEvent = {
        type: "COMPANION_HELLO",
        protocolVersion: companionProtocolVersion,
        messageId: (this.#options.createMessageId ?? (() => crypto.randomUUID()))(),
        timestamp: (this.#options.now ?? (() => new Date()))().toISOString(),
        extensionInstanceId: this.#extensionInstanceId,
        payload: { token: this.#token, supportedProtocolVersions: [companionProtocolVersion] }
      };
      if (!companionHelloSchema.safeParse(hello).success) throw new Error("Invalid COMPANION_HELLO contract");
      socket.send(JSON.stringify(hello));
    });
    socket.addEventListener("message", (event) => {
      const message = parseCompanionJson(event.data);
      const paired = companionPairedSchema.safeParse(message);
      if (paired.success) {
        if (paired.data.protocolVersion !== companionProtocolVersion || paired.data.payload.reconnectToken === this.#token) {
          this.#closeTerminal(socket, "PAIRING_REQUIRED", "INVALID_MESSAGE");
          return;
        }
        this.#token = paired.data.payload.reconnectToken;
        pairedConnection = true;
        this.#options.onState("CONNECTED");
        return;
      }
      const error = companionProtocolErrorSchema.safeParse(message);
      if (error.success && error.data.protocolVersion === companionProtocolVersion) {
        this.#closeTerminal(socket, this.#terminalState(error.data.payload.code) ?? "PAIRING_REQUIRED", error.data.payload.code);
        return;
      }
      if (!pairedConnection) this.#closeTerminal(socket, "PAIRING_REQUIRED", "INVALID_MESSAGE");
    });
    socket.addEventListener("close", (event) => {
      if (this.#stopped || socket !== this.#socket) return;
      const terminalState = this.#terminalState((event as CloseEvent).reason);
      if (terminalState) {
        this.#token = undefined;
        this.#options.onState(terminalState);
        return;
      }
      this.#options.onState("HOST_UNAVAILABLE");
      this.#timer = setTimeout(() => this.#connect("RECONNECTING"), reconnectDelay(this.#attempt++));
    });
  }

  #closeTerminal(socket: WebSocket, state: ConnectionState, reason: string): void {
    this.#stopped = true;
    this.#token = undefined;
    socket.close(1008, reason);
    this.#options.onState(state);
  }

  #terminalState(reason: string): ConnectionState | undefined {
    if (reason === "ORIGIN_REJECTED") return "ORIGIN_REJECTED";
    if (reason === "UNSUPPORTED_VERSION" || reason === "VERSION_MISMATCH") return "VERSION_MISMATCH";
    if (["INVALID_MESSAGE", "PAIRING_REJECTED", "PAIRING_REQUIRED"].includes(reason as CompanionProtocolErrorCode)) return "PAIRING_REQUIRED";
    return undefined;
  }
}
