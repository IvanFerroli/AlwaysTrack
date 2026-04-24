import type { IncomingMessage, ServerResponse } from "node:http";

export interface HttpContext {
  request: IncomingMessage;
  response: ServerResponse;
}

export type HttpHandler = (context: HttpContext) => Promise<void> | void;
