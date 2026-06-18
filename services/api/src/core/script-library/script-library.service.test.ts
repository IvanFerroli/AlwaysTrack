import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  createOperationalScript,
  createOperationalScriptSuggestion,
  decideOperationalScriptSuggestion,
  listScriptLibrary,
  parseOperationalScriptInput,
  parseScriptFilters,
  recertifyOperationalScript,
  recordScriptCopy,
  restoreOperationalScriptRevision,
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
    operationalScriptSuggestion: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "sug-1", organizationId: "org-1", authorId: "sac-1", title: "Sugestão", channel: "WHATSAPP", body: "Texto", tagsJson: "[]", status: "SUGGESTED", suggestionType: "NEW", category: null, script: null, author: sac }),
      update: vi.fn().mockResolvedValue({ id: "sug-1", organizationId: "org-1", authorId: "sac-1", title: "Sugestão", channel: "WHATSAPP", body: "Texto", tagsJson: "[]", status: "ACCEPTED", suggestionType: "NEW", category: null, script: null, author: sac, decidedBy: admin })
    },
    operationalScriptSearchEvent: {
      create: vi.fn().mockResolvedValue({ id: "search-1" }),
      findMany: vi.fn().mockResolvedValue([])
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
    },
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "admin-1" }])
    },
    inAppNotification: {
      upsert: vi.fn().mockResolvedValue({ id: "notif-1" }),
      create: vi.fn().mockResolvedValue({ id: "notif-1" })
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
    await listScriptLibrary(prisma as never, sac, { query: "sem resultado" });

    expect(prisma.operationalScript.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "VALIDATED" }) }));
    expect(prisma.operationalScriptSearchEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ query: "sem resultado", resultCount: 0 }) }));
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
    expect(prisma.operationalScriptEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "copy",
        metadataJson: JSON.stringify({ filledPlaceholders: ["nome_cliente"], serviceFlowSessionId: null, serviceFlowId: null, rendered: true })
      })
    }));
  });

  it("recertifies scripts with audit and event", async () => {
    const prisma = prismaMock();
    prisma.operationalScript.findFirst.mockResolvedValueOnce({ id: "script-1", organizationId: "org-1", reviewDueAt: new Date("2026-01-01") });
    await recertifyOperationalScript(prisma as never, admin, "script-1", { reviewDueAt: new Date("2026-08-01"), comment: "Politica conferida." });

    expect(prisma.operationalScript.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ recertifiedById: "admin-1", reviewDueAt: new Date("2026-08-01") }) }));
    expect(prisma.operationalScriptEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "recertify" }) }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "script.recertify" }) }));
  });

  it("restores script revisions only for admins", async () => {
    const prisma = prismaMock();
    prisma.operationalScript.findFirst.mockResolvedValueOnce({ id: "script-1", organizationId: "org-1" });
    prisma.operationalScriptRevision.findFirst
      .mockResolvedValueOnce({ id: "rev-old", organizationId: "org-1", scriptId: "script-1", version: 1, title: "Antigo", channel: "WHATSAPP", body: "Texto antigo", tagsJson: "[]", placeholdersJson: "[]", status: "VALIDATED" })
      .mockResolvedValueOnce({ version: 1 });

    await restoreOperationalScriptRevision(prisma as never, admin, "script-1", "rev-old");

    expect(prisma.operationalScript.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: "Antigo", body: "Texto antigo" }) }));
    expect(prisma.operationalScriptEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "restore" }) }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "script.restore_revision" }) }));
    await expect(restoreOperationalScriptRevision(prisma as never, sac, "script-1", "rev-old")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates and decides script suggestions", async () => {
    const prisma = prismaMock();
    await createOperationalScriptSuggestion(prisma as never, sac, { categoryId: "cat-1", title: "Sugestão", channel: "WHATSAPP", body: "Texto", tags: ["sac"] });
    expect(prisma.operationalScriptSuggestion.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authorId: "sac-1", suggestionType: "NEW", tagsJson: "[\"sac\"]" }) }));
    expect(prisma.inAppNotification.upsert).toHaveBeenCalled();

    prisma.operationalScriptSuggestion.findFirst.mockResolvedValueOnce({ id: "sug-1", organizationId: "org-1", authorId: "sac-1", title: "Sugestão", channel: "WHATSAPP", body: "Texto", tagsJson: "[]", status: "SUGGESTED", suggestionType: "NEW" });
    await decideOperationalScriptSuggestion(prisma as never, admin, "sug-1", { decision: "REJECTED", decisionComment: "Duplicada" });
    expect(prisma.operationalScriptSuggestion.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "REJECTED", decisionComment: "Duplicada", decidedById: "admin-1" }) }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "script_suggestion.decide" }) }));
  });

  it("requires decision comments when merging or rejecting suggestions", async () => {
    const prisma = prismaMock();
    await expect(decideOperationalScriptSuggestion(prisma as never, admin, "sug-1", { decision: "REJECTED" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(decideOperationalScriptSuggestion(prisma as never, admin, "sug-1", { decision: "MERGED" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(prisma.operationalScriptSuggestion.findFirst).not.toHaveBeenCalled();
  });
});
