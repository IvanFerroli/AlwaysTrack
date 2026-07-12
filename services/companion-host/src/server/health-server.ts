import { createServer, type Server } from "node:http";
import type { CompanionHostConfig } from "../config.js";

const healthBody = JSON.stringify({ ok: true, service: "alwaystrack-companion-host", protocol: "health-only" });

export function createHealthServer(): Server {
  return createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/health") {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: false, error: "NOT_FOUND" }));
      return;
    }
    response.writeHead(200, { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" });
    response.end(healthBody);
  });
}

export async function startHealthServer(config: CompanionHostConfig): Promise<Server> {
  const server = createHealthServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  return server;
}

export async function closeHealthServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
