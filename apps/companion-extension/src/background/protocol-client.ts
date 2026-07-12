import type { ConnectionState } from "./connection-state.js";
import { reconnectDelay } from "./connection-state.js";

export interface ProtocolClientOptions {
  url?: string;
  createSocket?: (url: string) => WebSocket;
  onState(state: ConnectionState): void;
}

export class CompanionProtocolClient {
  #socket?: WebSocket;
  #timer?: ReturnType<typeof setTimeout>;
  #attempt = 0;
  #stopped = true;
  #token?: string;
  readonly #options: ProtocolClientOptions;

  constructor(options: ProtocolClientOptions) {
    const url = options.url ?? "ws://127.0.0.1:38472";
    const parsed = new URL(url);
    if (parsed.protocol !== "ws:" || parsed.hostname !== "127.0.0.1") throw new Error("Companion URL must use ws://127.0.0.1");
    this.#options = { ...options, url };
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
    socket.addEventListener("open", () => {
      this.#attempt = 0;
      socket.send(JSON.stringify({ type: "COMPANION_HELLO", token: this.#token, protocolVersion: "1" }));
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as { type?: string; code?: string };
      if (message.type === "COMPANION_PAIRED") this.#options.onState("CONNECTED");
      else if (message.code === "ORIGIN_REJECTED") this.#options.onState("ORIGIN_REJECTED");
      else if (message.code === "VERSION_MISMATCH") this.#options.onState("VERSION_MISMATCH");
    });
    socket.addEventListener("close", () => {
      if (this.#stopped) return;
      this.#options.onState("HOST_UNAVAILABLE");
      this.#timer = setTimeout(() => this.#connect("RECONNECTING"), reconnectDelay(this.#attempt++));
    });
  }
}
