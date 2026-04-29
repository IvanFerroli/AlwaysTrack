import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

export interface RequestContext {
  requestId: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export function attachRequestContext(request: Request, response: Response, next: NextFunction) {
  const requestId = request.header("x-request-id") ?? randomUUID();
  request.context = { requestId };
  response.setHeader("x-request-id", requestId);
  next();
}
