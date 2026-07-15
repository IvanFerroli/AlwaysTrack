import type { IncomingMessage, Server } from "node:http";
import type { Socket } from "node:net";
import { randomUUID } from "node:crypto";
import {
  companionHelloSchema,
  companionPairedSchema,
  companionProtocolErrorSchema,
  companionProtocolVersion,
  parseCompanionJson,
  type CompanionPairedEvent,
  type CompanionProtocolError,
  type CompanionProtocolErrorCode
} from "@alwaystrack/shared";
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

function parseMessage(data: RawData, isBinary: boolean): unknown {
  if (isBinary) return undefined;
  return parseCompanionJson(data.toString());
}

function isCompanionMessage(value: unknown): value is CompanionMessage {
  return typeof value === "object" && value !== null && !Array.isArray(value) && typeof (value as { type?: unknown }).type === "string";
}

export function attachCompanionGateway(options: CompanionGatewayOptions): CompanionGateway {
  const { server, config, pairingAuthority } = options;
  if (config.protocolVersion !== companionProtocolVersion) {
    throw new Error(`Unsupported Companion protocol version: ${config.protocolVersion}`);
  }
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
    const closeWithProtocolError = (code: CompanionProtocolErrorCode, closeCode: number, reason: string = code) => {
      const error: CompanionProtocolError = {
        type: "COMPANION_ERROR",
        protocolVersion: companionProtocolVersion,
        messageId: randomUUID(),
        timestamp: new Date(now()).toISOString(),
        payload: { code }
      };
      if (!companionProtocolErrorSchema.safeParse(error).success) {
        websocket.close(1011, "INVALID_HOST_MESSAGE");
        return;
      }
      websocket.send(JSON.stringify(error), () => websocket.close(closeCode, reason));
    };
    const sendPaired = (identity: ConsumedPairingGrant) => {
      const replacement = pairingAuthority.issue(identity, config.sessionTokenTtlMs);
      const paired: CompanionPairedEvent = {
        type: "COMPANION_PAIRED",
        protocolVersion: config.protocolVersion,
        messageId: randomUUID(),
        timestamp: new Date(now()).toISOString(),
        installationId: identity.installationId,
        browserProfileId: identity.browserProfileId,
        userId: identity.userId,
        payload: { sessionId: identity.sessionId, expiresAt: replacement.expiresAt, reconnectToken: replacement.token }
      };
      if (!companionPairedSchema.safeParse(paired).success) {
        websocket.close(1011, "INVALID_HOST_MESSAGE");
        return;
      }
      websocket.send(JSON.stringify(paired));
    };

    const preAuthTimeout = setTimeout(() => closeWithProtocolError("PAIRING_TIMEOUT", 1008), config.preAuthTimeoutMs);

    websocket.on("message", (data, isBinary) => {
      const candidate = parseMessage(data, isBinary);
      let identity = identities.get(websocket);
      if (!identity) {
        const hello = companionHelloSchema.safeParse(candidate);
        if (!hello.success) {
          const isVersionMismatch = isCompanionMessage(candidate)
            && candidate.type === "COMPANION_HELLO"
            && candidate.protocolVersion !== companionProtocolVersion;
          closeWithProtocolError(isVersionMismatch ? "VERSION_MISMATCH" : "INVALID_MESSAGE", isVersionMismatch ? 1002 : 1008, isVersionMismatch ? "UNSUPPORTED_VERSION" : "INVALID_MESSAGE");
          return;
        }
        if (hello.data.protocolVersion !== config.protocolVersion || !hello.data.payload.supportedProtocolVersions.includes(config.protocolVersion)) {
          websocket.close(1002, "UNSUPPORTED_VERSION");
          return;
        }
        identity = pairingAuthority.consume(hello.data.payload.token);
        if (!identity) {
          closeWithProtocolError("PAIRING_REJECTED", 1008);
          return;
        }
        identities.set(websocket, identity);
        clearTimeout(preAuthTimeout);
        sendPaired(identity);
        return;
      }
      const message = isCompanionMessage(candidate) ? candidate : undefined;
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
