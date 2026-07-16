import type { CurrentUser } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import { InputValidationError } from "../validation/input-validation.js";
import {
  archiveServiceFlow,
  completeServiceFlowSession,
  createServiceFlow,
  createServiceFlowSession,
  getServiceFlowSession,
  getServiceFlow,
  listServiceFlowProductCatalog,
  listServiceFlows,
  parseServiceFlowSessionCaseDataInput,
  parseServiceFlowGovernanceInput,
  parseServiceFlowInput,
  parseServiceFlowSessionStepInput,
  parseServiceFlowSessionRewindInput,
  publishServiceFlow,
  restoreServiceFlowVersion,
  restartServiceFlowSession,
  rewindServiceFlowSessionStep,
  ServiceFlowError,
  updateServiceFlow,
  updateServiceFlowSessionCaseData,
  updateServiceFlowSessionStep
} from "./service-flows.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  organizationId: "org-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  unitScopeIds: [],
  sectorScopeIds: []
};

const seller: CurrentUser = { ...admin, id: "seller-1", role: "VENDEDOR" };

describe("service flows parser contracts", () => {
  it("normalizes service flow authoring payloads", () => {
    expect(
      parseServiceFlowInput({
        title: " Triagem ",
        slug: "",
        summary: " passo a passo ",
        tags: ["#SAC", "saude", "SAC"],
        status: "published",
        priority: "5",
        steps: [
          {
            title: " Verificar uso ",
            body: "",
            kind: "yes_no",
            order: "2",
            required: true,
            scriptIds: ["script-1", "script-1", "script-2"]
          }
        ]
      })
    ).toMatchObject({
      title: "Triagem",
      slug: null,
      summary: "passo a passo",
      tags: ["sac", "saude"],
      status: "PUBLISHED",
      priority: 5,
      steps: [
        {
          title: "Verificar uso",
          body: null,
          kind: "YES_NO",
          order: 2,
          required: true,
          scriptIds: ["script-1", "script-2"]
        }
      ]
    });
  });

  it("rejects malformed service flow inputs before service execution", () => {
    expect(() => parseServiceFlowInput("bad")).toThrow(InputValidationError);
    expect(() => parseServiceFlowInput({ steps: "bad" })).toThrow(InputValidationError);
    expect(() => parseServiceFlowInput({ steps: [{ title: "ok", scriptIds: Array.from({ length: 13 }, (_, index) => `s-${index}`) }] })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionStepInput({ note: "x".repeat(2_001) })).toThrow(InputValidationError);
    expect(() => parseServiceFlowGovernanceInput({ comment: "x".repeat(2_001) })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionCaseDataInput({ values: Object.fromEntries(Array.from({ length: 51 }, (_, index) => [`field-${index}`, "x"])) })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionCaseDataInput({ values: { "unsafe key": "x" } })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionCaseDataInput({ values: { safe: "x".repeat(2_001) } })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionRewindInput({ strategy: "RESET" })).toThrow(InputValidationError);
  });

  it("parses bounded case data and rewind strategies", () => {
    expect(parseServiceFlowSessionCaseDataInput({ values: { "customer.name": "Ana", order_id: "42" } })).toEqual({
      values: { "customer.name": "Ana", order_id: "42" }
    });
    expect(parseServiceFlowSessionRewindInput({ strategy: "DISCARD_FOLLOWING" })).toEqual({ strategy: "DISCARD_FOLLOWING" });
  });

  it("normalizes bounded structured product lists and rejects malformed products", () => {
    expect(parseServiceFlowSessionCaseDataInput({ values: {
      "order.products": '[{"name":" NAC ","quantity":2}]'
    } })).toEqual({ values: { "order.products": '[{"name":"NAC","quantity":2}]' } });
    expect(() => parseServiceFlowSessionCaseDataInput({ values: { "order.products": "{}" } })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionCaseDataInput({ values: { "order.products": '[{"name":"NAC","quantity":0}]' } })).toThrow(InputValidationError);
    expect(() => parseServiceFlowSessionCaseDataInput({ values: {
      "order.products": JSON.stringify(Array.from({ length: 51 }, () => ({ name: "NAC", quantity: 1 })))
    } })).toThrow(InputValidationError);
  });
});

