import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  createOperationalScript,
  listScriptLibrary,
  parseOperationalScriptInput,
  parseScriptFilters,
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
    title: "Rastreio",
    channel: "WHATSAPP",
    body: "Olá {nome_cliente}",
    tagsJson: "[\"rastreio\"]",
    placeholdersJson: "[\"nome_cliente\"]",
    status: "DRAFT",
    createdById: "admin-1",
    updatedById: "admin-1",
    validatedById: null,
    validatedAt: null
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
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-1" })
    }
  };
}

describe("script library service", () => {
  it("parses script input and filters", () => {
    expect(parseOperationalScriptInput({ title: " Rastreio ", channel: "whatsapp", tags: ["#Entrega"], status: "validated" })).toMatchObject({
      title: "Rastreio",
      channel: "WHATSAPP",
      tags: ["entrega"],
      status: "VALIDATED"
    });
    expect(parseScriptFilters({ query: " pedido ", includeObsolete: "1" })).toMatchObject({ query: "pedido", includeObsolete: true });
  });

  it("scopes SAC listing to validated scripts", async () => {
    const prisma = prismaMock();
    await listScriptLibrary(prisma as never, sac, {});

    expect(prisma.operationalScript.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "VALIDATED" }) }));
  });

  it("creates and validates scripts with audit/revision", async () => {
    const prisma = prismaMock();
    await createOperationalScript(prisma as never, admin, { categoryId: "cat-1", title: "Rastreio", channel: "WHATSAPP", body: "Olá {nome_cliente}", tags: ["rastreio"] });
    prisma.operationalScript.findFirst.mockResolvedValueOnce({ id: "script-1", organizationId: "org-1" });
    await validateOperationalScript(prisma as never, admin, "script-1");

    expect(prisma.operationalScript.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ placeholdersJson: "[\"nome_cliente\"]" }) }));
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
});
