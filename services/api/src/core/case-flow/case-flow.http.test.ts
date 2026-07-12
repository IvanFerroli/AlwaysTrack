import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { createCaseFlowHandlers } from "./case-flow.handlers.js";

const user = { id: "user-1", name: "Agent", email: "agent@example.com", role: "SAC" as const, organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] };
const servers: ReturnType<ReturnType<typeof express>["listen"]>[] = [];
async function request(handler: express.RequestHandler, path = "/cases/case-1", route = "/cases/:caseId") {
  const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = user; next(); }); app.get(route, handler);
  const server = app.listen(0); servers.push(server); await new Promise((done) => server.once("listening", done));
  return fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`);
}
afterEach(async () => { await Promise.all(servers.splice(0).map((server) => new Promise<void>((done) => server.close(() => done())))); });

describe("CaseFlow HTTP API", () => {
  it("scopes case lookup to the authenticated tenant", async () => {
    const db = { serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1", organizationId: "org-1", sources: [] }) } };
    const response = await request(createCaseFlowHandlers(db as never).get);
    expect(response.status).toBe(200);
    expect(db.serviceCase.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "case-1", organizationId: "org-1" } }));
  });

  it("returns 404 instead of exposing a case from another tenant", async () => {
    const db = { serviceCase: { findFirst: vi.fn().mockResolvedValue(null) } };
    const response = await request(createCaseFlowHandlers(db as never).get);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("redacts sensitive evidence values", async () => {
    const db = {
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1", sources: [] }) },
      evidenceFact: { findMany: vi.fn().mockResolvedValue([{ id: "fact-1", valueJson: '"12345678900"', normalizedValueJson: '"12345678900"', sensitivity: "PII" }]) }
    };
    const response = await request(createCaseFlowHandlers(db as never).facts, "/cases/case-1/facts", "/cases/:caseId/facts");
    expect(await response.json()).toMatchObject({ data: [{ value: "[redacted]", normalizedValue: "[redacted]" }] });
  });
});
