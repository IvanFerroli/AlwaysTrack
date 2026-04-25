import type { ApiResult } from "@olympus/shared-types";
import type { ServerResponse } from "node:http";

function inferErrorStatus(code: string): number {
  if (code.includes("NOT_FOUND")) {
    return 404;
  }
  if (code.includes("INVALID") || code.includes("REQUEST")) {
    return 400;
  }
  return 500;
}

export function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  const allowedOrigin = process.env["WEB_ORIGIN"] ?? "http://localhost:3000";

  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  response.end(JSON.stringify(body));
}

export function sendApiResult<T>(response: ServerResponse, result: ApiResult<T>): void {
  const statusCode = result.ok ? 200 : inferErrorStatus(result.error.code);
  sendJson(response, statusCode, result);
}
