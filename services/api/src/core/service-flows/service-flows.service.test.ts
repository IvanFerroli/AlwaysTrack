import type { CurrentUser } from "@alwaystrack/shared";
import { describe, expect, it, vi } from "vitest";
import { InputValidationError } from "../validation/input-validation.js";
import {
  archiveServiceFlow,
  completeServiceFlowSession,
  createServiceFlow,
  createServiceFlowSession,
  getServiceFlowSession,
  listServiceFlows,
  parseServiceFlowGovernanceInput,
  parseServiceFlowInput,
  parseServiceFlowSessionStepInput,
  publishServiceFlow,
  restoreServiceFlowVersion,
  ServiceFlowError,
  updateServiceFlow,
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
  });
});

describe("service flow tenant workflows", () => {
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
      steps: [{ decisionJson: '{"yes":"continue"}', scripts: [{ script: { id: "script-1", tagsJson: '["apoio"]', placeholdersJson: '["nome"]' } }] }]
    }]);
    const prisma = {
      serviceFlow: { findMany },
      serviceFlowSearchEvent: { create: vi.fn() }
    };

    const result = await listServiceFlows(prisma as never, seller, { query: "triagem", status: "DRAFT", tag: "sac" });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: "org-1", status: "PUBLISHED" })
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
    const upsert = vi.fn().mockResolvedValue({ id: "visit-2" });
    const tx = { serviceFlowSessionStep: { update, count: vi.fn().mockResolvedValue(2), upsert } };
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue(session) },
      serviceFlowSessionStep: { findFirst: vi.fn().mockResolvedValue({ id: "visit-1", nodeKey: "ETAPA-001", status: "PENDING", choiceHistoryJson: "not-json", step: null }) },
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

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { sessionId_nodeKey: { sessionId: session.id, nodeKey: "ETAPA-002" } },
      create: expect.objectContaining({ nodeKey: "ETAPA-002", status: "PENDING" })
    }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ choiceHistoryJson: expect.stringContaining('"toNodeKey":"ETAPA-002"') })
    }));
  });

  it("refuses to complete a versioned session before a terminal result", async () => {
    const prisma = {
      serviceFlowSession: { findFirst: vi.fn().mockResolvedValue({ id: "session-open", versionId: "version-1", organizationId: "org-1", userId: seller.id }) },
      serviceFlowSessionStep: { findMany: vi.fn().mockResolvedValue([{ nodeKey: "ETAPA-001" }]) },
      serviceFlowNode: { findFirst: vi.fn().mockResolvedValue(null) }
    };
    await expect(completeServiceFlowSession(prisma as never, seller, "session-open")).rejects.toEqual(new ServiceFlowError("INVALID_INPUT"));
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
