import { createServer, type Server } from "node:http";
import type { CompanionHostConfig } from "../config.js";
import { attachCompanionGateway, type CompanionGateway, type CompanionGatewayOptions } from "./companion-server.js";
import { InMemoryPairingAuthority, type PairingAuthority } from "../security/index.js";

const healthBody = JSON.stringify({ ok: true, service: "alwaystrack-companion-host", protocol: "health-only" });

export function createHealthServer(pairingAuthority?: PairingAuthority, allowedOrigin?: string): Server {
  return createServer((request, response) => {
    if (request.method === "POST" && request.url === "/pairing" && pairingAuthority) {
      if (request.headers.origin !== allowedOrigin) {
        response.writeHead(403).end();
        return;
      }
      response.writeHead(201, { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(pairingAuthority.issue()));
      return;
    }
    if (request.method !== "GET" || request.url !== "/health") {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: false, error: "NOT_FOUND" }));
      return;
    }
    response.writeHead(200, { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
    response.end(healthBody);
  });
}

export interface RunningCompanionServer {
  server: Server;
  gateway: CompanionGateway;
}

export async function startCompanionServer(
  config: CompanionHostConfig,
  options: { pairingAuthority?: PairingAuthority; onMessage?: CompanionGatewayOptions["onMessage"] } = {}
): Promise<RunningCompanionServer> {
  const pairingAuthority = options.pairingAuthority ?? new InMemoryPairingAuthority(config.pairingTokenTtlMs);
  const server = createHealthServer(pairingAuthority, config.allowedOrigin);
  const gateway = attachCompanionGateway({ server, config, pairingAuthority, onMessage: options.onMessage });
  await listen(server, config);
  return { server, gateway };
}

export async function startHealthServer(config: CompanionHostConfig): Promise<Server> {
  const server = createHealthServer();
  await listen(server, config);
  return server;
}

async function listen(server: Server, config: CompanionHostConfig): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

export async function closeHealthServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

export async function closeCompanionServer(running: RunningCompanionServer): Promise<void> {
  await running.gateway.close();
  await closeHealthServer(running.server);
}
