import type { Response } from "express";

export function sendOk<T>(response: Response, data: T, status = 200) {
  return response.status(status).json({ ok: true, data });
}

export function sendError(response: Response, status: number, code: string, message: string) {
  return response.status(status).json({ ok: false, error: { code, message } });
}
