import type { ApiResult } from "@olympus/shared-types";
import type { ServerResponse } from "node:http";

export function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export function sendApiResult<T>(response: ServerResponse, result: ApiResult<T>): void {
  const statusCode = result.ok ? 200 : 400;
  sendJson(response, statusCode, result);
}
