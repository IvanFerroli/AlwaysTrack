import type { NextFunction, Request, Response } from "express";
import type { ApiEnv } from "../../config/env.js";
import { logEvent } from "../diagnostics/logger.js";
import { sendError } from "./responses.js";

interface RateLimitOptions {
  name: string;
  windowMs: number;
  max: number;
  keyBy?: "ip" | "user-or-ip";
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

function clientKey(request: Request, keyBy: RateLimitOptions["keyBy"]) {
  if (keyBy === "user-or-ip" && request.user?.id) {
    return `user:${request.user.id}`;
  }
  return `ip:${request.ip || request.socket.remoteAddress || "unknown"}`;
}

export function resetRateLimitBuckets() {
  buckets.clear();
}

export function createRateLimiter(options: RateLimitOptions) {
  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${options.name}:${clientKey(request, options.keyBy ?? "ip")}`;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(options.max - bucket.count, 0);
    response.setHeader("ratelimit-limit", String(options.max));
    response.setHeader("ratelimit-remaining", String(remaining));
    response.setHeader("ratelimit-reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count <= options.max) {
      return next();
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    response.setHeader("retry-after", String(retryAfterSeconds));
    logEvent("warn", "http.rate_limit_exceeded", {
      policy: options.name,
      method: request.method,
      path: request.path,
      userId: request.user?.id,
      ip: request.ip,
      retryAfterSeconds
    });
    return sendError(response, 429, "TOO_MANY_REQUESTS", "Too many requests. Try again later.");
  };
}

export function createApiRateLimiters(env: ApiEnv) {
  const windowMs = env.rateLimitWindowMs ?? 60 * 1000;
  return {
    login: createRateLimiter({ name: "login", windowMs, max: env.rateLimitLoginMax ?? 10, keyBy: "ip" }),
    upload: createRateLimiter({ name: "upload", windowMs, max: env.rateLimitUploadMax ?? 20, keyBy: "user-or-ip" }),
    ai: createRateLimiter({ name: "ai", windowMs, max: env.rateLimitAiMax ?? 10, keyBy: "user-or-ip" }),
    search: createRateLimiter({ name: "search", windowMs, max: env.rateLimitSearchMax ?? 120, keyBy: "user-or-ip" }),
    interaction: createRateLimiter({ name: "interaction", windowMs, max: env.rateLimitInteractionMax ?? 60, keyBy: "user-or-ip" }),
    adminSensitive: createRateLimiter({ name: "admin-sensitive", windowMs, max: env.rateLimitAdminMax ?? 90, keyBy: "user-or-ip" })
  };
}
