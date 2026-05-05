import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import { analyzeDocumentWithAi } from "./document-ai.service.js";
import { FakeDocumentAiProvider, type DocumentAiProvider } from "./provider.js";

const admin: CurrentUser = {
  id: "admin-1",
  organizationId: "org-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  unitScopeIds: [],
  sectorScopeIds: []
};

describe("document ai service", () => {
  it("stores structured extraction without logging document bytes", async () => {
    const prisma = {
      document: {
        findFirst: vi.fn().mockResolvedValue({
          id: "doc-1",
          fileKey: "org-1/prof-1/lic-1/file.jpg",
          fileName: "carteira.jpg",
          mimeType: "image/jpeg",
          professional: {
            id: "prof-1",
            organizationId: "org-1",
            responsibleRtId: null,
            unitId: "unit-1",
            sectorId: "sector-1"
          },
          license: { id: "lic-1", licenseType: { id: "type-1", name: "COREN" } }
        })
      },
      documentAiExtraction: {
        create: vi.fn().mockResolvedValue({ id: "ext-1", provider: "fake", status: "PROCESSING" }),
        update: vi.fn().mockResolvedValue({
          id: "ext-1",
          provider: "unit",
          model: "unit-model",
          status: "COMPLETED",
          resultJson: "{}"
        })
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const storage = {
      get: vi.fn().mockResolvedValue({ fileKey: "x", body: Buffer.from("image-bytes"), mimeType: "image/jpeg" })
    };
    const provider: DocumentAiProvider = {
      provider: "unit",
      model: "unit-model",
      analyze: vi.fn().mockResolvedValue({
        documentKind: "professional_license",
        rawText: "COREN PB",
        fields: {
          professionalName: { value: " Maria Silva ", confidence: 0.9, evidence: "nome" },
          cpf: { value: null, confidence: null, evidence: null },
          licenseTypeName: { value: "COREN", confidence: 0.8, evidence: "tipo" },
          licenseNumber: { value: "12345", confidence: 0.8, evidence: "numero" },
          issuer: { value: "coren", confidence: 0.8, evidence: "emissor" },
          uf: { value: "pb", confidence: 0.8, evidence: "uf" },
          issuedAt: { value: null, confidence: null, evidence: null },
          expiresAt: { value: null, confidence: null, evidence: null }
        },
        warnings: []
      })
    };

    await analyzeDocumentWithAi(prisma as never, storage as never, provider, admin, "doc-1");

    expect(provider.analyze).toHaveBeenCalledWith({
      body: Buffer.from("image-bytes"),
      mimeType: "image/jpeg",
      fileName: "carteira.jpg"
    });
    expect(prisma.documentAiExtraction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          resultJson: expect.stringContaining("\"professionalName\":{\"value\":\"Maria Silva\"")
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "document_ai.analyze",
          metadataJson: expect.not.stringContaining("image-bytes")
        })
      })
    );
  });

  it("keeps fake provider local and explicit", async () => {
    await expect(new FakeDocumentAiProvider().analyze()).resolves.toMatchObject({
      warnings: [expect.stringContaining("DOCUMENT_AI_PROVIDER")]
    });
  });
});
