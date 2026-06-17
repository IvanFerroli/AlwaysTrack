import { serialize } from "cookie";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, sessionCookieName } from "./session.js";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn()
}));

vi.mock("../db/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique
    }
  }
}));

vi.mock("../../config/env.js", () => ({
  loadEnv: () => ({
    sessionSecret: "secret",
    sessionCookieName,
    prismaSlowQueryMs: 200
  })
}));

const baseUser = {
  id: "user-1",
  name: "Admin",
  email: "admin@example.com",
  avatarUrl: null,
  role: "ADMIN",
  active: true,
  organizationId: "org-1",
  unitScopeJson: null,
  sectorScopeJson: null
};

function mockResponse() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  return response as unknown as Response & typeof response;
}

function mockRequest(token: string) {
  return {
    header: vi.fn((name: string) => (name.toLowerCase() === "cookie" ? serialize(sessionCookieName, token) : undefined))
  } as unknown as Request;
}

describe("auth middleware", () => {
  beforeEach(() => {
    mocks.userFindUnique.mockReset();
  });

  it("rejects sessions issued before the user's last password change", async () => {
    const issuedAt = Date.now();
    mocks.userFindUnique.mockResolvedValue({
      ...baseUser,
      passwordChangedAt: new Date(issuedAt + 1)
    });
    const request = mockRequest(
      createSessionToken(
        {
          userId: "user-1",
          organizationId: "org-1",
          role: "ADMIN",
          issuedAt
        },
        "secret"
      )
    );
    const response = mockResponse();
    const next = vi.fn() as NextFunction;
    const { requireAuth } = await import("./auth.middleware.js");

    await requireAuth(request, response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts sessions issued after the user's last password change", async () => {
    const issuedAt = Date.now();
    mocks.userFindUnique.mockResolvedValue({
      ...baseUser,
      passwordChangedAt: new Date(issuedAt - 1)
    });
    const request = mockRequest(
      createSessionToken(
        {
          userId: "user-1",
          organizationId: "org-1",
          role: "ADMIN",
          issuedAt
        },
        "secret"
      )
    );
    const response = mockResponse();
    const next = vi.fn() as NextFunction;
    const { requireAuth } = await import("./auth.middleware.js");

    await requireAuth(request, response, next);

    expect(next).toHaveBeenCalled();
    expect(response.status).not.toHaveBeenCalled();
  });
});
