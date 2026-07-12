import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createResolveHandler } from "./resolve.handlers.js";

const servers: ReturnType<ReturnType<typeof express>["listen"]>[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map((server) => new Promise<void>((done) => server.close(() => done())))); });

describe("CaseFlow resolve HTTP", () => {
  it("resolves deterministically and audits candidates and rule versions", async () => {
    const db = {
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1", organizationId: "org-1", summary: "Nao recebi e consta entregue" }) },
      evidenceFact: { findMany: vi.fn().mockResolvedValue([{ id: "f1", key: "logistics.status", normalizedValueJson: '"DELIVERED"', sourceSystem: "CARRIER", observedAt: new Date() }]) },
      evidenceConflict: { findMany: vi.fn().mockResolvedValue([]) },
      auditLog: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const app = express(); app.use((req, _res, next) => { req.user = { id: "user-1", name: "Agent", email: "agent@example.com", role: "SAC", organizationId: "org-1", unitScopeIds: [], sectorScopeIds: [] }; next(); }); app.post("/cases/:caseId/resolve", createResolveHandler(db as never));
    const server = app.listen(0); servers.push(server); await new Promise((done) => server.once("listening", done));
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/cases/case-1/resolve`, { method: "POST" });
    expect(await response.json()).toMatchObject({ data: { primary: { flowId: "UNRECOGNIZED_DELIVERY" } } });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ organizationId: "org-1", entityType: "CaseFlowCandidate", metadataJson: expect.stringContaining("DELIVERY_DENIED@1") }) });
  });
});
