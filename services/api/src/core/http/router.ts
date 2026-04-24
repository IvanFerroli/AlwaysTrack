import type { IncomingMessage, ServerResponse } from "node:http";
import type { HttpHandler } from "./types.js";

function routeKey(method: string, pathname: string): string {
  return `${method.toUpperCase()} ${pathname}`;
}

export interface Router {
  register(method: string, pathname: string, handler: HttpHandler): void;
  handle(request: IncomingMessage, response: ServerResponse): Promise<void>;
}

export function createRouter(onNotFound: HttpHandler): Router {
  const routes = new Map<string, HttpHandler>();

  return {
    register(method, pathname, handler) {
      routes.set(routeKey(method, pathname), handler);
    },
    async handle(request, response) {
      const method = request.method ?? "GET";
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      const handler = routes.get(routeKey(method, pathname)) ?? onNotFound;
      await handler({ request, response });
    }
  };
}
