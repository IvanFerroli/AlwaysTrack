import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPlanHandler } from "./plan.handlers.js";

const servers: ReturnType<ReturnType<typeof express>["listen"]>[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map((server) => new Promise<void>((done) => server.close(() => done())))); });

describe("CaseFlow plan HTTP", () => {
  it("scopes case lookup to the authenticated tenant", async () => {
    const db = { serviceCase: { findFirst: vi.fn().mockResolvedValue(null) } };
    const app = express();
    app.use((request, _response, next) => { request.user = { id: "user-1", organizationId: "org-1" } as never; next(); });
    app.get("/cases/:caseId/plan", createPlanHandler(db as never));
    const server = app.listen(0); servers.push(server); await new Promise((done) => server.once("listening", done));
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/cases/foreign/plan`);
    expect(response.status).toBe(404);
    expect(db.serviceCase.findFirst).toHaveBeenCalledWith({ where: { id: "foreign", organizationId: "org-1" } });
  });
});
