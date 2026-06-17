import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadEnv } from "../../config/env.js";
import { createCorsMiddleware, createOriginGuard, securityHeadersMiddleware } from "./security.js";

function mockResponse() {
  const headers = new Map<string, string | number | readonly string[]>();
  const response = {
    setHeader: vi.fn((name: string, value: string | number | readonly string[]) => headers.set(name.toLowerCase(), value)),
    header: vi.fn((name: string, value: string | number | readonly string[] | undefined) => {
      if (value !== undefined) headers.set(name.toLowerCase(), value);
      return response;
    }),
    status: vi.fn(() => response),
    json: vi.fn(() => response),
    sendStatus: vi.fn(() => response)
  } as unknown as Response;
  return { response, headers };
}

function mockRequest(input: { method?: string; path?: string; origin?: string; referer?: string }) {
  return {
    method: input.method ?? "GET",
    path: input.path ?? "/health",
    header: vi.fn((name: string) => {
      if (name.toLowerCase() === "origin") return input.origin;
      if (name.toLowerCase() === "referer") return input.referer;
      return undefined;
    })
  } as unknown as Request;
}

describe("http security perimeter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("adds browser security headers to every response", () => {
    const { response, headers } = mockResponse();
    const next = vi.fn();

    securityHeadersMiddleware(mockRequest({}), response, next);

    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("referrer-policy")).toBe("no-referrer");
    expect(String(headers.get("content-security-policy"))).toContain("frame-ancestors 'none'");
    expect(next).toHaveBeenCalledOnce();
  });

  it("allows CORS preflight only for configured origins", () => {
    const env = loadEnv({ CORS_ORIGIN: "https://app.example.com" });
    const { response, headers } = mockResponse();

    createCorsMiddleware(env)(mockRequest({ method: "OPTIONS", origin: "https://app.example.com" }), response, vi.fn());

    expect(response.sendStatus).toHaveBeenCalledWith(204);
    expect(headers.get("access-control-allow-origin")).toBe("https://app.example.com");
    expect(headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("rejects CORS preflight from unexpected origins", () => {
    const env = loadEnv({ CORS_ORIGIN: "https://app.example.com" });
    const { response } = mockResponse();

    createCorsMiddleware(env)(mockRequest({ method: "OPTIONS", origin: "https://evil.example" }), response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("blocks production mutations without a trusted origin or referer", () => {
    vi.stubEnv("NODE_ENV", "production");
    const env = loadEnv({ CORS_ORIGIN: "https://app.example.com" });
    const { response } = mockResponse();

    createOriginGuard(env)(mockRequest({ method: "POST", path: "/v1/auth/login" }), response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(403);
  });

  it("allows trusted production mutations and public webhook exceptions", () => {
    vi.stubEnv("NODE_ENV", "production");
    const env = loadEnv({ CORS_ORIGIN: "https://app.example.com" });
    const trustedNext = vi.fn();
    const publicNext = vi.fn();

    createOriginGuard(env)(
      mockRequest({ method: "PATCH", path: "/v1/wiki/pages/page-1", origin: "https://app.example.com" }),
      mockResponse().response,
      trustedNext
    );
    createOriginGuard(env)(
      mockRequest({ method: "POST", path: "/v1/webhooks/meta-whatsapp", origin: "https://evil.example" }),
      mockResponse().response,
      publicNext
    );

    expect(trustedNext).toHaveBeenCalledOnce();
    expect(publicNext).toHaveBeenCalledOnce();
  });
});
