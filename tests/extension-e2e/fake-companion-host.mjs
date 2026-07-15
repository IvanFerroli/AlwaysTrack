import ws from "ws";

const { Server: WebSocketServer } = ws;

const now = () => new Date().toISOString();

export class FakeCompanionHost {
  #connections = new Set();
  #helloEvents = [];
  #sequence = 0;
  #server;

  constructor(port = 38472) {
    this.port = port;
  }

  async start() {
    this.#server = new WebSocketServer({ host: "127.0.0.1", port: this.port });
    this.#server.on("connection", (socket) => {
      this.#connections.add(socket);
      socket.on("close", () => this.#connections.delete(socket));
      socket.on("message", (payload) => this.#handleMessage(socket, payload));
    });
    await new Promise((resolve, reject) => {
      this.#server.once("listening", resolve);
      this.#server.once("error", reject);
    });
  }

  get helloEvents() {
    return this.#helloEvents.map((event) => ({
      extensionInstanceId: event.extensionInstanceId,
      protocolVersion: event.protocolVersion,
      supportedProtocolVersions: event.payload.supportedProtocolVersions,
      tokenClass: event.payload.token.startsWith("reconnect-") ? "reconnect" : "pairing"
    }));
  }

  dropConnections() {
    for (const socket of this.#connections) socket.close(1012, "HOST_RESTART");
  }

  async stop() {
    for (const socket of this.#connections) socket.terminate();
    this.#connections.clear();
    if (!this.#server) return;
    await new Promise((resolve) => this.#server.close(resolve));
  }

  #handleMessage(socket, payload) {
    let event;
    try {
      event = JSON.parse(String(payload));
    } catch {
      socket.close(1008, "INVALID_MESSAGE");
      return;
    }
    if (event?.type !== "COMPANION_HELLO" || typeof event?.payload?.token !== "string") {
      socket.close(1008, "INVALID_MESSAGE");
      return;
    }

    this.#helloEvents.push(event);
    if (event.payload.token === "origin-rejected") {
      socket.close(1008, "ORIGIN_REJECTED");
      return;
    }

    this.#sequence += 1;
    socket.send(JSON.stringify({
      type: "COMPANION_PAIRED",
      protocolVersion: "1",
      messageId: `paired-${this.#sequence}`,
      timestamp: now(),
      installationId: "fake-installation",
      browserProfileId: "fake-browser-profile",
      userId: "fake-user",
      payload: {
        sessionId: `fake-session-${this.#sequence}`,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        reconnectToken: `reconnect-${this.#sequence}`
      }
    }));
  }
}