describe("service flow tenant workflows", () => {
  it("builds a tenant-bound deduplicated product catalog with pilot fallbacks", async () => {
    const findMany = vi.fn().mockResolvedValue([
      { description: "nac", sku: null }, { description: "NAC", sku: "N-1" }, { description: "Produto Z", sku: "Z-1" }
    ]);
    const result = await listServiceFlowProductCatalog({ salesItem: { findMany } } as never, seller);

    expect(findMany).toHaveBeenCalledWith({
      where: { salesDocument: { organizationId: "org-1", status: "APPROVED" } },
      select: { description: true, sku: true }, take: 1_000
    });
    expect(result.items).toEqual(expect.arrayContaining([
      { name: "nac", sku: "N-1" }, { name: "Fit S36" }, { name: "Pro3" }, { name: "Produto Z", sku: "Z-1" }
    ]));
    expect(result.items.filter((item) => item.name.toLowerCase() === "nac")).toHaveLength(1);
  });

  it("runs create, update, publish, and archive as a versioned tenant lifecycle", async () => {
    let flow = {
      id: "flow-1", organizationId: "org-1", wikiPageId: null, title: "Triagem", slug: "triagem", summary: null,
      content: null, tagsJson: '["sac"]', status: "DRAFT", priority: 0, version: 1, publishedAt: null as Date | null,
      reviewDueAt: null as Date | null, draftGraphJson: null as string | null, steps: [] as Array<Record<string, unknown>>, revisions: []
    };
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-1" });
    const revisionUpsert = vi.fn().mockResolvedValue({ id: "revision-1" });
    const serviceFlowFindFirst = vi.fn(async ({ where }: { where: { organizationId?: string; slug?: string; OR?: unknown } }) => {
      if (where.slug && !where.OR) return null;
      return flow;
    });
    const prisma = {
      serviceFlow: {
        findFirst: serviceFlowFindFirst,
        create: vi.fn(async ({ data }) => {
          flow = { ...flow, ...data, version: 1, steps: [], revisions: [] };
          return flow;
        }),
        update: vi.fn(async ({ data }) => {
          flow = { ...flow, ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) };
          return flow;
        })
      },
      serviceFlowStep: {
        deleteMany: vi.fn(async () => { flow.steps = []; }),
        create: vi.fn(async ({ data }) => {
          const step = { id: `step-${flow.steps.length + 1}`, ...data, scripts: [] };
          flow.steps.push(step);
          return step;
        })
      },
      serviceFlowStepScript: { create: vi.fn() },
      serviceFlowRevision: { upsert: revisionUpsert },
      serviceFlowVersion: { findUnique: vi.fn().mockResolvedValue({ id: "published-version" }) },
      auditLog: { create: auditCreate }
    };

    await expect(createServiceFlow(prisma as never, admin, {
      title: "Triagem", tags: ["sac"], steps: [{ title: "Confirmar dados", kind: "CHECKLIST", required: true }]
    })).resolves.toMatchObject({ flow: { status: "DRAFT", version: 1 }, canManage: true });

    await expect(updateServiceFlow(prisma as never, admin, "flow-1", {
      title: "Triagem revisada", steps: [{ title: "Confirmar identidade", kind: "MANUAL" }]
    })).resolves.toMatchObject({ flow: { title: "Triagem revisada", version: 2 } });

    await expect(publishServiceFlow(prisma as never, admin, "flow-1", { comment: "Aprovado pelo gestor" }))
      .resolves.toMatchObject({ flow: { status: "PUBLISHED", version: 3 } });
    await expect(archiveServiceFlow(prisma as never, admin, "flow-1", { comment: "Substituido por novo processo" }))
      .resolves.toMatchObject({ flow: { status: "ARCHIVED", version: 4 } });

    expect(revisionUpsert).toHaveBeenCalledTimes(4);
    expect(auditCreate.mock.calls.map((call) => call[0].data.action)).toEqual([
      "service_flow.create", "service_flow.update", "service_flow.publish", "service_flow.archive"
    ]);
    expect(serviceFlowFindFirst.mock.calls.every((call) => call[0].where.organizationId === "org-1")).toBe(true);
  });

  it("limits sellers to published flows in their organization and formats embedded scripts", async () => {
    const findMany = vi.fn().mockResolvedValue([{
      id: "flow-1",
      organizationId: "org-1",
      title: "Triagem",
      tagsJson: '["SAC","saude"]',
      steps: [{ decisionJson: '{"yes":"continue"}', scripts: [
        { script: { id: "script-1", status: "VALIDATED", tagsJson: '["apoio"]', placeholdersJson: '["nome"]' } },
        { script: { id: "script-draft", status: "DRAFT", tagsJson: "[]", placeholdersJson: "[]" } }
      ] }]
    }]);
    const prisma = {
      serviceFlow: { findMany },
      serviceFlowSearchEvent: { create: vi.fn() }
    };

    const result = await listServiceFlows(prisma as never, seller, { query: "triagem", status: "DRAFT", tag: "sac" });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: "org-1", status: "PUBLISHED" }),
      include: expect.objectContaining({ steps: expect.objectContaining({ include: { scripts: expect.objectContaining({ where: { script: { status: "VALIDATED" } } }) } }) })
    }));
    expect(result).toMatchObject({
      canManage: false,
      items: [{ tags: ["sac", "saude"], steps: [{ decision: { yes: "continue" }, scripts: [{ script: { tags: ["apoio"], placeholders: ["nome"] } }] }] }]
    });
  });

  it("records zero-result searches without allowing telemetry failure to fail the request", async () => {
    const create = vi.fn().mockRejectedValue(new Error("telemetry unavailable"));
    const prisma = { serviceFlow: { findMany: vi.fn().mockResolvedValue([]) }, serviceFlowSearchEvent: { create } };

    await expect(listServiceFlows(prisma as never, admin, { query: "missing" })).resolves.toEqual({ items: [], canManage: true });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", resultCount: 0 }) }));
  });

  it("starts, advances, completes, and reads only the actor's own session", async () => {
    const flow = { id: "flow-1", slug: "triagem", title: "Triagem", version: 2, tagsJson: "[]", steps: [] };
    const version = { id: "version-2", version: 2, nodes: [
      { id: "node-start", key: "start", type: "START" },
      { id: "node-check", key: "check", type: "CHECK" }
    ] };
    const openSession = {
      id: "session-1", flowId: flow.id, status: "OPEN", flow, version,
      steps: [{ id: "session-step-2", nodeKey: "check", visitOrder: 1, status: "PENDING" }, { id: "session-step-1", nodeKey: "start", visitOrder: 0, status: "DONE" }]
    };
    const completedSession = { ...openSession, status: "COMPLETED" };
    const sessionFindFirst = vi.fn()
      .mockResolvedValueOnce(openSession)
      .mockResolvedValueOnce(openSession)
      .mockResolvedValueOnce(openSession)
      .mockResolvedValueOnce(completedSession)
      .mockResolvedValueOnce(null);
    const prisma = {
      serviceFlow: { findFirst: vi.fn().mockResolvedValue(flow) },
      serviceFlowVersion: { findFirst: vi.fn().mockResolvedValue(version) },
      serviceFlowSession: {
        create: vi.fn().mockResolvedValue(openSession),
        findFirst: sessionFindFirst,
        update: vi.fn().mockResolvedValue(completedSession)
      },
      serviceFlowSessionStep: {
        findFirst: vi.fn().mockResolvedValue({ id: "session-step-2", nodeKey: "check", status: "PENDING", step: null }),
        findMany: vi.fn().mockResolvedValue([{ status: "DONE", nodeKey: "start" }, { status: "DONE", nodeKey: "check" }]),
        update: vi.fn().mockResolvedValue({ id: "session-step-2", status: "DONE", decision: "yes", note: "confirmed" })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const started = await createServiceFlowSession(prisma as never, seller, "triagem");
    expect(started.session.steps.map((step) => step.nodeKey)).toEqual(["start", "check"]);
    expect(prisma.serviceFlowSession.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", userId: "seller-1" }) }));

    await updateServiceFlowSessionStep(prisma as never, seller, "session-1", "check", { status: "DONE", decision: "yes", note: "confirmed" });
    expect(prisma.serviceFlowSessionStep.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DONE", decision: "yes" }) }));

    await expect(completeServiceFlowSession(prisma as never, seller, "session-1")).resolves.toMatchObject({ session: { status: "COMPLETED" } });
    await expect(getServiceFlowSession(prisma as never, { ...seller, organizationId: "org-2" }, "session-1")).rejects.toEqual(new ServiceFlowError("NOT_FOUND"));
    expect(sessionFindFirst.mock.calls.at(-1)?.[0]).toMatchObject({ where: { organizationId: "org-2", userId: "seller-1" } });
  });

  it("materializes only the selected next node for a versioned decision", async () => {
    const session = {
      id: "session-graph", flowId: "flow-health", versionId: "version-health", userId: seller.id, status: "OPEN",
      flow: { id: "flow-health", slug: "saude-dev-troca-estorno", title: "Saude" }, version: { id: "version-health", version: 1 },
      steps: [{ id: "visit-1", stepId: null, nodeKey: "ETAPA-001", visitOrder: 1, status: "DONE", decision: "Caso reconhecido" }]
    };
    const update = vi.fn().mockResolvedValue({ id: "visit-1", status: "DONE", decision: "Caso reconhecido", note: null });
    const create = vi.fn().mockResolvedValue({ id: "visit-2" });
    const tx = { serviceFlowSessionStep: { update, count: vi.fn().mockResolvedValue(2), create } };
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(session) },
      serviceFlowSessionStep: { findFirst: vi.fn()
        .mockResolvedValueOnce({ id: "visit-1", nodeKey: "ETAPA-001", nodeSnapshotJson: '{"requiredFacts":[]}', visitOrder: 1, status: "PENDING", choiceHistoryJson: "not-json", step: null })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null) },
      serviceFlowTransition: { findMany: vi.fn().mockResolvedValue([
        { label: "Caso reconhecido", requiresUserChoice: true, toNode: { id: "node-2", key: "ETAPA-002", type: "MESSAGE" } },
        { label: "Fora do escopo", requiresUserChoice: true, toNode: { id: "node-result", key: "RESULTADO-009", type: "END" } }
      ]) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-graph" }) },
      $transaction: vi.fn(async (operation) => operation(tx))
    };

    await expect(updateServiceFlowSessionStep(prisma as never, seller, session.id, "ETAPA-001", {
      status: "DONE", decision: "Caso reconhecido"
    })).resolves.toMatchObject({ session: { id: session.id } });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ nodeKey: "ETAPA-002", status: "PENDING" })
    }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ choiceHistoryJson: expect.stringContaining('"toNodeKey":"ETAPA-002"') })
    }));
  });

  it("rejects a changed branch while incompatible following steps remain materialized", async () => {
    const session = { id: "session-branch", versionId: "version-1", status: "OPEN", caseDataJson: "{}" };
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(session) },
      serviceFlowSessionStep: { findFirst: vi.fn()
        .mockResolvedValueOnce({ id: "visit-1", nodeKey: "decision", visitOrder: 1, status: "DONE", nodeSnapshotJson: '{"requiredFactsJson":"[]"}', choiceHistoryJson: null, step: null })
        .mockResolvedValueOnce({ id: "stale", nodeKey: "old-branch" }) },
      serviceFlowTransition: { findMany: vi.fn().mockResolvedValue([
        { label: "Novo ramo", requiresUserChoice: true, toNode: { key: "new-branch" } }
      ]) },
      $transaction: vi.fn()
    };

    await expect(updateServiceFlowSessionStep(prisma as never, seller, session.id, "decision", { status: "DONE", decision: "Novo ramo" }))
      .rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("reopens only an explicitly declared loop target", async () => {
    const session = { id: "session-loop", versionId: "version-1", status: "OPEN", caseDataJson: "{}", flow: { title: "Saude" }, steps: [] };
    const current = { id: "visit-loop", nodeKey: "ETAPA-008", visitOrder: 2, status: "PENDING", nodeSnapshotJson: '{"requiredFacts":[]}', choiceHistoryJson: null, step: null };
    const update = vi.fn()
      .mockResolvedValueOnce({ ...current, status: "DONE" })
      .mockResolvedValueOnce({ ...current, status: "PENDING", visitOrder: 3 });
    const tx = { serviceFlowSessionStep: { update, count: vi.fn().mockResolvedValue(3) } };
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(session) },
      serviceFlowSessionStep: { findFirst: vi.fn().mockResolvedValueOnce(current).mockResolvedValueOnce({ id: current.id, nodeKey: current.nodeKey }) },
      serviceFlowTransition: { findMany: vi.fn().mockResolvedValue([
        { label: "Resposta incompleta", requiresUserChoice: true, allowLoop: true, toNode: { key: current.nodeKey } }
      ]) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-loop" }) },
      $transaction: vi.fn(async (operation) => operation(tx))
    };

    await updateServiceFlowSessionStep(prisma as never, seller, session.id, current.nodeKey, {
      status: "DONE", decision: "Resposta incompleta"
    });

    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: current.id },
      data: { status: "PENDING", decision: null, completedAt: null, visitOrder: 3 }
    });
  });

  it("refuses to complete a versioned session before a terminal result", async () => {
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue({ id: "session-open", versionId: "version-1", organizationId: "org-1", userId: seller.id }) },
      serviceFlowSessionStep: { findMany: vi.fn().mockResolvedValue([{ nodeKey: "ETAPA-001" }]) },
      serviceFlowNode: { findFirst: vi.fn().mockResolvedValue(null) }
    };
    await expect(completeServiceFlowSession(prisma as never, seller, "session-open")).rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
  });

  it("merges case data for an open owned session and audits field names only", async () => {
    const session = {
      id: "session-case", organizationId: "org-1", userId: seller.id, status: "OPEN", caseDataJson: '{"customer.name":"Ana"}',
      flow: { title: "Saude" }, steps: []
    };
    const findFirst = vi.fn().mockResolvedValueOnce(session).mockResolvedValueOnce({
      ...session, caseDataJson: '{"customer.name":"Ana","order.id":"42"}'
    });
    const update = vi.fn().mockResolvedValue(session);
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-case" });
    const prisma = { serviceFlowSession: { findFirst, update }, auditLog: { create: auditCreate } };

    const result = await updateServiceFlowSessionCaseData(prisma as never, seller, session.id, { values: { "order.id": "42" } });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: { caseDataJson: '{"customer.name":"Ana","order.id":"42"}' }
    }));
    expect(result.session).toMatchObject({ caseData: { "customer.name": "Ana", "order.id": "42" } });
    expect(result.session).not.toHaveProperty("caseDataJson");
    const auditPayload = auditCreate.mock.calls[0][0].data;
    expect(JSON.parse(auditPayload.metadataJson)).toEqual({ fieldNames: ["order.id"], removals: [] });
    expect(auditPayload.metadataJson).not.toContain("42");
  });

  it("removes empty scalar and structured list values without persisting tombstones", async () => {
    const session = { id: "session-remove", status: "OPEN", caseDataJson: '{"customer.name":"Ana","order.products":[{"name":"NAC","quantity":1}]}', flow: { title: "Saude" }, steps: [] };
    const findFirst = vi.fn().mockResolvedValueOnce(session).mockResolvedValueOnce({ ...session, caseDataJson: "{}" });
    const update = vi.fn().mockResolvedValue(session);
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-remove" });
    const prisma = { serviceFlowSession: { findFirst, update }, auditLog: { create: auditCreate } };

    const result = await updateServiceFlowSessionCaseData(prisma as never, seller, session.id, {
      values: { "customer.name": "", "order.products": "[]" }
    });

    expect(update).toHaveBeenCalledWith({ where: { id: session.id }, data: { caseDataJson: "{}" } });
    expect(result.session.caseData).toEqual({});
    expect(JSON.parse(auditCreate.mock.calls[0][0].data.metadataJson)).toEqual({
      fieldNames: ["customer.name", "order.products"], removals: ["customer.name", "order.products"]
    });
  });

  it("rejects product subsets that exceed the base order while allowing exchange composition", async () => {
    const session = { id: "session-products", status: "OPEN", caseDataJson: '{"order.products":"[{\\"name\\":\\"NAC\\",\\"quantity\\":2}]"}' };
    const update = vi.fn();
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(session), update },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-products" }) }
    };

    await expect(updateServiceFlowSessionCaseData(prisma as never, seller, session.id, {
      values: { "custom.alwaysfit.return.open.items": '[{"name":"nac","quantity":3}]' }
    })).rejects.toBeInstanceOf(InputValidationError);
    await expect(updateServiceFlowSessionCaseData(prisma as never, seller, session.id, {
      values: { "custom.alwaysfit.exchange.items": '[{"name":"Outro","quantity":20}]' }
    })).resolves.toBeDefined();
    await expect(updateServiceFlowSessionCaseData(prisma as never, seller, session.id, {
      values: { "custom.alwaysfit.health.concomitant.products": '[{"name":"Medicamento externo","quantity":3}]' }
    })).resolves.toBeDefined();
  });

  it("enforces typed transition conditions and validates CPF as exactly 11 digits", async () => {
    const transition = { label: "CPF localizado", requiresUserChoice: true, allowLoop: false, conditionJson: '{"operator":"FACT_EXISTS","factKey":"customer.cpf"}', toNode: { key: "next" } };
    const prismaForCpf = (cpf: string) => ({
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue({ id: "condition-session", versionId: "v1", status: "OPEN", caseDataJson: JSON.stringify({ "customer.cpf": cpf }) }) },
      serviceFlowSessionStep: { findFirst: vi.fn().mockResolvedValue({ id: "visit", nodeKey: "decision", visitOrder: 1, status: "PENDING", nodeSnapshotJson: '{"requiredFacts":[]}', choiceHistoryJson: null, step: null }) },
      serviceFlowTransition: { findMany: vi.fn().mockResolvedValue([transition]) }
    });

    await expect(updateServiceFlowSessionStep(prismaForCpf("123.456.789-0") as never, seller, "condition-session", "decision", {
      status: "DONE", decision: "CPF localizado"
    })).rejects.toEqual(new ServiceFlowError("MISSING_REQUIRED_FACTS", ["customer.cpf"]));
    await expect(updateServiceFlowSessionStep(prismaForCpf("123.456.789-012") as never, seller, "condition-session", "decision", {
      status: "DONE", decision: "CPF localizado"
    })).rejects.toEqual(new ServiceFlowError("MISSING_REQUIRED_FACTS", ["customer.cpf"]));

    const valid = prismaForCpf("123.456.789-01") as any;
    valid.serviceFlowSessionStep.findFirst
      .mockResolvedValueOnce({ id: "visit", nodeKey: "decision", visitOrder: 1, status: "PENDING", nodeSnapshotJson: '{"requiredFacts":[]}', choiceHistoryJson: null, step: null })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const tx = {
      serviceFlowSessionStep: {
        update: vi.fn().mockResolvedValue({ id: "visit", status: "DONE", decision: "CPF localizado", note: null }),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue({ id: "next-visit" })
      }
    };
    valid.$transaction = vi.fn(async (operation: (client: unknown) => unknown) => operation(tx));
    valid.auditLog = { create: vi.fn().mockResolvedValue({ id: "audit-condition" }) };
    await expect(updateServiceFlowSessionStep(valid, seller, "condition-session", "decision", {
      status: "DONE", decision: "CPF localizado"
    })).resolves.toMatchObject({ session: { id: "condition-session" } });

    const equals = prismaForCpf("123.456.789-01") as any;
    equals.serviceFlowTransition.findMany.mockResolvedValue([{ ...transition, conditionJson: '{"operator":"FACT_EQUALS","factKey":"customer.cpf","value":"other"}' }]);
    await expect(updateServiceFlowSessionStep(equals, seller, "condition-session", "decision", {
      status: "DONE", decision: "CPF localizado"
    })).rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
  });

  it("restarts into a new pinned session and atomically rejects a duplicate restart", async () => {
    const source = { id: "source", flowId: "flow-1", versionId: "version-1", status: "OPEN", caseDataJson: '{"customer.cpf":"12345678901"}' };
    const start = { id: "node-start", key: "START", type: "START", order: 0 };
    const first = { id: "node-first", key: "ETAPA-001", type: "CONTEXT", order: 1 };
    const target = { id: "target", flowId: source.flowId, versionId: source.versionId, status: "OPEN", caseDataJson: null, flow: { title: "Saude" }, version: { id: "version-1" }, steps: [] };
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const create = vi.fn().mockResolvedValue(target);
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-restart" });
    const tx = { serviceFlowSession: { updateMany, create }, auditLog: { create: auditCreate } };
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(source) },
      serviceFlowVersion: { findFirst: vi.fn().mockResolvedValue({ id: "version-1", nodes: [start, first], transitions: [{ fromNode: { key: "START" }, toNode: first }] }) },
      $transaction: vi.fn(async (operation) => operation(tx))
    };

    const result = await restartServiceFlowSession(prisma as never, seller, source.id);
    expect(result.session).toMatchObject({ id: "target", status: "OPEN", caseData: {} });
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: source.id, organizationId: "org-1", userId: seller.id, status: "OPEN" }) }));
    expect(create.mock.calls[0][0].data).toMatchObject({ flowId: source.flowId, versionId: source.versionId, caseDataJson: null });
    expect(create.mock.calls[0][0].data.steps.create).toHaveLength(2);
    expect(JSON.parse(auditCreate.mock.calls[0][0].data.metadataJson)).toEqual({ sourceSessionId: "source", targetSessionId: "target", flowId: "flow-1", versionId: "version-1" });
    expect(prisma.serviceFlowSession.findFirst).toHaveBeenCalledWith({
      where: { id: source.id, organizationId: "org-1", userId: seller.id, status: "OPEN" }
    });

    updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(restartServiceFlowSession(prisma as never, seller, source.id)).rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("rejects restart outside owner, tenant, or open status before entering a transaction", async () => {
    const prisma = { serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(null) }, $transaction: vi.fn() };
    await expect(restartServiceFlowSession(prisma as never, seller, "foreign")).rejects.toEqual(new ServiceFlowError("NOT_FOUND"));
    expect(prisma.serviceFlowSession.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign", organizationId: "org-1", userId: seller.id, status: "OPEN" }
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("restarts a legacy session with every current legacy step pending", async () => {
    const source = { id: "legacy-source", flowId: "flow-legacy", versionId: null, status: "OPEN" };
    const legacySteps = [
      { id: "step-1", title: "Primeiro", order: 1, required: true },
      { id: "step-2", title: "Segundo", order: 2, required: false }
    ];
    const target = { id: "legacy-target", flowId: source.flowId, versionId: null, status: "OPEN", caseDataJson: null, flow: { title: "Legado" }, steps: [] };
    const create = vi.fn().mockResolvedValue(target);
    const tx = {
      serviceFlowSession: { updateMany: vi.fn().mockResolvedValue({ count: 1 }), create },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "legacy-audit" }) }
    };
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(source) },
      serviceFlowStep: { findMany: vi.fn().mockResolvedValue(legacySteps) },
      $transaction: vi.fn(async (operation) => operation(tx))
    };
    await restartServiceFlowSession(prisma as never, seller, source.id);
    expect(create.mock.calls[0][0].data.steps.create).toEqual([
      expect.objectContaining({ stepId: "step-1", status: "PENDING", visitOrder: 0 }),
      expect.objectContaining({ stepId: "step-2", status: "PENDING", visitOrder: 1 })
    ]);
  });

  it("rejects case data updates outside the owner, tenant, or open session scope", async () => {
    const prisma = { serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() } };
    await expect(updateServiceFlowSessionCaseData(prisma as never, seller, "foreign", { values: { safe: "value" } }))
      .rejects.toEqual(new ServiceFlowError("NOT_FOUND"));
    expect(prisma.serviceFlowSession.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign", organizationId: "org-1", userId: seller.id, status: "OPEN" }
    });
    expect(prisma.serviceFlowSession.update).not.toHaveBeenCalled();
  });

  it("rejects rewind outside the owner, tenant, or open session scope", async () => {
    const prisma = { serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(null) }, $transaction: vi.fn() };
    await expect(rewindServiceFlowSessionStep(prisma as never, seller, "foreign", "check", { strategy: "DISCARD_FOLLOWING" }))
      .rejects.toEqual(new ServiceFlowError("NOT_FOUND"));
    expect(prisma.serviceFlowSession.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign", organizationId: "org-1", userId: seller.id, status: "OPEN" }
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each(["DISCARD_FOLLOWING", "RECONFIRM_FOLLOWING"] as const)("rewinds with %s while preserving entered content", async (strategy) => {
    const session = { id: "session-rewind", organizationId: "org-1", userId: seller.id, status: "OPEN", flow: { title: "Saude" }, steps: [] };
    const target = { id: "visit-2", nodeKey: "check", visitOrder: 2, decision: "Sim", note: "Manter", step: null };
    const tx = {
      serviceFlowSessionStep: {
        update: vi.fn().mockResolvedValue(target),
        deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
        updateMany: vi.fn().mockResolvedValue({ count: 3 })
      }
    };
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit-rewind" });
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(session) },
      serviceFlowSessionStep: { findFirst: vi.fn().mockResolvedValue(target) },
      auditLog: { create: auditCreate },
      $transaction: vi.fn(async (operation) => operation(tx))
    };

    await rewindServiceFlowSessionStep(prisma as never, seller, session.id, "check", { strategy });

    expect(tx.serviceFlowSessionStep.update).toHaveBeenCalledWith({
      where: { id: target.id }, data: { status: "PENDING", completedAt: null }
    });
    if (strategy === "DISCARD_FOLLOWING") {
      expect(tx.serviceFlowSessionStep.deleteMany).toHaveBeenCalledOnce();
      expect(tx.serviceFlowSessionStep.updateMany).not.toHaveBeenCalled();
    } else {
      expect(tx.serviceFlowSessionStep.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: "RECONFIRMATION_REQUIRED", completedAt: null }
      }));
      expect(tx.serviceFlowSessionStep.deleteMany).not.toHaveBeenCalled();
    }
    expect(JSON.parse(auditCreate.mock.calls[0][0].data.metadataJson)).toEqual({ strategy, targetStepId: "check", affectedCount: 3 });
  });

  it("requires completed versioned nodes to satisfy snapshot facts and prevents protected skips", async () => {
    const baseSession = { id: "session-gate", versionId: "version-1", organizationId: "org-1", userId: seller.id, status: "OPEN", caseDataJson: '{"customer.name":"  "}' };
    const prismaFor = (nodeSnapshotJson: string) => ({
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(baseSession) },
      serviceFlowSessionStep: { findFirst: vi.fn().mockResolvedValue({ id: "visit-gate", nodeKey: "gate", visitOrder: 1, status: "PENDING", nodeSnapshotJson, step: null }) }
    });

    await expect(updateServiceFlowSessionStep(prismaFor('{"required":true,"requiredFacts":[]}') as never, seller, baseSession.id, "gate", { status: "SKIPPED" }))
      .rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
    await expect(updateServiceFlowSessionStep(prismaFor('{"type":"RISK_GATE","requiredFacts":[]}') as never, seller, baseSession.id, "gate", { status: "SKIPPED" }))
      .rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
    await expect(updateServiceFlowSessionStep(prismaFor('{"requiredFacts":["customer.name"]}') as never, seller, baseSession.id, "gate", { status: "SKIPPED" }))
      .rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
    await expect(updateServiceFlowSessionStep(prismaFor('{"type":"MESSAGE","requiredFacts":[]}') as never, seller, baseSession.id, "gate", { status: "SKIPPED" }))
      .rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
    await expect(updateServiceFlowSessionStep(prismaFor('{"requiredFactsJson":"[\\"customer.name\\",\\"order.id\\"]"}') as never, seller, baseSession.id, "gate", { status: "DONE" }))
      .rejects.toEqual(new ServiceFlowError("MISSING_REQUIRED_FACTS", ["customer.name", "order.id"]));
  });

  it("allows DONE after all required snapshot facts have non-empty case data", async () => {
    const session = {
      id: "session-ready", versionId: "version-1", organizationId: "org-1", userId: seller.id, status: "OPEN",
      caseDataJson: '{"customer.name":"Ana"}', flow: { title: "Saude" }, steps: []
    };
    const update = vi.fn().mockResolvedValue({ id: "visit-ready", status: "DONE", decision: null, note: null });
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(session) },
      serviceFlowSessionStep: {
        findFirst: vi.fn().mockResolvedValue({ id: "visit-ready", nodeKey: "check", visitOrder: 1, status: "RECONFIRMATION_REQUIRED", nodeSnapshotJson: '{"requiredFacts":["customer.name","custom.alwaysfit.health.usage","custom.alwaysfit.health.symptom.persistent","custom.alwaysfit.treatment.unusable.scope","custom.alwaysfit.return.open.items","custom.alwaysfit.return.returned.sealed.items","custom.alwaysfit.return.retained.sealed.items","custom.alwaysfit.financial.retained.sealed.value"]}', choiceHistoryJson: null, step: null }),
        update
      },
      serviceFlowTransition: { findMany: vi.fn().mockResolvedValue([]) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-ready" }) }
    };
    await expect(updateServiceFlowSessionStep(prisma as never, seller, session.id, "check", { status: "DONE" })).resolves.toMatchObject({ session: { id: session.id } });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DONE" }) }));
  });

  it("blocks step mutation in completed sessions and completion with reconfirmations", async () => {
    const completedPrisma = { serviceFlowSession: { findFirst: vi.fn().mockResolvedValue({ id: "closed", status: "COMPLETED" }) } };
    await expect(updateServiceFlowSessionStep(completedPrisma as never, seller, "closed", "step", { status: "DONE" }))
      .rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));

    const completionPrisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue({ id: "open", status: "OPEN", versionId: "version-1", flowId: "flow-1" }) },
      serviceFlowSessionStep: { findMany: vi.fn().mockResolvedValue([{ status: "RECONFIRMATION_REQUIRED", nodeKey: "check" }]) }
    };
    await expect(completeServiceFlowSession(completionPrisma as never, seller, "open")).rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
  });

  it("completes only a fully resolved terminal path and returns its report", async () => {
    const open = { id: "session-complete", status: "OPEN", versionId: "version-1", flowId: "flow-1" };
    const completed = {
      ...open, status: "COMPLETED", caseDataJson: "{}", flow: { title: "Saude" },
      steps: [{ status: "DONE", nodeKey: "end", visitOrder: 1, decision: "Encerrado", note: null, nodeSnapshotJson: '{"title":"Resultado"}', step: null }]
    };
    const prisma = {
      serviceFlowSession: {
        findFirst: vi.fn().mockResolvedValueOnce(open).mockResolvedValueOnce(completed),
        update: vi.fn().mockResolvedValue(completed)
      },
      serviceFlowSessionStep: { findMany: vi.fn().mockResolvedValue([{ status: "DONE", nodeKey: "end" }]) },
      serviceFlowNode: { findFirst: vi.fn().mockResolvedValue({ id: "terminal" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-complete" }) }
    };

    const result = await completeServiceFlowSession(prisma as never, seller, open.id);
    expect(result.session).toMatchObject({ status: "COMPLETED", report: "Atendimento - Saude\n- Resultado — Decisao: Encerrado" });
    expect(prisma.serviceFlowNode.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ versionId: "version-1", terminal: true, key: { in: ["end"] } })
    }));
  });

  it("keeps legacy completion compatible with optional pending steps", async () => {
    const open = { id: "legacy-open", status: "OPEN", versionId: null, flowId: "flow-legacy" };
    const completed = { ...open, status: "COMPLETED", caseDataJson: null, flow: { title: "Legado" }, steps: [] };
    const findFirst = vi.fn().mockResolvedValueOnce(open).mockResolvedValueOnce(completed);
    const prisma = {
      serviceFlowSession: { findFirst, update: vi.fn().mockResolvedValue(completed) },
      serviceFlowSessionStep: { findMany: vi.fn().mockResolvedValue([{ status: "PENDING", nodeKey: "legacy:optional", step: { required: false } }]) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-legacy" }) }
    };
    await expect(completeServiceFlowSession(prisma as never, seller, open.id)).resolves.toMatchObject({ session: { status: "COMPLETED" } });
  });

  it.each([
    [{ status: "PENDING", nodeKey: "legacy:required", step: { required: true } }],
    [{ status: "RECONFIRMATION_REQUIRED", nodeKey: "legacy:optional", step: { required: false } }]
  ])("blocks legacy completion for required or reconfirmation work", async (materializedStep) => {
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue({ id: "legacy-blocked", status: "OPEN", versionId: null, flowId: "flow-legacy" }) },
      serviceFlowSessionStep: { findMany: vi.fn().mockResolvedValue([materializedStep]) }
    };
    await expect(completeServiceFlowSession(prisma as never, seller, "legacy-blocked")).rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
  });

  it("returns a deterministic report from visited completed or skipped steps", async () => {
    const prisma = { serviceFlowSession: { findFirst: vi.fn().mockResolvedValue({
      id: "session-report", caseDataJson: '{"private":"value"}', flow: { title: "Saude" },
      steps: [
        { nodeKey: "third", visitOrder: 3, status: "DONE", decision: null, note: "  " , nodeSnapshotJson: '{"title":"Vazio"}', step: null },
        { nodeKey: "second", visitOrder: 2, status: "SKIPPED", decision: null, note: "Sem retorno", nodeSnapshotJson: '{"title":"Contato"}', step: null },
        { nodeKey: "first", visitOrder: 1, status: "DONE", decision: "Aprovado", note: "Confirmado", nodeSnapshotJson: '{"title":"Analise"}', step: null },
        { nodeKey: "pending", visitOrder: 4, status: "PENDING", decision: "Ignorar", note: null, nodeSnapshotJson: null, step: null }
      ]
    }) } };

    const result = await getServiceFlowSession(prisma as never, seller, "session-report");

    expect(result.session.report).toBe(
      "Atendimento - Saude\n- Analise — Decisao: Aprovado · Nota: Confirmado\n- Contato — Nota: Sem retorno"
    );
    expect(result.session).toMatchObject({ caseData: { private: "value" } });
    expect(result.session).not.toHaveProperty("caseDataJson");
  });

  it("preserves unpublished scripts for managers in service flow details", async () => {
    const flow = { id: "flow-1", title: "Triagem", tagsJson: "[]", steps: [{ decisionJson: null, scripts: [
      { script: { id: "validated", status: "VALIDATED", tagsJson: "[]", placeholdersJson: "[]" } },
      { script: { id: "draft", status: "DRAFT", tagsJson: "[]", placeholdersJson: "[]" } }
    ] }] };
    const findFirst = vi.fn().mockResolvedValue(flow);
    const result = await getServiceFlow({ serviceFlow: { findFirst } } as never, admin, "flow-1");
    expect(result.flow.steps[0].scripts.map((link) => link.script.id)).toEqual(["validated", "draft"]);
    expect(findFirst.mock.calls[0][0].include.steps.include.scripts.where).toBeUndefined();
  });

  it("exposes only VALIDATED scripts to sellers in service flow details", async () => {
    const flow = { id: "flow-1", title: "Triagem", tagsJson: "[]", steps: [{ decisionJson: null, scripts: [
      { script: { id: "validated", status: "VALIDATED", tagsJson: "[]", placeholdersJson: "[]" } },
      { script: { id: "draft", status: "DRAFT", tagsJson: "[]", placeholdersJson: "[]" } },
      { script: { id: "obsolete", status: "OBSOLETE", tagsJson: "[]", placeholdersJson: "[]" } }
    ] }] };
    const findFirst = vi.fn().mockResolvedValue(flow);
    const result = await getServiceFlow({ serviceFlow: { findFirst } } as never, seller, "flow-1");
    expect(result.flow.steps[0].scripts.map((link) => link.script.id)).toEqual(["validated"]);
    expect(findFirst.mock.calls[0][0].include.steps.include.scripts.where).toEqual({ script: { status: "VALIDATED" } });
  });

  it("restores a tenant-owned published version and persists its graph lineage", async () => {
    const rawFlow = {
      id: "flow-1", slug: "triagem", title: "Triagem restaurada", summary: null, content: null, tagsJson: "[]",
      status: "PUBLISHED", version: 4, draftGraphJson: null, publishedAt: new Date("2026-07-01"), steps: []
    };
    const source = {
      id: "version-2", flowId: "flow-1", version: 2, title: "Triagem restaurada", summary: "Versao estavel", content: "Conteudo",
      tagsJson: '["estavel"]',
      nodes: [
        { key: "start", type: "START", title: "Inicio", operatorInstruction: null, requiredFactsJson: "[]", optionalFactsJson: "[]", scriptsJson: "[]", allowedCapabilitiesJson: "[]", forbiddenCapabilitiesJson: "[]", autoAdvance: true, riskLevel: "LOW", terminal: false, message: null, dependenciesJson: null },
        { key: "end", type: "END", title: "Fim", operatorInstruction: null, requiredFactsJson: "[]", optionalFactsJson: "[]", scriptsJson: "[]", allowedCapabilitiesJson: "[]", forbiddenCapabilitiesJson: "[]", autoAdvance: false, riskLevel: "LOW", terminal: true, message: null, dependenciesJson: null }
      ],
      transitions: [{ fromNode: { key: "start" }, toNode: { key: "end" }, label: "Continuar", order: 0, conditionJson: null, requiresUserChoice: false, allowLoop: false }]
    };
    const finalFlow = { ...rawFlow, summary: source.summary, content: source.content, tagsJson: source.tagsJson, revisions: [], steps: [] };
    const findFirst = vi.fn()
      .mockResolvedValueOnce(rawFlow)
      .mockResolvedValueOnce(rawFlow)
      .mockResolvedValueOnce(rawFlow)
      .mockResolvedValueOnce(finalFlow);
    const tx = {
      serviceFlowVersion: { create: vi.fn().mockResolvedValue({ id: "version-4" }) },
      serviceFlowNode: { create: vi.fn().mockResolvedValueOnce({ id: "node-start" }).mockResolvedValueOnce({ id: "node-end" }) },
      serviceFlowTransition: { create: vi.fn().mockResolvedValue({ id: "edge-1" }) }
    };
    const prisma = {
      serviceFlow: { findFirst, update: vi.fn().mockResolvedValue(rawFlow) },
      serviceFlowVersion: { findFirst: vi.fn().mockResolvedValue(source), findUnique: vi.fn().mockResolvedValue(null) },
      serviceFlowRevision: { upsert: vi.fn().mockResolvedValue({ id: "revision-4" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) },
      $transaction: vi.fn(async (operation) => operation(tx))
    };

    const result = await restoreServiceFlowVersion(prisma as never, admin, "flow-1", "version-2", "Rollback aprovado");

    expect(result).toMatchObject({ flow: { id: "flow-1", tags: ["estavel"] }, canManage: true });
    expect(tx.serviceFlowNode.create).toHaveBeenCalledTimes(2);
    expect(tx.serviceFlowTransition.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ fromNodeId: "node-start", toNodeId: "node-end" }) }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-1", action: "service_flow.restore" }) }));
  });
});
