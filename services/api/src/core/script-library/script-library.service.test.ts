import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  createOperationalScript,
  listScriptLibrary,
  parseOperationalScriptInput,
  parseScriptFilters,
  recertifyOperationalScript,
  recordScriptCopy,
  validateOperationalScript
} from "./script-library.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const sac: CurrentUser = { ...admin, id: "sac-1", role: "SAC" };

function prismaMock() {
  const script = {
    id: "script-1",
    organizationId: "org-1",
    categoryId: "cat-1",
    wikiPageId: null,
    faqThreadId: null,
    title: "Rastreio",
    channel: "WHATSAPP",
    body: "Olá {nome_cliente}",
    tagsJson: "[\"rastreio\"]",
    placeholdersJson: "[\"nome_cliente\"]",
    status: "DRAFT",
    createdById: "admin-1",
    updatedById: "admin-1",
    validatedById: null,
    validatedAt: null,
    reviewDueAt: null,
    recertifiedById: null,
    recertifiedAt: null
  };
  return {
    scriptCategory: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({ id: "cat-1", organizationId: "org-1" })
    },
    operationalScript: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(script),
      update: vi.fn().mockResolvedValue({ ...script, status: "VALIDATED", validatedById: "admin-1", validatedAt: new Date(), usageCount: 1 })
    },
    operationalScriptRevision: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "rev-1" })
    },
    operationalScriptEvent: {
      create: vi.fn().mockResolvedValue({ id: "event-1" })
    },
    wikiPage: {
      findFirst: vi.fn().mockResolvedValue({ id: "wiki-1", organizationId: "org-1", active: true })
    },
    faqThread: {
      findFirst: vi.fn().mockResolvedValue({ id: "thread-1", organizationId: "org-1" })
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" })
    }
  };
}

describe("script library service", () => {
  it("parses script input and filters", () => {
    expect(parseOperationalScriptInput({ title: " Rastreio ", channel: "whatsapp", wikiPageId: "wiki-1", faqThreadId: null, tags: ["#Entrega"], status: "validated", reviewDueAt: "2026-07-01" })).toMatchObject({
      title: "Rastreio",
      channel: "WHATSAPP",
      wikiPageId: "wiki-1",
      faqThreadId: null,
      tags: ["entrega"],
      status: "VALIDATED",
      reviewDueAt: new Date("2026-07-01")
    });
    expect(parseScriptFilters({ query: " pedido ", includeObsolete: "1", reviewDue: "true" })).toMatchObject({ query: "pedido", includeObsolete: true, reviewDue: true });
  });

  it("scopes SAC listing to validated scripts", async () => {
    const prisma = prismaMock();
    await listScriptLibrary(prisma as never, sac, {});

    expect(prisma.operationalScript.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "VALIDATED" }) }));
  });

  it("creates and validates scripts with audit/revision", async () => {
    const prisma = prismaMock();
    await createOperationalScript(prisma as never, admin, { categoryId: "cat-1", wikiPageId: "wiki-1", faqThreadId: "thread-1", title: "Rastreio", channel: "WHATSAPP", body: "Olá {nome_cliente}", tags: ["rastreio"] });
    prisma.operationalScript.findFirst.mockResolvedValueOnce({ id: "script-1", organizationId: "org-1" });
    await validateOperationalScript(prisma as never, admin, "script-1");

    expect(prisma.operationalScript.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ placeholdersJson: "[\"nome_cliente\"]", wikiPageId: "wiki-1", faqThreadId: "thread-1" }) }));
    expect(prisma.operationalScriptRevision.create).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "script.validate" }) }));
  });

  it("records copy events for visible scripts", async () => {
    const prisma = prismaMock();
    prisma.operationalScript.findFirst.mockResolvedValueOnce({ id: "script-1", organizationId: "org-1", tagsJson: "[]", placeholdersJson: "[]" });
    await recordScriptCopy(prisma as never, sac, "script-1", { renderedText: "Oi", placeholders: { nome_cliente: "Ana" } });

    expect(prisma.operationalScript.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usageCount: { increment: 1 } }) }));
    expect(prisma.operationalScriptEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "copy" }) }));
  });

  it("recertifies scripts with audit and event", async () => {
    const prisma = prismaMock();
    prisma.operationalScript.findFirst.mockResolvedValueOnce({ id: "script-1", organizationId: "org-1", reviewDueAt: new Date("2026-01-01") });
    await recertifyOperationalScript(prisma as never, admin, "script-1", { reviewDueAt: new Date("2026-08-01"), comment: "Politica conferida." });

    expect(prisma.operationalScript.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ recertifiedById: "admin-1", reviewDueAt: new Date("2026-08-01") }) }));
    expect(prisma.operationalScriptEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "recertify" }) }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "script.recertify" }) }));
  });
});
