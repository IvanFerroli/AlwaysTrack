import express, { type RequestHandler } from "express";
import type { AddressInfo } from "node:net";
import type { CurrentUser } from "@alwaystrack/shared";
import { sendError } from "../core/http/responses.js";

export const adminUser: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  avatarUrl: null,
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

interface HandlerRequestOptions {
  handler: RequestHandler;
  middleware?: RequestHandler[];
  method?: "delete" | "get" | "patch" | "post";
  path?: string;
  route?: string;
  body?: unknown;
  headers?: Record<string, string>;
  user?: CurrentUser | null;
}

export async function requestHandler({
  handler,
  middleware = [],
  method = "get",
  path = "/resource",
  route = "/resource",
  body,
  headers = {},
  user = adminUser
}: HandlerRequestOptions) {
  const app = express();
  app.use(express.json());
  app.use((request, _response, next) => {
    if (user) request.user = user;
    next();
  });
  app[method](route, ...middleware, handler);
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) =>
    sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.")
  );

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const port = (server.address() as AddressInfo).port;
    return await fetch(`http://127.0.0.1:${port}${path}`, {
      method: method.toUpperCase(),
      redirect: "manual",
      headers: body === undefined ? headers : { "content-type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

export async function jsonEnvelope(response: globalThis.Response) {
  return response.json() as Promise<{
    ok: boolean;
    data?: unknown;
    error?: { code: string; message: string };
  }>;
}
