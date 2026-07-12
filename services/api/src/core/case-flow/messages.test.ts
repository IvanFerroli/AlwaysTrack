import { describe, expect, it, vi } from "vitest";
import { compileMessageTemplate, recordMessageCopy } from "./messages.service.js";

const template = {
  scriptId: "script-delivery", revisionId: "revision-3", revision: 3, nodeId: "delivery:message", channel: "CUSTOMER" as const,
  body: "Ola, {customer.firstName}!\n\nPedido: {order.primaryId}.\n{conditional:logistics.trackingUrl}Rastreio: {logistics.trackingUrl}.{/conditional}\n{logistics.forecast}",
  placeholders: [
    { key: "customer.firstName", kind: "REQUIRED" as const, essential: false, fallback: "cliente" },
    { key: "order.primaryId", kind: "REQUIRED" as const, essential: true },
    { key: "logistics.trackingUrl", kind: "OPTIONAL" as const },
    { key: "logistics.forecast", kind: "REQUIRED" as const, essential: false, fallback: "A previsao sera confirmada." }
  ]
};

describe("CaseFlow deterministic message compiler", () => {
  it("removes optional blocks, applies typed fallbacks and is snapshot stable", () => {
    const message = compileMessageTemplate("case-1", 4, template, { "order.primaryId": "AT-42" });
    expect(message).toMatchInlineSnapshot(`
      {
        "caseId": "case-1",
        "channel": "CUSTOMER",
        "copyAllowed": true,
        "id": "msg_95f40577ea8395b9af46f6a5",
        "nodeId": "delivery:message",
        "pendingPlaceholders": [
          "customer.firstName",
          "logistics.forecast",
        ],
        "planRevision": 4,
        "source": {
          "revision": 3,
          "revisionId": "revision-3",
          "scriptId": "script-delivery",
        },
        "text": "Ola, cliente!

      Pedido: AT-42.

      A previsao sera confirmada.",
      }
    `);
    expect(message.text).not.toContain("undefined");
  });

  it("blocks essential missing data and audits no full message text or external write", async () => {
    const message = compileMessageTemplate("case-2", 1, template, {});
    expect(message.copyAllowed).toBe(false);
    await expect(recordMessageCopy({ auditLog: { create: vi.fn() } } as never, { id: "user-1", organizationId: "org-1" } as never, message)).rejects.toMatchObject({ code: "COPY_BLOCKED" });

    const auditLog = { create: vi.fn().mockResolvedValue({ id: "audit-1" }) };
    const ready = compileMessageTemplate("case-1", 1, template, { "order.primaryId": "AT-42" });
    await recordMessageCopy({ auditLog } as never, { id: "user-1", organizationId: "org-1" } as never, ready);
    const serialized = JSON.stringify(auditLog.create.mock.calls[0]);
    expect(serialized).not.toContain(ready.text);
    const metadata = JSON.parse(auditLog.create.mock.calls[0][0].data.metadataJson) as { externalWrite: boolean };
    expect(metadata.externalWrite).toBe(false);
  });

  it("keeps customer and internal channels structurally separate", () => {
    const customer = compileMessageTemplate("case-1", 1, template, { "order.primaryId": "AT-42" });
    const internal = compileMessageTemplate("case-1", 1, { ...template, channel: "INTERNAL_NOTE", body: "Revisar divergencia internamente." }, {});
    expect(customer.channel).toBe("CUSTOMER");
    expect(internal.channel).toBe("INTERNAL_NOTE");
    expect(customer.text).not.toContain(internal.text);
  });
});
