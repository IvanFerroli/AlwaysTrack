import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter, resetRateLimitBuckets } from "./rate-limit.js";

function mockResponse() {
  const headers = new Map<string, string | number | readonly string[]>();
  const response = {
    setHeader: vi.fn((name: string, value: string | number | readonly string[]) => headers.set(name.toLowerCase(), value)),
    status: vi.fn(() => response),
    json: vi.fn(() => response)
  } as unknown as Response;
  return { response, headers };
}

function mockRequest(ip = "203.0.113.10") {
  return {
    method: "POST",
    path: "/v1/auth/login",
    ip,
    socket: { remoteAddress: ip }
  } as unknown as Request;
}

describe("rate limiter", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("returns 429 and retry-after when a policy is exceeded", () => {
    const limiter = createRateLimiter({ name: "test-login", windowMs: 60_000, max: 2 });
    const firstNext = vi.fn();
    const secondNext = vi.fn();
    const thirdNext = vi.fn();

    limiter(mockRequest(), mockResponse().response, firstNext);
    limiter(mockRequest(), mockResponse().response, secondNext);
    const { response, headers } = mockResponse();
    limiter(mockRequest(), response, thirdNext);

    expect(firstNext).toHaveBeenCalledOnce();
    expect(secondNext).toHaveBeenCalledOnce();
    expect(thirdNext).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(429);
    expect(headers.get("retry-after")).toBe("60");
    expect(headers.get("ratelimit-limit")).toBe("2");
    expect(headers.get("ratelimit-remaining")).toBe("0");
  });

  it("uses authenticated user identity when configured", () => {
    const limiter = createRateLimiter({ name: "test-user", windowMs: 60_000, max: 1, keyBy: "user-or-ip" });
    const userRequest = { ...mockRequest(), user: { id: "user-1" } } as unknown as Request;
    const sameIpOtherUser = { ...mockRequest(), user: { id: "user-2" } } as unknown as Request;
    const otherUserNext = vi.fn();

    limiter(userRequest, mockResponse().response, vi.fn());
    limiter(sameIpOtherUser, mockResponse().response, otherUserNext);

    expect(otherUserNext).toHaveBeenCalledOnce();
  });
});
