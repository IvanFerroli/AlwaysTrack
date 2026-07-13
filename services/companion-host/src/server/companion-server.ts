import type { IncomingMessage, Server } from "node:http";
import type { Socket } from "node:net";
import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import type { CompanionHostConfig } from "../config.js";
import type { PairingAuthority, ConsumedPairingGrant } from "../security/index.js";
import { ProtocolSecurityGuard } from "../security/protocol-security.js";

const extensionEventTypes = new Set([
  "BROWSER_READY", "CASE_INTAKE", "CONNECTOR_PROGRESS", "CONNECTOR_RESULT",
  "INTERVENTION_REQUIRED", "INTERVENTION_RESOLVED", "DRAFT_INSERTED"
]);

export interface CompanionMessage {
  type: string;
  protocolVersion: string;
  messageId: string;
  timestamp: string;
  [key: string]: unknown;
}

interface HelloMessage extends Partial<CompanionMessage> {
  type: "COMPANION_HELLO";
  token?: string;
}

export interface CompanionGatewayOptions {
  server: Server;
  config: CompanionHostConfig;
  pairingAuthority: PairingAuthority;
  onMessage?: (message: CompanionMessage, identity: ConsumedPairingGrant) => void | Promise<void>;
  now?: () => number;
}

export interface CompanionGateway {
  close(): Promise<void>;
}

function rejectUpgrade(socket: Socket, status: number, message: string): void {
  socket.end(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

function parseMessage(data: RawData, isBinary: boolean): CompanionMessage | undefined {
  if (isBinary) return undefined;
  try {
    const value: unknown = JSON.parse(data.toString());
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return value as CompanionMessage;
  } catch {
    return undefined;
  }
}

export function attachCompanionGateway(options: CompanionGatewayOptions): CompanionGateway {
  const { server, config, pairingAuthority } = options;
  const now = options.now ?? Date.now;
  const websocketServer = new WebSocketServer({ noServer: true, maxPayload: config.maxPayloadBytes });
  const attempts = new Map<string, number[]>();
  const security = new ProtocolSecurityGuard({ messageTtlMs: config.sessionTokenTtlMs, maxFutureSkewMs: 30_000, messageRateLimit: config.connectionRateLimit * 10, messageRateWindowMs: config.connectionRateWindowMs }, now);
  const identities = new WeakMap<WebSocket, ConsumedPairingGrant>();
  let closing = false;

  const upgrade = (request: IncomingMessage, socket: Socket, head: Buffer) => {
    if (closing) return rejectUpgrade(socket, 503, "Service Unavailable");
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/" && url.pathname !== "/companion") return rejectUpgrade(socket, 404, "Not Found");
    if (request.headers.origin !== config.allowedOrigin) return rejectUpgrade(socket, 403, "Forbidden");
    if (security.validatePeer(request.socket.remoteAddress) !== "OK") return rejectUpgrade(socket, 403, "Forbidden");

    const address = request.socket.remoteAddress ?? "unknown";
    const cutoff = now() - config.connectionRateWindowMs;
    const recent = (attempts.get(address) ?? []).filter((time) => time > cutoff);
    if (recent.length >= config.connectionRateLimit) return rejectUpgrade(socket, 429, "Too Many Requests");
    recent.push(now());
    attempts.set(address, recent);

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  };

  server.on("upgrade", upgrade);
  websocketServer.on("connection", (websocket: WebSocket) => {
    websocket.on("error", () => {
      if (websocket.readyState === WebSocket.OPEN) websocket.close(1009, "PAYLOAD_REJECTED");
    });
    const sendPaired = (identity: ConsumedPairingGrant) => {
      const replacement = pairingAuthority.issue(identity, config.sessionTokenTtlMs);
      websocket.send(JSON.stringify({
        type: "COMPANION_PAIRED",
        protocolVersion: config.protocolVersion,
        messageId: randomUUID(),
        timestamp: new Date(now()).toISOString(),
        installationId: identity.installationId,
        browserProfileId: identity.browserProfileId,
        userId: identity.userId,
        payload: { sessionId: identity.sessionId, expiresAt: replacement.expiresAt, reconnectToken: replacement.token }
      }));
    };

    const preAuthTimeout = setTimeout(() => websocket.close(1008, "PAIRING_TIMEOUT"), config.preAuthTimeoutMs);

    websocket.on("message", (data, isBinary) => {
      const message = parseMessage(data, isBinary);
      let identity = identities.get(websocket);
      if (!identity && message?.type === "COMPANION_HELLO") {
        const hello = message as HelloMessage;
        if (hello.protocolVersion !== config.protocolVersion) {
          websocket.close(1002, "UNSUPPORTED_VERSION");
          return;
        }
        identity = pairingAuthority.consume(typeof hello.token === "string" ? hello.token : "");
        if (!identity) {
          websocket.close(1008, "PAIRING_REJECTED");
          return;
        }
        identities.set(websocket, identity);
        clearTimeout(preAuthTimeout);
        sendPaired(identity);
        return;
      }
      if (!identity) {
        websocket.close(1008, "PAIRING_REQUIRED");
        return;
      }
      if (!message || typeof message.messageId !== "string" || !message.messageId || typeof message.timestamp !== "string") {
        websocket.close(1008, "INVALID_MESSAGE");
        return;
      }
      if (message.protocolVersion !== config.protocolVersion) {
        websocket.close(1002, "UNSUPPORTED_VERSION");
        return;
      }
      if (!extensionEventTypes.has(message.type)) {
        websocket.close(1008, "INVALID_DIRECTION");
        return;
      }
      const securityResult = security.validateMessage(identity.installationId, message.messageId, message.timestamp);
      if (securityResult !== "OK") { websocket.close(1008, securityResult); return; }
      void Promise.resolve(options.onMessage?.(message, identity)).catch(() => websocket.close(1011, "HANDLER_FAILURE"));
    });
    websocket.once("close", () => clearTimeout(preAuthTimeout));
  });

  return {
    async close() {
      if (closing) return;
      closing = true;
      server.off("upgrade", upgrade);
      for (const client of websocketServer.clients) client.close(1001, "HOST_SHUTDOWN");
      await new Promise<void>((resolve) => websocketServer.close(() => resolve()));
    }
  };
}
