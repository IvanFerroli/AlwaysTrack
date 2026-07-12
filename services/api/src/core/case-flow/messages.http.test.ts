import express from "express";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMessagesHandlers } from "./messages.handlers.js";

const servers: ReturnType<ReturnType<typeof express>["listen"]>[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map((server) => new Promise<void>((done) => server.close(() => done())))); });

describe("CaseFlow messages HTTP", () => {
  it("compiles and records copy without external writes or full text in audit", async () => {
    const audits: Array<{ data: { action: string; metadataJson: string } }> = [];
    const db = {
      serviceCase: { findFirst: vi.fn().mockResolvedValue({ id: "case-1", organizationId: "org-1" }) },
      auditLog: {
        findFirst: vi.fn().mockResolvedValue({ metadataJson: JSON.stringify({ primary: { flowId: "DELIVERY" }, secondary: [], riskGates: [] }) }),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(async (value) => { audits.push(value); return { id: `audit-${audits.length}` }; })
      },
      serviceFlow: { findMany: vi.fn().mockResolvedValue([{ id: "flow-1", slug: "delivery" }]) },
      serviceFlowVersion: { findFirst: vi.fn().mockResolvedValue({
        id: "version-1", flowId: "flow-1", version: 1,
        nodes: [{ id: "node-db-1", key: "reply", type: "MESSAGE", title: "Reply", operatorInstruction: null, requiredFactsJson: '["order.id"]', optionalFactsJson: "[]", scriptsJson: '[{"scriptId":"script-1"}]', allowedCapabilitiesJson: "[]", forbiddenCapabilitiesJson: "[]", autoAdvance: false, riskLevel: "LOW", terminal: false, message: null, dependenciesJson: "[]" }],
        transitions: []
      }) },
      operationalScript: { findMany: vi.fn().mockResolvedValue([{ id: "script-1", channel: "WHATSAPP" }]) },
      operationalScriptRevision: { findFirst: vi.fn().mockResolvedValue({ id: "script-revision-1", version: 1, channel: "WHATSAPP", body: "Pedido {order.id}", placeholdersJson: '["order.id"]' }) },
      evidenceFact: { findMany: vi.fn().mockResolvedValue([{ key: "order.id", normalizedValueJson: '"AT-42"' }]) }
    };
    const handlers = createMessagesHandlers(db as never);
    const app = express(); app.use(express.json()); app.use((request, _response, next) => { request.user = { id: "user-1", organizationId: "org-1" } as never; next(); });
    app.get("/cases/:caseId/messages", handlers.list); app.post("/cases/:caseId/messages/:messageId/copy", handlers.copy);
    const server = app.listen(0); servers.push(server); await new Promise((done) => server.once("listening", done));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const listed = await (await fetch(`${base}/cases/case-1/messages`)).json() as { data: Array<{ id: string; text: string }> };
    expect(listed.data[0]).toMatchObject({ text: "Pedido AT-42" });
    const copied = await fetch(`${base}/cases/case-1/messages/${listed.data[0].id}/copy`, { method: "POST" });
    expect(copied.status).toBe(201);
    const copyAudit = audits.find((item) => item.data.action === "case_flow.message.copied")!;
    expect(copyAudit.data.metadataJson).not.toContain("Pedido AT-42");
    expect(JSON.parse(copyAudit.data.metadataJson)).toMatchObject({ externalWrite: false, caseId: "case-1" });
  });
});
